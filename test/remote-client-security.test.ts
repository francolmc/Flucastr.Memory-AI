import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:https';
import { execFile } from 'node:child_process';
import { writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { postF03 } from '../src/http-client.js';
import { createEphemeralTls } from './f03-tls.js';

const token = 'synthetic-secret-012345678901234567890';
test('remote client security matrix (synthetic loopback only)', async t => {
 const tls = createEphemeralTls();
 const other = createEphemeralTls();
 let status = 200, body = '{"memories":[]}', stall = false, hits = 0;
 const server = createServer({key:tls.key,cert:tls.cert}, (req,res) => {
  hits++; req.resume();
  if (stall) return;
  res.writeHead(status, {'content-type':'application/json', location:'/redirect-target'}); res.end(body);
 });
 const sockets = new Set<import('node:stream').Duplex>();
 server.on('connection', s => { sockets.add(s); s.on('close',()=>sockets.delete(s)); });
 try {
  await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));
  const address=server.address(); assert.ok(address && typeof address!=='string');
  const caPath=join(tls.directory,'ca-client.pem'), tokenPath=join(tls.directory,'token-client');
  writeFileSync(caPath,tls.ca); writeFileSync(tokenPath,token);
  const options={url:`https://127.0.0.1:${address.port}`,caPath,tokenPath};
  const call=()=>postF03(options,'/v1/search',{scope:'general',query:'synthetic'});
  const run=(args:string[])=>new Promise<{code:number;stdout:string;stderr:string}>(resolve=>execFile(process.execPath,[join(process.cwd(),'dist/src/remote-cli.js'),...args],{cwd:tls.directory,timeout:20000},(err,stdout,stderr)=>resolve({code:err ? typeof err.code==='number'?err.code:1:0,stdout,stderr})));
  const search=['search','--url',options.url,'--ca',caPath,'--token-file',tokenPath,'--scope','general','--query','synthetic'];
  await t.test('untrusted CA rejected',async()=>{
   const wrong=join(tls.directory,'wrong-ca.pem');writeFileSync(wrong,other.ca);
   await assert.rejects(postF03({...options,caPath:wrong},'/v1/search',{}));
  });
  await t.test('incorrect SAN rejected',async()=>{
   await assert.rejects(postF03({...options,url:`https://localhost:${address.port}`},'/v1/search',{}));
  });
  await t.test('actual redirects not followed; no write retries',async()=>{
   const before=hits;status=302;await assert.rejects(call());assert.equal(hits,before+1);status=200;
  });
  await t.test('401 and 403 fail without leaking token or response',async()=>{
   body=JSON.stringify({error:token});
   for(const code of [401,403]) {status=code;const result=await run(search);assert.equal(result.code,1);assert.equal(result.stdout,'');assert.equal(result.stderr,'Remote operation failed.\n');}
   status=200;body='{"memories":[]}';
  });
  await t.test('invalid and oversized responses fail closed',async()=>{
   const memory={id:'x',type:'decision',scope:'general',text:'x',origin:'synthetic',date:'2026-01-01',archived:false,conflict:false,replacesId:null};
   for(const value of ['not-json','[]','{}','{"memories":[{}]}',JSON.stringify({memories:Array(6).fill(memory)}),JSON.stringify({memories:[{...memory,text:'界'.repeat(1400)}]})]) {body=value;await assert.rejects(call());}
   const base=JSON.stringify({memories:[{...memory,text:''}]});
   body=JSON.stringify({memories:[{...memory,text:'a'.repeat(4000-Buffer.byteLength(base))}]});
   assert.equal(Buffer.byteLength(body),4000);assert.equal(await call(),body+'\n');
   body=body+' ';await assert.rejects(call());body='{"memories":[]}';
  });
  await t.test('invalid options do not connect or leak secrets',async()=>{
   const before=hits;
   for(const extra of [['--db','client.sqlite'],['--url',options.url],['--extra',token],['--archive','yes'],['--confirm-franco','yes'],['--confirm-general-rule','yes'],['--conflict','yes'],['--resolve-conflict','yes']]) {
    const result=await run([...search,...extra]);assert.equal(result.code,2);assert.equal(result.stdout,'');assert.equal(result.stderr,'Invalid command or options.\n');
   }
   assert.equal(hits,before);
  });
  await t.test('help does not load SQLite or local entry and creates no DB',async()=>{
   const hook=join(tls.directory,'deny-local.mjs');
   writeFileSync(hook,`import { registerHooks } from 'node:module'; registerHooks({resolve(s,c,n){if(s==='node:sqlite'||/(?:^|\\/)(?:index|memory|cli)\\.js$/.test(s))throw Error('forbidden module');return n(s,c);}});`);
   const result=await new Promise<{code:number;stdout:string}>(resolve=>execFile(process.execPath,['--import',hook,join(process.cwd(),'dist/src/remote-cli.js'),'--help'],{cwd:tls.directory},(err,stdout)=>resolve({code:err?1:0,stdout})));
   assert.equal(result.code,0);assert.match(result.stdout,/search/);
   assert.equal(readdirSync(tls.directory).some(name=>/\.(sqlite|db)(-|$)/.test(name)),false);
  });
  await t.test('idle request times out without retries',async()=>{
   stall=true;const before=hits;const start=Date.now();await assert.rejects(call());assert.ok(Date.now()-start>=14000);assert.equal(hits,before+1);stall=false;
  });
  await new Promise<void>(resolve=>{for(const socket of sockets)socket.destroy();server.close(()=>resolve());});
  await t.test('connection failure is generic',async()=>{const result=await run(search);assert.equal(result.code,1);assert.equal(result.stdout,'');assert.equal(result.stderr,'Remote operation failed.\n');});
 } finally {
  for(const socket of sockets)socket.destroy();
  if(server.listening)await new Promise<void>(resolve=>server.close(()=>resolve()));
  tls.cleanup();other.cleanup();
 }
});
