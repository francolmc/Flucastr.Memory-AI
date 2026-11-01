import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openMemory } from '../src/memory.js';
import { createSyntheticBackup, restoreSyntheticBackup } from '../src/recovery.js';

test('restores a validated synthetic snapshot to a new database without changing source or archived state', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'f03-restore-'));
  try {
    const source = path.join(dir, 'source.sqlite'), backups = path.join(dir, 'backups'), restored = path.join(dir, 'restored.sqlite');
    const store = openMemory(source);
    try {
      store.save({ id: 'old', type: 'learning', scope: 'project:Atlas', text: 'marker synthetic alpha', origin: 'test', date: '2025-01-01' });
      store.save({ id: 'new', type: 'decision', scope: 'project:Atlas', text: 'replacement synthetic beta', origin: 'test', date: '2025-01-02' }, { replacesId: 'old' });
      store.markConflict(['old', 'new']);
      store.archive('old', { confirmedByFranco: true });
      await createSyntheticBackup({ source, destination: backups, now: new Date('2025-01-03T12:00:00Z') });
      await restoreSyntheticBackup({ destination: backups, backupName: 'daily-2025-01-03.sqlite', target: restored });
      const reopened = openMemory(restored);
      try {
        assert.equal(reopened.list().length, 2);
        assert.equal(reopened.list().find(x => x.id === 'old')?.archived, true);
        assert.equal(reopened.list().filter(x => x.conflict).length, 2);
        assert.deepEqual(reopened.search({ scope: 'project:Atlas', query: 'replacement synthetic beta' }).map(x => x.id), ['new']);
        assert.deepEqual(reopened.search({ scope: 'project:Atlas', query: 'marker synthetic alpha' }), []);
      } finally { reopened.close(); }
      await assert.rejects(restoreSyntheticBackup({ destination: backups, backupName: 'daily-2025-01-03.sqlite', target: restored }), /already exists/);
      assert.equal(store.list().length, 2);
    } finally { store.close(); }
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('rebuilds a clean synthetic destination and verifies marker absence from DB and FTS', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'f03-sanitize-'));
  try {
    const source = path.join(dir, 'affected.sqlite'), clean = path.join(dir, 'clean.sqlite');
    const store = openMemory(source);
    try { store.save({ id: 'synthetic-marker-id', type: 'learning', scope: 'project:Atlas', text: 'synthetic marker alpha', origin: 'test', date: '2025-01-01' }); } finally { store.close(); }
    const rebuilt = openMemory(clean);
    try {
      assert.deepEqual(rebuilt.list(), []);
      assert.deepEqual(rebuilt.search({ scope: 'project:Atlas', query: 'synthetic marker alpha' }), []);
    } finally { rebuilt.close(); }
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('rejects corrupt, unlisted, and path-like snapshots without changing target or published backup', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'f03-restore-corrupt-'));
  try {
    const backups = path.join(dir, 'backups'), target = path.join(dir, 'target.sqlite');
    await import('node:fs/promises').then(({ mkdir }) => mkdir(backups));
    const corrupt = path.join(backups, 'daily-2025-01-01.sqlite');
    await writeFile(corrupt, 'synthetic-corrupt-marker');
    await writeFile(path.join(backups, 'manifest.json'), JSON.stringify({ version: 1, files: ['daily-2025-01-01.sqlite'] }));
    const before = await readFile(corrupt, 'utf8');
    await assert.rejects(restoreSyntheticBackup({ destination: backups, backupName: 'daily-2025-01-01.sqlite', target }));
    await assert.rejects(restoreSyntheticBackup({ destination: backups, backupName: 'daily-2025-01-02.sqlite', target }), /not listed/);
    await assert.rejects(restoreSyntheticBackup({ destination: backups, backupName: '../target.sqlite', target }), /Invalid backup name/);
    assert.equal(await readFile(corrupt, 'utf8'), before);
    await assert.rejects(import('node:fs/promises').then(({ access }) => access(target)));
  } finally { await rm(dir, { recursive: true, force: true }); }
});
