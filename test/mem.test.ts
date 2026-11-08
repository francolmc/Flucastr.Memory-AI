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
 try {
  await assert.rejects(exec(process.execPath,[bin,'search','--query','x','--scope','general'],{cwd:offline,env:{...process.env,MEM_URL:'http://127.0.0.1:1',MEM_TOKEN:token,HOME:offline},encoding:'utf8'}),/mem: servidor no disponible/);
  assert.deepEqual(readdirSync(offline),[]);
 } finally { rmSync(offline,{recursive:true,force:true}); }
});
