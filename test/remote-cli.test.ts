import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { openAuthorizedMemory } from '../src/memory.js';
import { startLocalServer } from '../src/http-server.js';
import { createHttpAuthenticator, digestSyntheticKey } from '../src/http-auth.js';

const cli=join(process.cwd(),'dist/src/remote-cli.js');
test('remote CLI uses authenticated HTTP loopback without loading local CLI/SQLite', async()=>{
 const dir=mkdtempSync(join(tmpdir(),'remote-cli-')); const token='synthetic-token-012345678901234567890';
 const store=openAuthorizedMemory(join(dir,'server.sqlite'));
 let server: Awaited<ReturnType<typeof startLocalServer>>|undefined;
 try {
  server=await startLocalServer({store,auth:createHttpAuthenticator({state:{currentDigest:digestSyntheticKey(token),issuedAt:Date.now()}}),port:0});
  const tf=join(dir,'token'), input=join(dir,'input.json'); writeFileSync(tf,token);
  const run=(...args:string[])=>new Promise<{status:number;stdout:string;stderr:string}>(resolve=>execFile(process.execPath,[cli,...args],{encoding:'utf8'},(error,stdout,stderr)=>resolve({status:error?.code && typeof error.code==='number' ? error.code : error ? 1 : 0,stdout,stderr})));
  const help=await run('--help');assert.equal(help.status,0);assert.match(help.stdout,/search/);assert.doesNotMatch(help.stderr,/sqlite|token/i);
  const invalid=await run('search','--db',join(dir,'client.sqlite'));assert.equal(invalid.status,2);assert.equal(invalid.stderr.includes(token),false);
  const origin=`http://127.0.0.1:${server.address.port}`;
  const memory={id:'synthetic-id',type:'decision',scope:'project:Atlas',text:'synthetic text',origin:'synthetic',date:'2026-01-01'};writeFileSync(input,JSON.stringify(memory));
  const saved=await run('save','--url',origin,'--token-file',tf,'--input',input);assert.equal(saved.status,0,saved.stderr);
  const found=await run('search','--url',origin,'--token-file',tf,'--scope','project:Atlas','--query','synthetic');assert.equal(found.status,0,found.stderr);assert.equal(JSON.parse(found.stdout).memories.length,1);assert.ok(found.stdout.endsWith('\n'));
  const again=await run('save','--url',origin,'--token-file',tf,'--input',input);assert.equal(again.status,0);assert.deepEqual(JSON.parse(again.stdout),JSON.parse(saved.stdout));
  writeFileSync(input,JSON.stringify({...memory,text:'collision'}));
  const collision=await run('save','--url',origin,'--token-file',tf,'--input',input);assert.equal(collision.status,1);assert.equal(collision.stdout,'');assert.equal(collision.stderr.includes(token),false);
  writeFileSync(input,JSON.stringify({...memory,id:'birch-id',scope:'project:Birch'}));
  const birch=await run('save','--url',origin,'--token-file',tf,'--input',input);assert.equal(birch.status,0);
  const atlasOnly=await run('search','--url',origin,'--token-file',tf,'--scope','project:Atlas','--query','synthetic');assert.equal(atlasOnly.status,0);assert.deepEqual(JSON.parse(atlasOnly.stdout).memories.map((m:{id:string})=>m.id),['synthetic-id']);
  const otherScope=await run('search','--url',origin,'--token-file',tf,'--scope','project:Other','--query','synthetic');assert.equal(otherScope.status,0,otherScope.stderr);assert.deepEqual(JSON.parse(otherScope.stdout).memories,[]);
  const invalidScope=await run('search','--url',origin,'--token-file',tf,'--scope','project: bad','--query','synthetic');assert.equal(invalidScope.status,1);

  const redirect=await run('search','--url',origin,'/');assert.notEqual(redirect.status,0);
  const imports=await run('--help');assert.equal(imports.status,0);assert.equal(imports.stdout.includes('SQLite'),false);assert.equal(imports.status,0);
 } finally {if(server) await server.close();store.close();rmSync(dir,{recursive:true,force:true});}
});
