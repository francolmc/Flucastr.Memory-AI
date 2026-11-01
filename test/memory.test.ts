import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { openMemory, type MemoryInput } from '../src/index.js';

const sample: MemoryInput = { id: 'm1', type: 'decision', scope: 'project:Atlas', text: 'Keep it literal', origin: 'test', date: '2024-02-29' };

test('persists, retries idempotently, rejects collisions, and preserves repeated text', () => {
  const dir = mkdtempSync(join(tmpdir(), 'memory-'));
  const path = join(dir, 'memory.sqlite');
  try {
    let store = openMemory(path);
    assert.deepEqual(store.save(sample), sample);
    assert.deepEqual(store.save({ date: sample.date, origin: sample.origin, text: sample.text, scope: sample.scope, type: sample.type, id: sample.id }), sample);
    assert.throws(() => store.save({ ...sample, text: 'different' }), /collision/);
    assert.deepEqual(store.save({ ...sample, id: 'm2' }), { ...sample, id: 'm2' });
    store.close();
    store = openMemory(path);
    assert.deepEqual(store.save(sample), sample);
    assert.throws(() => store.save({ ...sample, text: 'changed after reopen' }), /collision/);
    assert.throws(() => store.save({ ...sample, date: '2024-02-30' }), /date/);
    store.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('rejects unconfirmed general rules before writing and accepts explicit confirmation', () => {
  const dir = mkdtempSync(join(tmpdir(), 'memory-'));
  const store = openMemory(join(dir, 'memory.sqlite'));
  try {
    const rule = { ...sample, id: 'rule', type: 'rule' as const, scope: 'general' };
    assert.throws(() => store.save(rule), /requires confirmGeneralRule/);
    assert.deepEqual(store.save(rule, { confirmGeneralRule: true }), rule);
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
});
