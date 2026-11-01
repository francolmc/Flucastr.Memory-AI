import assert from 'node:assert/strict';
import { test } from 'node:test';
import { probeSqlite } from '../src/index.js';

test('probe opens SQLite, confirms FTS5, and closes cleanly', () => {
  const first = probeSqlite();
  assert.ok(first.sqliteVersion.length > 0);
  assert.equal(first.fts5, true);

  const second = probeSqlite();
  assert.ok(second.sqliteVersion.length > 0);
  assert.equal(second.fts5, true);
  assert.deepEqual(second, first);
});
