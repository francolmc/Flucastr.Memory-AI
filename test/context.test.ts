import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMemoryContext, type ContextMemory } from '../src/context.js';

test('memory context filters to rules, decisions and resolved blockers; priorities and respects UTF-8 byte limit', () => {
  const records: ContextMemory[] = Array.from({ length: 100 }, (_, index) => ({
    id: `id-${index}`,
    type: index === 0 ? 'learning' : index % 7 === 0 ? 'rule' : index % 3 === 0 ? 'decision' : 'resolved-blocker',
    scope: 'project:context-test',
    text: `Antecedente multibyte 🧠 ${'ñ界'.repeat(160)}`,
    origin: 'test',
    date: '2026-11-16',
  }));
  const result = buildMemoryContext(records);
  const serialized = JSON.stringify(result);
  assert.ok(Buffer.byteLength(serialized, 'utf8') <= 4000);
  assert.equal(JSON.parse(serialized).warning, result.warning);
  assert.ok(result.memories.every(record => ['rule', 'decision', 'resolved-blocker'].includes(record.type)));
  assert.equal(result.memories.some(record => record.type === 'learning'), false);
  assert.equal(result.memories[0]?.type, 'rule');
  assert.ok(result.memories.length < records.length);
});

test('memory context byte-limit regression fixture would exceed 4000 bytes if the limit were raised', () => {
  const records: ContextMemory[] = Array.from({ length: 100 }, (_, index) => ({
    id: `boundary-${index}`,
    type: 'decision',
    scope: 'project:context-boundary',
    text: 'ñ界'.repeat(220),
    origin: 'test',
    date: '2026-11-16',
  }));
  const result = buildMemoryContext(records);
  const bytes = Buffer.byteLength(JSON.stringify(result), 'utf8');
  assert.ok(bytes > 3500 && bytes <= 4000, `expected a near-limit result, got ${bytes} bytes`);
  assert.ok(result.memories.length < records.length);
});
