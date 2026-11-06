import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request } from 'node:http';
import { openAuthorizedMemory, openMemory } from '../src/memory.js';
import { startLocalServer } from '../src/http-server.js';

const key = 'synthetic-f03-key-012345678901234567890';
test('HTTP loopback enforces Bearer authorization and route contract', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'f03-db-'));
  const store = openAuthorizedMemory(join(dir, 'memory.sqlite'));
  let server: Awaited<ReturnType<typeof startLocalServer>> | undefined;
  try {
    server = await startLocalServer({store, auth: {validate: (h: Headers) => h.get('authorization') === `Bearer ${key}`} as never, port:0});
    assert.equal(server.address.address,'127.0.0.1');
    const port = server.address.port;
    const send = (path:string, body:unknown, options: {authorization?:string} = {authorization:`Bearer ${key}`}): Promise<{status:number;body:string}> => new Promise((resolve,reject) => {
      const req=request({host:'127.0.0.1',port,path,method:'POST',headers:{'content-type':'application/json',...(options.authorization?{authorization:options.authorization}:{})}},res=>{let text='';res.setEncoding('utf8');res.on('data',v=>text+=v);res.on('end',()=>resolve({status:res.statusCode!,body:text}));}); req.on('error',reject);req.end(JSON.stringify(body));
    });
    const mem=(id:string,scope='project:SampleOne',text=id)=>({id,type:'decision',scope,text,origin:'synthetic',date:'2026-02-03'});
    assert.equal((await send('/v1/memories',{memory:mem('a','project:SampleOne','needle alpha')})).status,200);
    assert.equal((await send('/v1/memories',{memory:mem('b','project:SampleTwo','needle beta')})).status,200);
    assert.equal((await send('/v1/memories',{memory:mem('g','general','needle common')})).status,200);
    assert.equal((await send('/v1/memories',{memory:mem('a','project:SampleOne','needle alpha')})).status,200);
    assert.equal((await send('/v1/memories',{memory:mem('a','project:SampleOne','collision')})).status,403);
    assert.equal((await send('/v1/search',{scope:'project:SampleOne',query:'needle'})).status,200);
    const search=await send('/v1/search',{scope:'project:SampleOne',query:'needle'}); const parsed=JSON.parse(search.body) as {memories:{id:string}[]};
    assert.deepEqual(parsed.memories.map(x=>x.id).sort(),['a','g']); assert.ok(Buffer.byteLength(search.body)<=4000); assert.equal(search.body.endsWith('\n'),true);
    const otherSearch=await send('/v1/search',{scope:'project:Other',query:'needle'});
    assert.equal(otherSearch.status,200);
    assert.deepEqual((JSON.parse(otherSearch.body) as {memories:{id:string}[]}).memories.map(x=>x.id).sort(),['g']);
    assert.equal((await send('/v1/search',{scope:'project: bad',query:'needle'})).status,403);
    assert.equal((await send('/v1/replacements',{memory:mem('a2','project:SampleOne','replacement'),previousId:'a'})).status,200);
    assert.equal((await send('/v1/replacements',{memory:mem('x','project:SampleOne','bad'),previousId:'b'})).status,403);
    assert.equal((await send('/v1/conflicts',{ids:['a','a2']})).status,200);
    for(const body of [{ids:['a2','b']},{ids:['missing','a2']},{ids:[]},{ids:['a2'] }]) assert.equal((await send('/v1/conflicts',body)).status,403);
    for(const path of ['/v1/resolve','/v1/archive','/v1/restore','/v1/keys','/v1/backup','/v1/sanitize']) assert.equal((await send(path,{})).status,404);
    assert.equal((await send('/v1/search',{scope:'project:Other',query:'needle'},{authorization:'Bearer invalid'})).status,401);
    assert.equal((await send('/v1/search?x=1',{scope:'general',query:'needle'})).status,401);
    assert.equal((await send('/v1/search',{scope:'general',query:'needle',extra:true})).status,400);
    await server.close();
  } finally { if (server) await server.close().catch(()=>{}); store.close(); rmSync(dir,{recursive:true,force:true}); }
});

test('search omits whole oversized Unicode records and stays within serialized UTF-8 cap', async()=>{
  const dir=mkdtempSync(join(tmpdir(),'f03-out-'));const store=openMemory(join(dir,'memory.sqlite'));
  let server: Awaited<ReturnType<typeof startLocalServer>> | undefined;
  try { server=await startLocalServer({store: {save:store.save,replace:store.save,markConflict:()=>{},search:()=>[{id:'oversized',type:'learning',scope:'general',text:'needle '+'界'.repeat(5000),origin:'synthetic',date:'2026-01-01',archived:false,conflict:false,replacesId:null}],close:()=>{}} as never,auth:{validate:()=>true} as never,port:0});
    const port=server.address.port;
    const body=await new Promise<string>((resolve,reject)=>{const req=request({host:'127.0.0.1',port,path:'/v1/search',method:'POST',headers:{authorization:'Bearer synthetic', 'content-type':'application/json'}},res=>{let s='';res.setEncoding('utf8');res.on('data',v=>s+=v);res.on('end',()=>resolve(s));});req.on('error',reject);req.end(JSON.stringify({scope:'general',query:'needle'}));});
    assert.deepEqual(JSON.parse(body),{memories:[]});assert.ok(Buffer.byteLength(body)<=4000);await server.close();
  } finally {if(server) await server.close().catch(()=>{});store.close();rmSync(dir,{recursive:true,force:true});}
});
