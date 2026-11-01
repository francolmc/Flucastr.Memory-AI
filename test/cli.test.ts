import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';

const cli = new URL('../src/cli.js', import.meta.url);
function run(args: string[]) {
  return spawnSync(process.execPath, [cli.pathname, ...args], { encoding: 'utf8' });
}

test('CLI help documents only help and doctor', () => {
  const result = run(['--help']);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /--help/);
  assert.match(result.stdout, /doctor/);
  assert.doesNotMatch(result.stderr, /Error:/);
});

test('CLI doctor reports SQLite and FTS5 as JSON', () => {
  const result = run(['doctor']);
  assert.equal(result.status, 0, result.stderr);
  const diagnostic = JSON.parse(result.stdout) as { sqliteVersion: string; fts5: boolean };
  assert.ok(diagnostic.sqliteVersion.length > 0);
  assert.equal(diagnostic.fts5, true);
  assert.doesNotMatch(result.stderr, /Error:/);
});

test('unknown CLI command exits 2 and writes help to stderr', () => {
  const result = run(['not-a-command']);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /Unknown command/);
  assert.match(result.stderr, /doctor/);
});
