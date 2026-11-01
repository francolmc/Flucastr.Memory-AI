import type { StoredMemory } from './memory.js';

const MAX_BYTES = 4000;
const MAX_MEMORIES = 5;

export function serializeSearch(candidates: readonly StoredMemory[]): string {
  const memories: StoredMemory[] = [];
  for (const candidate of candidates) {
    if (memories.length >= MAX_MEMORIES) break;
    const proposed = [...memories, candidate];
    const serialized = `${JSON.stringify({ memories: proposed })}\n`;
    if (Buffer.byteLength(serialized, 'utf8') <= MAX_BYTES) memories.push(candidate);
  }
  return `${JSON.stringify({ memories })}\n`;
}
