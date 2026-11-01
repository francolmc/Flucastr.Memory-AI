import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { openMemory, serializeSearch } from '../src/index.js';
import type { MemoryInput } from '../src/memory.js';

const fixture = (name: string) => join(process.cwd(), 'fixtures', 'f02', name);
const corpus = JSON.parse(readFileSync(fixture('corpus.json'), 'utf8')) as MemoryInput[];
const queries = JSON.parse(readFileSync(fixture('queries.json'), 'utf8')) as { scope: string; query: string; expectedIds: string[] }[];
const baseline = readFileSync(fixture('baseline.txt'), 'utf8');
const bytes = (text: string) => Buffer.byteLength(text, 'utf8');

test('F02 frozen synthetic gate and descriptive byte report', () => {
  assert.equal(corpus.length, 30);
  assert.equal(queries.length, 10);
  assert.deepEqual(new Set(corpus.map(x => x.type)), new Set(['decision', 'learning', 'resolved-blocker', 'rule']));
  assert.deepEqual(new Set(corpus.map(x => x.scope)), new Set(['general', 'project:Atlas', 'project:Birch']));
  assert.equal(baseline, `${corpus.map(x => x.text).join('\n')}\n`);
  const dir = mkdtempSync(join(tmpdir(), 'f02-gate-'));
  const db = join(dir, 'memory.sqlite');
  try {
    let store = openMemory(db);
    for (const memory of corpus) store.save(memory, { confirmGeneralRule: true });
    store.close();
    store = openMemory(db);
    assert.equal(store.list().length, 30, 'all memories survive database reopen');
    assert.throws(() => store.save({ ...corpus[0]!, text: 'changed same identity' }, { confirmGeneralRule: true }), /collision/);
    assert.equal(store.search({ scope: 'general', query: 'CSV finance reports' }).length, 0, 'general cannot see project memories');
    assert.equal(store.search({ scope: 'project:Atlas', query: 'credentials logs' }).some(x => x.id === 'g-05'), true, 'project includes general memories');
    assert.equal(store.search({ scope: 'project:Atlas', query: 'UTC event times' }).some(x => x.scope === 'project:Birch'), false, 'project isolation');
    assert.deepEqual(store.search({ scope: 'project:Atlas', query: 'no matching token qzxv' }), []);
    store.save({ id: 'ref-new', type: 'decision', scope: 'project:Atlas', text: 'Replacement item', origin: 'gate', date: '2025-04-01' }, { replacesId: 'p:Atlas-01' });
    store.markConflict(['p:Atlas-01', 'ref-new']);
    assert.equal(store.list().find(x => x.id === 'ref-new')?.conflict, true);
    store.resolveConflict(['p:Atlas-01', 'ref-new'], { confirmedByFranco: true });
    store.archive('p:Atlas-05', { confirmedByFranco: true });
    assert.equal(store.search({ scope: 'project:Atlas', query: 'blue labels awaiting review' }).some(x => x.id === 'p:Atlas-05'), false);
    store.close();

    const check = openMemory(db);
    const reports: string[] = [];
    for (const item of queries) {
      const result = check.search(item);
      const serialized = serializeSearch(result);
      const parsed = JSON.parse(serialized) as { memories: { id: string }[] };
      assert.ok(parsed.memories.length <= 5);
      assert.ok(bytes(serialized) <= 4000);
      for (const expected of item.expectedIds) assert.ok(parsed.memories.some(x => x.id === expected), `${item.query}: ${expected} absent from top5`);
      const delta = bytes(baseline) - bytes(serialized);
      const percent = bytes(baseline) === 0 ? 0 : delta / bytes(baseline) * 100;
      reports.push(`${item.scope} | ${item.query} | baseline=${bytes(baseline)} B | response=${bytes(serialized)} B | difference=${Math.abs(delta)} B (${percent.toFixed(2)}% signed)`);
    }
    check.close();
    console.log(`F02 synthetic test only; no real-use or savings claim.\n${reports.join('\n')}`);

    const huge = { id: 'large', type: 'learning' as const, scope: 'general', text: 'x'.repeat(5000), origin: 'gate', date: '2025-04-02', archived: false, conflict: false, replacesId: null };
    const small = { ...huge, id: 'small', text: 'small complete record' };
    const bounded = serializeSearch([huge, small]);
    assert.ok(bytes(bounded) <= 4000);
    assert.deepEqual((JSON.parse(bounded) as { memories: { id: string }[] }).memories.map(x => x.id), ['small'], 'oversized records are omitted whole');
    assert.throws(() => openMemory(':memory:').save(corpus[0]!));
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
