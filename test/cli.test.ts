import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

const cli = new URL('../src/cli.js', import.meta.url);
function run(args: string[]) { return spawnSync(process.execPath, [cli.pathname, ...args], { encoding: 'utf8' }); }
const memory = { id: 'cli-1', type: 'decision', scope: 'project:demo', text: 'alpha beta persistent', origin: 'test', date: '2026-01-02' };

test('CLI help documents local commands', () => {
  const result = run(['--help']); assert.equal(result.status, 0); assert.match(result.stdout, /save --db/); assert.match(result.stdout, /doctor/);
});
test('CLI doctor reports SQLite and FTS5 as JSON', () => {
  const result = run(['doctor']); assert.equal(result.status, 0, result.stderr);
  const diagnostic = JSON.parse(result.stdout) as { sqliteVersion: string; fts5: boolean };
  assert.ok(diagnostic.sqliteVersion.length > 0); assert.equal(diagnostic.fts5, true);
});
test('unknown CLI command exits 2 and writes help to stderr', () => {
  const result = run(['not-a-command']); assert.equal(result.status, 2); assert.equal(result.stdout, ''); assert.match(result.stderr, /Unknown command/); assert.match(result.stderr, /doctor/);
});
test('CLI persists, searches, confirms, conflicts, resolves, replaces and archives via separate processes', () => {
  const dir = mkdtempSync(join(tmpdir(), 'memory-cli-')); const db = join(dir, 'memory.sqlite'); const input = join(dir, 'input.json');
  const invoke = (...args: string[]) => run(args);
  try {
    writeFileSync(input, JSON.stringify(memory));
    let r = invoke('save', '--db', db, '--input', input); assert.equal(r.status, 0, r.stderr); assert.deepEqual(JSON.parse(r.stdout), { id: 'cli-1', status: 'saved' });
    r = invoke('save', '--db', db, '--input', input); assert.equal(r.status, 0, r.stderr);
    r = invoke('search', '--db', db, '--scope', 'project:demo', '--query', 'persistent'); assert.equal(r.status, 0, r.stderr); assert.equal(r.stdout.endsWith('\n'), true); assert.equal(JSON.parse(r.stdout).memories.length, 1);
    const rule = { ...memory, id: 'rule-1', type: 'rule', scope: 'general' }; writeFileSync(input, JSON.stringify(rule));
    r = invoke('save', '--db', db, '--input', input); assert.equal(r.status, 1); assert.equal(r.stdout, '');
    r = invoke('save', '--db', db, '--input', input, '--confirm-general-rule'); assert.equal(r.status, 0, r.stderr);
    writeFileSync(input, JSON.stringify({ ...memory, id: 'cli-2', text: 'replacement', replacesId: 'cli-1' }));
    r = invoke('save', '--db', db, '--input', input); assert.equal(r.status, 0, r.stderr);
    r = invoke('conflict', '--db', db, '--ids', 'cli-1,cli-2'); assert.equal(r.status, 0, r.stderr);
    r = invoke('resolve-conflict', '--db', db, '--ids', 'cli-1,cli-2', '--confirm-franco'); assert.equal(r.status, 0, r.stderr);
    r = invoke('archive', '--db', db, '--id', 'cli-1', '--confirm-franco'); assert.equal(r.status, 0, r.stderr);
    r = invoke('search', '--db', db, '--scope', 'project:demo', '--query', 'persistent'); assert.equal(r.status, 0, r.stderr); assert.equal(JSON.parse(r.stdout).memories.some((item: { id: string }) => item.id === 'cli-1'), false);
    r = invoke('search', '--db', db, '--scope', 'project:demo', '--query', 'replacement'); assert.equal(r.status, 0, r.stderr); assert.deepEqual(JSON.parse(r.stdout).memories.map((item: { id: string }) => item.id), ['cli-2']);
    writeFileSync(input, JSON.stringify({ ...memory, text: 'collision different' }));
    r = invoke('save', '--db', db, '--input', input); assert.equal(r.status, 1); assert.equal(r.stdout, '');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
