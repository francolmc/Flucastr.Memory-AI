import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request } from 'node:http';
import { openAuthorizedMemory } from '../src/memory.js';
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
    const collision=await send('/v1/memories',{memory:mem('a','project:SampleOne','collision')});
    assert.equal(collision.status,409); assert.deepEqual(JSON.parse(collision.body),{error:'id_conflict'});
    assert.equal((await send('/v1/search',{scope:'project:SampleOne',query:'needle'})).status,200);
    const search=await send('/v1/search',{scope:'project:SampleOne',query:'needle'}); const parsed=JSON.parse(search.body) as {memories:{id:string}[]};
    assert.deepEqual(parsed.memories.map(x=>x.id).sort(),['a','g']); assert.deepEqual(Object.keys(parsed.memories[0]!).sort(),['date','id','origin','scope','text','type']); assert.ok(Buffer.byteLength(search.body)<=4000); assert.equal(search.body.endsWith('\n'),true);
    const otherSearch=await send('/v1/search',{scope:'project:Other',query:'needle'});
    assert.equal(otherSearch.status,200);
    assert.deepEqual((JSON.parse(otherSearch.body) as {memories:{id:string}[]}).memories.map(x=>x.id).sort(),['g']);
    assert.equal((await send('/v1/search',{scope:'project: bad',query:'needle'})).status,400);
    assert.equal((await send('/v1/replacements',{memory:mem('a2','project:SampleOne','replacement'),previousId:'a'})).status,404);
    assert.equal((await send('/v1/conflicts',{ids:['a','b']})).status,404);
    const recent=await send('/v1/recent',{scope:'project:SampleOne'});
    assert.equal(recent.status,200); assert.deepEqual((JSON.parse(recent.body) as {memories:{id:string}[]}).memories.map(x=>x.id),['a','g']);
    assert.equal((await send('/v1/recent',{scope:'project:SampleOne',limit:0})).status,400);
    for(const id of ['search-5','search-3','search-1','search-4','search-0','search-2']) assert.equal((await send('/v1/memories',{memory:mem(id,'project:Search',`alpha item ${id}`)})).status,200);
    const many=await send('/v1/search',{scope:'project:Search',query:'alpha absent'});
    const manyRows=(JSON.parse(many.body) as {memories:{id:string}[]}).memories;
    assert.equal(manyRows.length,5);assert.deepEqual(manyRows.map(x=>x.id),['search-0','search-1','search-2','search-3','search-4']);assert.ok(Buffer.byteLength(many.body)<=4000);
    for(const id of Array.from({length:17},(_,i)=>`recent-${String(16-i).padStart(2,'0')}`)) assert.equal((await send('/v1/memories',{memory:mem(id,'project:Recent',`wide ${id} ${'界'.repeat(400)}`)})).status,200);
    const recentWide=await send('/v1/recent',{scope:'project:Recent'});
    const recentRows=(JSON.parse(recentWide.body) as {memories:{id:string}[]}).memories;
    assert.equal(recentRows.length,15);assert.ok(Buffer.byteLength(recentWide.body)>4000);assert.deepEqual(recentRows.map(x=>x.id),['g',...Array.from({length:14},(_,i)=>`recent-${String(i).padStart(2,'0')}`)]);
    assert.deepEqual((JSON.parse((await send('/v1/recent',{scope:'project:Recent',limit:3})).body) as {memories:{id:string}[]}).memories.map(x=>x.id),['g','recent-00','recent-01']);
    for(const limit of [0,-1,1.5,'3',null]) assert.equal((await send('/v1/recent',{scope:'project:Recent',limit})).status,400);
    assert.deepEqual(JSON.parse((await send('/v1/forget',{id:'a'})).body),{ok:true});
    assert.deepEqual(JSON.parse((await send('/v1/forget',{id:'a'})).body),{ok:true});
    assert.deepEqual((JSON.parse((await send('/v1/search',{scope:'project:SampleOne',query:'alpha'})).body) as {memories:unknown[]}).memories,[]);
    assert.equal((await send('/v1/memories',{memory:mem('a','project:SampleOne','alpha')})).status,200);
    for(const body of [{scope:'general',query:'needle',extra:true},{scope:'general',limit:2,extra:true}]) assert.equal((await send('/v1/search',body)).status,400);
    for(const path of ['/v1/resolve','/v1/archive','/v1/restore','/v1/keys','/v1/backup','/v1/sanitize']) assert.equal((await send(path,{})).status,404);
    assert.equal((await send('/v1/search',{scope:'project:Other',query:'needle'},{authorization:'Bearer invalid'})).status,401);
    assert.equal((await send('/v1/search?x=1',{scope:'general',query:'needle'})).status,401);
    assert.equal((await send('/v1/search',{scope:'general',query:'needle',extra:true})).status,400);
    assert.equal((await send('/v1/search',{scope:'general',query:'needle'}, {authorization:`Bearer ${key}`})).status,200);
    const failing=await startLocalServer({store:{save(){throw new Error('private SQL detail');},search(){throw new Error('private SQL detail');},recent(){throw new Error('private SQL detail');},forget(){throw new Error('private SQL detail');},close(){}} as never,auth:{validate:()=>true} as never,port:0});
    try {
      const result=await new Promise<{status:number;body:string}>((resolve,reject)=>{const req=request({host:'127.0.0.1',port:failing.address.port,path:'/v1/search',method:'POST',headers:{authorization:'Bearer synthetic','content-type':'application/json'}},res=>{let body='';res.setEncoding('utf8');res.on('data',v=>body+=v);res.on('end',()=>resolve({status:res.statusCode!,body}));});req.on('error',reject);req.end(JSON.stringify({scope:'general',query:'needle'}));});
      assert.equal(result.status,500);assert.deepEqual(JSON.parse(result.body),{error:'internal_error'});assert.doesNotMatch(result.body,/private SQL detail/);
    } finally { await failing.close(); }
    await server.close();
  } finally { if (server) await server.close().catch(()=>{}); store.close(); rmSync(dir,{recursive:true,force:true}); }
});

test('SQLite HTTP search keeps near-limit Unicode and omits the next whole oversized record', async()=>{
  const dir=mkdtempSync(join(tmpdir(),'f03-out-'));const store=openAuthorizedMemory(join(dir,'memory.sqlite'));
  let server: Awaited<ReturnType<typeof startLocalServer>> | undefined;
  try {
    store.save({id:'a-near',type:'learning',scope:'general',text:'needle '+'界'.repeat(1230),origin:'synthetic',date:'2026-01-01'});
    store.save({id:'z-over',type:'learning',scope:'general',text:'needle '+'界'.repeat(1400),origin:'synthetic',date:'2026-01-01'});
    server=await startLocalServer({store,auth:{validate:()=>true} as never,port:0});
    const port=server.address.port;
    const body=await new Promise<string>((resolve,reject)=>{const req=request({host:'127.0.0.1',port,path:'/v1/search',method:'POST',headers:{authorization:'Bearer synthetic', 'content-type':'application/json'}},res=>{let s='';res.setEncoding('utf8');res.on('data',v=>s+=v);res.on('end',()=>resolve(s));});req.on('error',reject);req.end(JSON.stringify({scope:'general',query:'needle'}));});
    const parsed=JSON.parse(body) as {memories:Record<string,string>[]};
    assert.equal(parsed.memories.length,1);assert.equal(parsed.memories[0]!.id,'a-near');assert.equal(parsed.memories[0]!.text,'needle '+'界'.repeat(1230));
    assert.deepEqual(Object.keys(parsed.memories[0]!).sort(),['date','id','origin','scope','text','type']);
    assert.ok(Buffer.byteLength(body)>3500);assert.ok(Buffer.byteLength(body)<=4000);await server.close();
  } finally {if(server) await server.close().catch(()=>{});store.close();rmSync(dir,{recursive:true,force:true});}
});
