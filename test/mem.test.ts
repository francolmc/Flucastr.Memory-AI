import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { openAuthorizedMemory } from '../src/memory.js';
import { startLocalServer } from '../src/http-server.js';
import { createHttpAuthenticator, digestSyntheticKey } from '../src/http-auth.js';

const exec=promisify(execFile); const bin=join(process.cwd(),'dist/src/mem.js');
test('mem bin clients share remote memory and never create a local database on network failure', async()=>{
 const dir=mkdtempSync(join(tmpdir(),'mem-bin-')); const token='synthetic-token-012345678901234567890';
 const store=openAuthorizedMemory(join(dir,'server.sqlite'));
 let server: Awaited<ReturnType<typeof startLocalServer>>|undefined;
 try {
  server=await startLocalServer({store,auth:createHttpAuthenticator({state:{currentDigest:digestSyntheticKey(token),issuedAt:Date.now()}}),port:0});
  const gitRoot=join(dir,'git-project'); mkdirSync(join(gitRoot,'nested'),{recursive:true});
  await exec('git',['init','-q'],{cwd:gitRoot});
  const env={...process.env,MEM_URL:`http://127.0.0.1:${server.address.port}`,MEM_TOKEN:token,HOME:join(dir,'home')}; mkdirSync(env.HOME!,{recursive:true});
  const run=async(...args:string[])=>exec(process.execPath,[bin,...args],{cwd:dir,env,encoding:'utf8'});
  assert.match((await run('--help')).stdout,/save.*search.*recent.*forget/s);
  assert.match((await run('--help')).stdout,/mem init <claude-code\|cursor\|codex\|pi\|claude-desktop>/);
  const agentConfigForNegative=(await run('init','pi')).stdout;
  for (const agent of ['claude-code','cursor','pi','claude-desktop']) {
   const config=(await run('init',agent)).stdout;
   assert.doesNotMatch(config,/synthetic-token-012345678901234567890/);
   const parsed=JSON.parse(config) as {mcpServers:Record<string,{command:string;env?:Record<string,string>;type?:string}>};
   assert.equal(parsed.mcpServers['memory-ai']?.command,'memory-ai-mcp');
   if (agent==='claude-code') assert.equal(parsed.mcpServers['memory-ai']?.env?.MEM_TOKEN,'${MEM_TOKEN}');
   if (agent==='cursor') assert.equal(parsed.mcpServers['memory-ai']?.env?.MEM_TOKEN,'${env:MEM_TOKEN}');
   if (agent==='pi') assert.equal(parsed.mcpServers['memory-ai']?.env?.MEM_TOKEN,'${MEM_TOKEN}');
   if (agent==='cursor') assert.equal(parsed.mcpServers['memory-ai']?.type,'stdio');
  }
  for (const agent of ['claude-code','cursor','codex','pi','claude-desktop','chatgpt']) {
   const instructions=(await run('init',agent,'--instructions')).stdout;
   const lines=instructions.trim().split('\n');
   assert.ok(lines.length>=3 && lines.length<=5);
   assert.match(instructions,/Al inicio de cada tarea consulta el contexto de memoria/);
   assert.match(instructions,/busca antes de proponer/);
   assert.match(instructions,/Al cierre de la tarea propone como máximo tres recuerdos/);
   assert.match(instructions,/memory_propose o mem propose/);
   assert.match(instructions,/espera confirmación explícita del usuario; solo después usa mem confirm --id ID/);
   assert.match(instructions,/Nunca guardes automáticamente/);
   assert.match(instructions,/datos no confiables/);
   assert.doesNotMatch(instructions,/mcpServers|mcp_servers/);
  }
  await assert.rejects(run('init','chatgpt'));
  const codexConfig=(await run('init','codex')).stdout;
  // Strict parser for the emitted TOML subset; rejects prose and extra keys.
  const parseToml=(s:string)=>{
   const lines=s.trim().split('\n');
   assert.deepEqual(lines.slice(0,3),['[mcp_servers.memory-ai]','command = "memory-ai-mcp"','env_vars = ["MEM_URL", "MEM_TOKEN"]']);
   assert.deepEqual(lines.slice(3),['[mcp_servers.memory-ai.env]','MEM_AGENT = "codex"']);
  };
  parseToml(codexConfig);
  const extra=(await run('init','codex','--instructions')).stdout;
  assert.throws(()=>parseToml(codexConfig+extra));
  assert.throws(()=>JSON.parse((agentConfigForNegative)+extra));
  assert.match(codexConfig,/env_vars = \["MEM_URL", "MEM_TOKEN"\]/);
  assert.doesNotMatch(codexConfig,/synthetic-token-012345678901234567890/);
  const invalidInit=await exec(process.execPath,[bin,'init','unknown-agent'],{cwd:dir,env,encoding:'utf8'}).then(()=>{throw new Error('expected unknown-agent failure')},e=>e);
  assert.equal(invalidInit.code,2); assert.match(invalidInit.stderr,/agente no reconocido/);
  assert.match((await run('serve','--help')).stdout,/Usage: mem serve/);
  const runInGit=(...args:string[])=>exec(process.execPath,[bin,...args],{cwd:join(gitRoot,'nested'),env,encoding:'utf8'});
  const saved=JSON.parse((await runInGit('save','--type','decision','--text','shared from client')).stdout);
  const saved2=JSON.parse((await runInGit('save','--type','learning','--text','shared second client memory')).stdout);
  const found=JSON.parse((await runInGit('search','--query','shared')).stdout);
  assert.equal(found.memories.length,2); assert.ok(found.memories.some((m:{id:string})=>m.id===saved.id));
  const recent=JSON.parse((await runInGit('recent','--limit','1')).stdout);
  assert.equal(recent.memories.length,1); assert.ok([saved.id,saved2.id].includes(recent.memories[0].id));
  await run('forget','--id',saved.id);
  const afterForget=JSON.parse((await runInGit('search','--query','shared')).stdout);
  assert.deepEqual(afterForget.memories.map((m:{id:string})=>m.id),[saved2.id]);
  const explicit=JSON.parse((await run('save','--type','decision','--text','outside Git explicit scope','--scope','general')).stdout);
  assert.equal(JSON.parse((await run('search','--query','outside','--scope','general')).stdout).memories[0].id,explicit.id);
  const noScope=await exec(process.execPath,[bin,'save','--type','decision','--text','scope required'],{cwd:dir,env,encoding:'utf8'}).then(()=>{throw new Error('expected scope failure')},e=>e);
  assert.equal(noScope.code,2); assert.match(noScope.stderr,/Invalid command or options/);
 } finally { if(server) await server.close(); store.close(); rmSync(dir,{recursive:true,force:true}); }
 const offline=mkdtempSync(join(tmpdir(),'mem-offline-'));
 const offlineState=mkdtempSync(join(tmpdir(),'mem-offline-state-'));
 try {
  await assert.rejects(exec(process.execPath,[bin,'search','--query','x','--scope','general'],{cwd:offline,env:{...process.env,MEM_URL:'http://127.0.0.1:1',MEM_TOKEN:token,HOME:offline,XDG_STATE_HOME:offlineState},encoding:'utf8'}),/mem: servidor no disponible/);
  assert.deepEqual(readdirSync(offline),[]);
 } finally { rmSync(offline,{recursive:true,force:true}); rmSync(offlineState,{recursive:true,force:true}); }
});

test('metrics failure does not block real search and internal calls are not counted twice', async () => {
 const root=mkdtempSync(join(tmpdir(),'mem-stats-failure-'));
 const token='synthetic-token-for-stats-test-0123456789';
 const store=openAuthorizedMemory(join(root,'server.sqlite'));
 const server=await startLocalServer({store,auth:createHttpAuthenticator({state:{currentDigest:digestSyntheticKey(token),issuedAt:Date.now()}}),port:0});
 const env={...process.env,XDG_STATE_HOME:join(root,'state'),MEM_URL:`http://127.0.0.1:${server.address.port}`,MEM_TOKEN:token,MEM_AGENT:'pi'};
 const call=(e:NodeJS.ProcessEnv,...args:string[])=>exec(process.execPath,[bin,...args],{env:e,encoding:'utf8'});
 try {
  store.save({id:'stats-fixture',type:'decision',scope:'general',text:'findable evidence',origin:'test',date:'2026-11-16'});
  await call(env,'context','--scope','general');
  await call(env,'search','--query','findable','--scope','general');
  const rows=JSON.parse((await call(env,'stats')).stdout).stats;
  assert.deepEqual(rows,[{agent:'pi',tool:'context',count:1},{agent:'pi',tool:'search',count:1}]);
  const blocked=join(root,'not-directory'); writeFileSync(blocked,'x');
  const result=await call({...env,XDG_STATE_HOME:blocked},'search','--query','findable','--scope','general');
  assert.equal(JSON.parse(result.stdout).memories[0].id,'stats-fixture');
  assert.match(result.stderr,/estadísticas locales no disponibles/);
 } finally { await server.close(); store.close(); rmSync(root,{recursive:true,force:true}); }
});

test('CLI stats persist per agent including fallback', async () => {
 const root=mkdtempSync(join(tmpdir(),'mem-stats-'));
 const env={...process.env,XDG_STATE_HOME:root,MEM_URL:'http://127.0.0.1:1',MEM_TOKEN:'synthetic-token'};
 const call=(agent: string | undefined,...args:string[])=>exec(process.execPath,[bin,...args],{env:{...env,MEM_AGENT:agent},encoding:'utf8'});
 try {
  await assert.rejects(call('pi','search','--query','private query','--scope','general'));
  await call(undefined,'propose','--type','decision','--text','private proposal','--scope','general');
  const stats=JSON.parse((await call('pi','stats')).stdout).stats;
  assert.deepEqual(stats,[{agent:'pi',tool:'search',count:1},{agent:'desconocido',tool:'propose',count:1}]);
  assert.doesNotMatch(JSON.stringify(stats),/private|synthetic-token/);
 } finally { rmSync(root,{recursive:true,force:true}); }
});
