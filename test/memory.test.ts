import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { openMemory, type MemoryInput } from '../src/index.js';
const sample: MemoryInput = { id:'m1',type:'decision',scope:'project:Atlas',text:'Keep it literal',origin:'test',date:'2024-02-29' };
test('persists, retries idempotently, rejects collisions, and preserves repeated text', () => {
 const dir=mkdtempSync(join(tmpdir(),'memory-')); const path=join(dir,'memory.sqlite');
 try { let store=openMemory(path); assert.deepEqual(store.save(sample),sample); assert.deepEqual(store.save({...sample}),sample); assert.throws(()=>store.save({...sample,text:'different'}),/collision/); assert.deepEqual(store.save({...sample,id:'m2'}),{...sample,id:'m2'}); store.close(); store=openMemory(path); assert.deepEqual(store.save(sample),sample); assert.throws(()=>store.save({...sample,text:'changed'}),/collision/); assert.throws(()=>store.save({...sample,date:'2024-02-30'}),/date/); store.close(); } finally {rmSync(dir,{recursive:true,force:true});}
});
test('requires confirmation for general rules',()=>{const dir=mkdtempSync(join(tmpdir(),'memory-'));const store=openMemory(join(dir,'memory.sqlite'));try{const rule={...sample,id:'rule',type:'rule' as const,scope:'general'};assert.throws(()=>store.save(rule),/requires confirmGeneralRule/);store.save(rule,{confirmGeneralRule:true});}finally{store.close();rmSync(dir,{recursive:true,force:true});}});
test('replacement, persistent conflicts, and archive retain records',()=>{const dir=mkdtempSync(join(tmpdir(),'memory-'));const path=join(dir,'memory.sqlite');try{let store=openMemory(path);store.save(sample);store.save({...sample,id:'m2',text:'replacement'},{replacesId:'m1'});assert.throws(()=>store.save({...sample,id:'m1',text:'x'},{replacesId:'m1'}),/self/);store.markConflict(['m1','m2']);assert.equal(store.list().filter(x=>x.conflict).length,2);store.close();store=openMemory(path);assert.equal(store.list().filter(x=>x.conflict).length,2);assert.throws(()=>store.resolveConflict(['m1','m2'],{} as never),/confirmation/);store.resolveConflict(['m1','m2'],{confirmedByFranco:true});store.archive('m1',{confirmedByFranco:true});const rows=store.list();assert.equal(rows.length,2);assert.equal(rows.find(x=>x.id==='m1')?.archived,true);assert.equal(rows.some(x=>x.conflict),false);store.close();}finally{rmSync(dir,{recursive:true,force:true});}});
