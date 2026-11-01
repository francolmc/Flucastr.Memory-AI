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
test('authorized search filters project allowlist before ranking and composes general', () => withStores((_path, auth, trusted) => {
 trusted.save(record('a', 'project:Atlas')); trusted.save(record('g', 'general')); trusted.save(record('b', 'project:Birch', 'relevant phrase repeated repeated repeated'));
 assert.deepEqual(auth.search({ scope: 'project:Atlas', query: 'relevant phrase repeated' }).map(row => row.id), ['a', 'g']);
 assert.deepEqual(auth.search({ scope: 'general', query: 'relevant phrase repeated' }).map(row => row.id), ['g']);
 assert.throws(() => auth.search({ scope: 'project:Other', query: 'relevant' }), /unavailable/);
}));
test('authorized saves, idempotent retries, same-project replacements and conflict checks are fail closed', () => withStores((_path, auth, trusted) => {
 assert.throws(() => auth.save(record('foreign', 'project:Other')), /unavailable/);
 assert.throws(() => auth.save({ ...record('rule', 'general'), type: 'rule' }), /unavailable/);
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
test('missing and forbidden IDs have indistinguishable errors and do not mutate', () => withStores((_path, auth, trusted) => {
 trusted.save(record('x', 'project:Other')); const before = trusted.list();
 let missing: unknown, forbidden: unknown;
 try { auth.markConflict(['missing', 'missing2']); } catch (error) { missing = error; }
 try { auth.markConflict(['x', 'missing2']); } catch (error) { forbidden = error; }
 assert.ok(missing instanceof Error && forbidden instanceof Error); assert.equal(missing.message, forbidden.message);
 assert.deepEqual(trusted.list(), before);
}));
