import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { openMemory, type MemoryInput } from '../src/index.js';
const sample: MemoryInput = { id:'m1',type:'decision',scope:'project:ProjectOne',text:'Keep it literal',origin:'test',date:'2024-02-29' };
test('search includes general memories in projects and isolates project scopes', () => {
 const dir=mkdtempSync(join(tmpdir(),'memory-search-')); const store=openMemory(join(dir,'memory.sqlite'));
 try {
  const add=(id:string,scope:string)=>store.save({id,type:'learning',scope,text:'shared token',origin:'test',date:'2024-01-01'});
  add('general-local','general'); add('projectOne-local','project:ProjectOne'); add('projectTwo-local','project:ProjectTwo');
  const ids=(scope:string,query='shared')=>new Set(store.search({scope,query}).map(row=>row.id));
  assert.deepEqual(ids('project:ProjectOne'),new Set(['general-local','projectOne-local']));
  assert.deepEqual(ids('project:ProjectTwo'),new Set(['general-local','projectTwo-local']));
  assert.deepEqual(ids('general'),new Set(['general-local']));
  assert.deepEqual(ids('project:ProjectOne','absent'),new Set());
 } finally {store.close();rmSync(dir,{recursive:true,force:true});}
});
test('unicode61 literal AND, stopwords, repeated calls, ties, and eligible-only ranking', () => {
 const dir=mkdtempSync(join(tmpdir(),'memory-ranking-'));const store=openMemory(join(dir,'memory.sqlite'));
 try {
  const add=(id:string,scope:string,text:string)=>store.save({id,type:'learning',scope,text,origin:'test',date:'2024-01-01'});
  add('a','project:ProjectOne','café 東京 the'); add('b','project:ProjectOne','café 東京 the');
  assert.deepEqual(store.search({scope:'project:ProjectOne',query:'café 東京 the'}).map(x=>x.id),['a','b']);
  assert.deepEqual(store.search({scope:'project:ProjectOne',query:'café absent'}),[]);
  assert.deepEqual(store.search({scope:'project:ProjectOne',query:'" OR * : ( )'}),[]);
  add('foreign','project:ProjectTwo','café 東京 the café café café');
  add('archived','project:ProjectOne','café 東京 the café café café');store.archive('archived',{confirmedByFranco:true});
  assert.deepEqual(store.search({scope:'project:ProjectOne',query:'café 東京 the'}).map(x=>x.id),['a','b']);
  assert.deepEqual(store.search({scope:'general',query:'café 東京 the'}),[]);
  assert.deepEqual(store.search({scope:'project:ProjectOne',query:'!!!'}),[]);
 } finally {store.close();rmSync(dir,{recursive:true,force:true});}
});
test('rebuilds legacy Porter FTS index on open while retaining existing memories', () => {
 const dir=mkdtempSync(join(tmpdir(),'memory-migration-'));const path=join(dir,'memory.sqlite');
 try {const db=new DatabaseSync(path);db.exec(`CREATE TABLE memories(id TEXT PRIMARY KEY,type TEXT NOT NULL,scope TEXT NOT NULL,text TEXT NOT NULL,origin TEXT NOT NULL,date TEXT NOT NULL,canonical TEXT NOT NULL,replaces_id TEXT,archived INTEGER NOT NULL DEFAULT 0,conflict INTEGER NOT NULL DEFAULT 0); INSERT INTO memories VALUES('legacy','learning','general','café 東京 the','test','2024-01-01','[]',NULL,0,0); CREATE VIRTUAL TABLE memories_fts USING fts5(id UNINDEXED,text,tokenize='porter unicode61'); INSERT INTO memories_fts VALUES('legacy','café 東京 the'); PRAGMA user_version=1;`);db.close();
  const store=openMemory(path);try{assert.deepEqual(store.search({scope:'general',query:'café 東京 the'}).map(x=>x.id),['legacy']);assert.equal(store.list().length,1);}finally{store.close();}
 } finally {rmSync(dir,{recursive:true,force:true});}
});
test('persists, retries idempotently, rejects collisions, and preserves repeated text', () => {
 const dir=mkdtempSync(join(tmpdir(),'memory-')); const path=join(dir,'memory.sqlite');
 try { let store=openMemory(path); assert.deepEqual(store.save(sample),sample); assert.deepEqual(store.save({...sample}),sample); assert.throws(()=>store.save({...sample,text:'different'}),/collision/); assert.deepEqual(store.save({...sample,id:'m2'}),{...sample,id:'m2'}); store.close(); store=openMemory(path); assert.deepEqual(store.save(sample),sample); assert.throws(()=>store.save({...sample,text:'changed'}),/collision/); assert.throws(()=>store.save({...sample,date:'2024-02-30'}),/date/); store.close(); } finally {rmSync(dir,{recursive:true,force:true});}
});
test('requires confirmation for general rules',()=>{const dir=mkdtempSync(join(tmpdir(),'memory-'));const store=openMemory(join(dir,'memory.sqlite'));try{const rule={...sample,id:'rule',type:'rule' as const,scope:'general'};assert.throws(()=>store.save(rule),/requires confirmGeneralRule/);store.save(rule,{confirmGeneralRule:true});}finally{store.close();rmSync(dir,{recursive:true,force:true});}});
test('replacement, persistent conflicts, and archive retain records',()=>{const dir=mkdtempSync(join(tmpdir(),'memory-'));const path=join(dir,'memory.sqlite');try{let store=openMemory(path);store.save(sample);store.save({...sample,id:'m2',text:'replacement'},{replacesId:'m1'});assert.throws(()=>store.save({...sample,id:'m1',text:'x'},{replacesId:'m1'}),/self/);store.markConflict(['m1','m2']);assert.equal(store.list().filter(x=>x.conflict).length,2);store.close();store=openMemory(path);assert.equal(store.list().filter(x=>x.conflict).length,2);assert.throws(()=>store.resolveConflict(['m1','m2'],{} as never),/confirmation/);store.resolveConflict(['m1','m2'],{confirmedByFranco:true});store.archive('m1',{confirmedByFranco:true});const rows=store.list();assert.equal(rows.length,2);assert.equal(rows.find(x=>x.id==='m1')?.archived,true);assert.equal(rows.some(x=>x.conflict),false);store.close();}finally{rmSync(dir,{recursive:true,force:true});}});
