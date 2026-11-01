import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { request } from 'node:https';
import { startLocalServer } from '../src/http-server.js';
import type { HttpAuthenticator } from '../src/http-auth.js';
import type { AuthorizedMemoryStore } from '../src/memory.js';

test('HTTPS loopback enforces closed routes and authentication before payload, then closes', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'f03-tls-'));
  try {
    const generated = spawnSync('openssl', ['req','-x509','-newkey','rsa:2048','-nodes','-keyout',join(dir,'key.pem'),'-out',join(dir,'cert.pem'),'-days','1','-subj','/CN=127.0.0.1','-addext','subjectAltName=IP:127.0.0.1'], { stdio:'ignore' });
    assert.equal(generated.status,0, 'openssl is required only to generate ephemeral test TLS material');
    let calls = 0;
    const store = { save(){ calls++; throw Error('sensitive body'); }, replace(){calls++;throw Error('secret');}, markConflict(){calls++;throw Error('private');}, search(){calls++;return [];} , close(){} } as unknown as AuthorizedMemoryStore;
    const auth = { validate: (headers: Headers) => headers.get('authorization') === 'Bearer synthetic-test-key-012345678901234567890', rotate(){return '';}, revoke(){}, install(){} } as HttpAuthenticator;
    const server = await startLocalServer({ store, auth, tls:{key:readFileSync(join(dir,'key.pem')),cert:readFileSync(join(dir,'cert.pem'))}, port:0 });
    assert.equal(server.address.address,'127.0.0.1');
    const send = (path:string, body:string, authorization?:string) => new Promise<{status:number; body:string}>((resolve,reject)=>{
      const req=request({host:'127.0.0.1',port:server.address.port,path,method:'POST',rejectUnauthorized:false,headers:{'content-type':'application/json',...(authorization?{authorization}:{})}},res=>{let text='';res.setEncoding('utf8');res.on('data',v=>text+=v);res.on('end',()=>resolve({status:res.statusCode!,body:text}));}); req.on('error',reject);req.end(body);
    });
    assert.equal((await send('/v1/memories','not json')).status,401); assert.equal(calls,0);
    assert.equal((await send('/v1/memories','{}','Bearer synthetic-test-key-012345678901234567890')).status,400); assert.equal(calls,0);
    const response = await send('/v1/memories','{"memory":{},"confirmedByFranco":true}','Bearer synthetic-test-key-012345678901234567890');
    assert.equal(response.status,400); assert.doesNotMatch(response.body,/sensitive|secret|private/); assert.equal(calls,0);
    assert.equal((await send('/v1/resolve','{}','Bearer synthetic-test-key-012345678901234567890')).status,404);
    await server.close();
    await assert.rejects(startLocalServer({store,auth,tls:{key:'invalid',cert:'invalid'},port:0}));
  } finally { rmSync(dir,{recursive:true,force:true}); }
});
