import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { openAuthorizedMemory, openMemory, type MemoryInput } from '../src/index.js';
const record = (id: string, scope: string, text = 'relevant phrase repeated'): MemoryInput => ({ id, type: 'learning', scope, text, origin: 'test', date: '2024-01-01' });
function withStores(run: (path: string, auth: ReturnType<typeof openAuthorizedMemory>, trusted: ReturnType<typeof openMemory>) => void) {
 const dir = mkdtempSync(join(tmpdir(), 'authorized-memory-')); const path = join(dir, 'memory.sqlite'); const auth = openAuthorizedMemory(path); const trusted = openMemory(path);
 try { run(path, auth, trusted); } finally { auth.close(); trusted.close(); rmSync(dir, { recursive: true, force: true }); }
}
test('authorized search isolates valid projects and composes general', () => withStores((_path, auth, trusted) => {
 trusted.save(record('a', 'project:Atlas')); trusted.save(record('g', 'general')); trusted.save(record('b', 'project:Birch', 'relevant phrase repeated repeated repeated'));
 assert.deepEqual(auth.search({ scope: 'project:Atlas', query: 'relevant phrase repeated' }).map(row => row.id), ['a', 'g']);
 assert.deepEqual(auth.search({ scope: 'general', query: 'relevant phrase repeated' }).map(row => row.id), ['g']);
 assert.deepEqual(auth.search({ scope: 'project:Other', query: 'relevant' }).map(row => row.id), ['g']);
 assert.throws(() => auth.search({ scope: 'project: bad', query: 'relevant' }), /unavailable/);
}));
test('authorized saves, idempotent retries, same-project replacements and conflict checks are fail closed', () => withStores((_path, auth, trusted) => {
 assert.deepEqual(auth.save(record('third', 'project:Other')), record('third', 'project:Other'));
 auth.save(record('g', 'general'));
 assert.deepEqual(auth.search({ scope: 'project:Other', query: 'relevant' }).map(row => row.id).sort(), ['g', 'third']);
 assert.deepEqual(auth.save({ ...record('rule', 'general'), type: 'rule' }), { ...record('rule', 'general'), type: 'rule' });
 auth.save(record('a', 'project:Atlas')); assert.deepEqual(auth.save(record('a', 'project:Atlas')), record('a', 'project:Atlas'));
 assert.throws(() => auth.save(record('a', 'project:Atlas', 'collision')), /unavailable/);
 trusted.save(record('foreign', 'project:Other'));
 assert.throws(() => auth.save(record('foreign', 'project:Atlas')), /unavailable/);
 auth.save(record('b', 'project:Atlas', 'replacement'), );
 assert.deepEqual(auth.replace(record('c', 'project:Atlas', 'replacement'), 'b'), record('c', 'project:Atlas', 'replacement'));
 assert.throws(() => auth.replace(record('d', 'project:Birch'), 'b'), /unavailable/);
 assert.throws(() => auth.replace(record('e', 'general'), 'g'), /unavailable/);
 trusted.save(record('x', 'project:Other')); assert.throws(() => auth.markConflict(['b', 'x']), /unavailable/);
 assert.equal(trusted.list().find(row => row.id === 'b')?.conflict, false);
 auth.markConflict(['b', 'c']); assert.equal(trusted.list().filter(row => ['b', 'c'].includes(row.id) && row.conflict).length, 2);
}));
test('missing IDs do not mutate', () => withStores((_path, auth, trusted) => {
 trusted.save(record('x', 'project:Other')); const before = trusted.list();
 assert.throws(() => auth.markConflict(['missing', 'missing2']), /unavailable/);
 assert.deepEqual(trusted.list(), before);
}));
