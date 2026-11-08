import type { StoredMemory } from './memory.js';

const MAX_BYTES = 4000;
const MAX_MEMORIES = 5;

export function serializeSearch(candidates: readonly StoredMemory[]): string {
  const memories: Omit<StoredMemory, 'archived' | 'conflict' | 'replacesId'>[] = [];
  for (const candidate of candidates) {
    if (memories.length >= MAX_MEMORIES) break;
    const { id, type, scope, text, origin, date } = candidate;
    const proposed = [...memories, { id, type, scope, text, origin, date }];
    const serialized = `${JSON.stringify({ memories: proposed })}\n`;
    if (Buffer.byteLength(serialized, 'utf8') <= MAX_BYTES) memories.push({ id, type, scope, text, origin, date });
  }
  return `${JSON.stringify({ memories })}\n`;
}
