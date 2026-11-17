import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { openMemory as openPreviousMemory } from './fixtures/previous-memory.js';
import { openAuthorizedMemory, openMemory } from '../src/memory.js';

test('reopens a populated pre-cleanup v2 database and preserves every record and operation', () => {
  const directory = mkdtempSync(join(tmpdir(), 'memory-previous-v2-'));
  const path = join(directory, 'memory.sqlite');
  const records = [
    { id: 'old-project', type: 'decision' as const, scope: 'project:Old', text: 'existing project memory', origin: 'synthetic', date: '2024-01-01' },
    { id: 'archived-memory', type: 'learning' as const, scope: 'general', text: 'archived synthetic memory', origin: 'synthetic', date: '2024-01-02' },
    { id: 'conflict-a', type: 'decision' as const, scope: 'project:Old', text: 'first synthetic conflict', origin: 'synthetic', date: '2024-01-03' },
    { id: 'conflict-b', type: 'decision' as const, scope: 'project:Old', text: 'second synthetic conflict', origin: 'synthetic', date: '2024-01-04' },
  ];
  const initialCount = records.length + 1;

  try {
    // Seed with the pre-B src/memory.ts snapshot so SQLite and FTS5 are created and populated through its real API.
    let previous = openPreviousMemory(path);
    for (const row of records) previous.save(row);
    previous.archive('archived-memory', { confirmedByFranco: true });
    previous.markConflict(['conflict-a', 'conflict-b']);
    previous.save({ id: 'replacement', type: 'learning', scope: 'project:Old', text: 'replacement synthetic memory', origin: 'synthetic', date: '2024-01-05' }, { replacesId: 'old-project' });
    assert.deepEqual(previous.list().map(({ id, archived, conflict, replacesId }) => ({ id, archived, conflict, replacesId })), [
      { id: 'old-project', archived: false, conflict: false, replacesId: null },
      { id: 'archived-memory', archived: true, conflict: false, replacesId: null },
      { id: 'conflict-a', archived: false, conflict: true, replacesId: null },
      { id: 'conflict-b', archived: false, conflict: true, replacesId: null },
      { id: 'replacement', archived: false, conflict: false, replacesId: 'old-project' },
    ]);
    previous.close();

    let db = new DatabaseSync(path);
    const dataBefore = db.prepare('SELECT id,type,scope,text,origin,date,replaces_id,archived,conflict FROM memories ORDER BY id').all();
    const schemaBefore = db.prepare('PRAGMA table_info(memories)').all().map((column) => (column as { name: string }).name);
    assert.equal((db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version, 2);
    assert.equal(dataBefore.length, initialCount);
    db.close();

    const store = openMemory(path);
    try {
      assert.deepEqual(store.list().map(({ id, archived, conflict, replacesId }) => ({ id, archived, conflict, replacesId })), [
        { id: 'old-project', archived: false, conflict: false, replacesId: null },
        { id: 'archived-memory', archived: true, conflict: false, replacesId: null },
        { id: 'conflict-a', archived: false, conflict: true, replacesId: null },
        { id: 'conflict-b', archived: false, conflict: true, replacesId: null },
        { id: 'replacement', archived: false, conflict: false, replacesId: 'old-project' },
      ]);
      assert.deepEqual(store.search({ scope: 'general', query: 'archived' }), []);
      assert.equal(store.search({ scope: 'project:Old', query: 'replacement' })[0]?.replacesId, 'old-project');
      store.resolveConflict(['conflict-a', 'conflict-b'], { confirmedByFranco: true });
      store.archive('old-project', { confirmedByFranco: true });
      assert.equal(store.list().length, initialCount);
      assert.equal(store.list().filter((row) => row.conflict).length, 0);
      assert.equal(store.list().find((row) => row.id === 'old-project')?.archived, true);
    } finally {
      store.close();
    }

    const authorized = openAuthorizedMemory(path);
    try {
      assert.deepEqual(authorized.replace({ id: 'new-replacement', type: 'learning', scope: 'project:Old', text: 'new synthetic replacement', origin: 'synthetic', date: '2024-01-06' }, 'replacement'), {
        id: 'new-replacement', type: 'learning', scope: 'project:Old', text: 'new synthetic replacement', origin: 'synthetic', date: '2024-01-06',
      });
    } finally {
      authorized.close();
    }

    db = new DatabaseSync(path);
    const schemaAfter = db.prepare('PRAGMA table_info(memories)').all().map((column) => (column as { name: string }).name);
    assert.deepEqual(schemaAfter, schemaBefore);
    assert.equal((db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version, 2);
    assert.equal((db.prepare('SELECT count(*) AS total FROM memories').get() as { total: number }).total, initialCount + 1);
    assert.equal((db.prepare('SELECT count(*) AS total FROM memories_fts').get() as { total: number }).total, initialCount + 1);
    db.close();
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
