import assert from 'node:assert/strict';
import test from 'node:test';
import { serializeSearch } from '../src/index.js';
import type { StoredMemory } from '../src/memory.js';

function memory(text: string, id = 'id'): StoredMemory {
  return { id, type: 'decision', scope: 'general', text, origin: 'test', date: '2026-01-01', archived: false, conflict: false, replacesId: null };
}
const wire = ({id,type,scope,text,origin,date}:StoredMemory) => ({id,type,scope,text,origin,date});

test('serializeSearch enforces complete UTF-8 response bound and never truncates objects', () => {
  const empty = serializeSearch([]);
  assert.equal(empty, '{"memories":[]}\n');
  assert.equal(Buffer.byteLength(empty, 'utf8'), 16);

  const fixed = memory('');
  const emptyObjectBytes = Buffer.byteLength(JSON.stringify({ memories: [wire(fixed)] }) + '\n', 'utf8');
  const exact = memory('é'.repeat(Math.floor((4000 - emptyObjectBytes) / 2)));
  let text = exact.text;
  while (Buffer.byteLength(JSON.stringify({ memories: [wire(memory(text))] }) + '\n', 'utf8') < 4000) text += 'x';
  while (Buffer.byteLength(JSON.stringify({ memories: [wire(memory(text))] }) + '\n', 'utf8') > 4000) text = text.slice(0, -1);
  const exactMemory = memory(text);
  assert.equal(Buffer.byteLength(serializeSearch([exactMemory]), 'utf8'), 4000);
  const over = memory(text + 'x');
  assert.equal(Buffer.byteLength(serializeSearch([over]), 'utf8'), Buffer.byteLength(empty, 'utf8'));
  assert.deepEqual(JSON.parse(serializeSearch([exactMemory, memory('later', 'later')])).memories, [wire(exactMemory)]);

  const escaped = memory('quotes " slash \\ newline\n emoji 🧠');
  assert.deepEqual(JSON.parse(serializeSearch([escaped])).memories, [wire(escaped)]);
});

test('serializeSearch skips oversized candidates and includes at most five complete records', () => {
  const values = [memory('huge'.repeat(1200)), ...Array.from({ length: 7 }, (_, i) => memory(`ok${i}`, `m${i}`))];
  const output = serializeSearch(values);
  const parsed = JSON.parse(output) as { memories: Omit<StoredMemory, 'archived' | 'conflict' | 'replacesId'>[] };
  assert.equal(parsed.memories.length, 5);
  assert.deepEqual(parsed.memories.map((item) => item.id), ['m0', 'm1', 'm2', 'm3', 'm4']);
  assert.ok(Buffer.byteLength(output, 'utf8') <= 4000);
  assert.deepEqual(parsed.memories, values.slice(1, 6).map(wire));
});
