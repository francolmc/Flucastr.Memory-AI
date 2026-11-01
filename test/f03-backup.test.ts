import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { openMemory } from '../src/memory.js';
import { createSyntheticBackup, retainSyntheticBackups, syntheticBackupStatus } from '../src/recovery.js';
import { DatabaseSync } from 'node:sqlite';

test('synthetic backups are consistent, atomic, manifest-scoped, and retained', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'f03-backup-'));
  try {
    const source = path.join(dir, 'source.sqlite'), dest = path.join(dir, 'backups');
    const store = openMemory(source);
    store.save({ id: 'one', type: 'decision', scope: 'project:Atlas', text: 'before', origin: 'synthetic', date: '2025-01-01' });
    await createSyntheticBackup({ source, destination: dest, now: new Date('2025-01-01T12:00:00Z') });
    store.save({ id: 'two', type: 'learning', scope: 'project:Atlas', text: 'concurrent change', origin: 'synthetic', date: '2025-01-01' });
    await createSyntheticBackup({ source, destination: dest, now: new Date('2025-01-01T13:00:00Z') });
    await createSyntheticBackup({ source, destination: dest, now: new Date('2025-01-02T12:00:00Z') });
    store.close();
    const snap = new DatabaseSync(path.join(dest, 'daily-2025-01-02.sqlite'), { readOnly: true });
    try {
      assert.equal((snap.prepare('PRAGMA integrity_check').get() as { integrity_check: string }).integrity_check, 'ok');
      assert.equal((snap.prepare('SELECT count(*) AS n FROM memories').get() as { n: number }).n, 2);
      assert.equal((snap.prepare("SELECT count(*) AS n FROM memories_fts WHERE memories_fts MATCH 'concurrent'").get() as { n: number }).n, 1);
    } finally { snap.close(); }
    for (let i = 2; i < 41; i++) {
      await createSyntheticBackup({ source, destination: dest, now: new Date(Date.UTC(2025, 0, 1 + i, 12)) });
    }
    await createSyntheticBackup({ source, destination: dest, now: new Date('2025-02-10T13:00:00Z') });
    await retainSyntheticBackups({ destination: dest, now: new Date('2025-02-10T13:00:00Z') });
    const entries = await readdir(dest);
    const published = entries.filter(x => /^daily-/.test(x));
    const weeks = new Set(published.map(x => { const d = new Date(`${x.slice(6,16)}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay()+6)%7)); return d.toISOString().slice(0,10); }));
    assert.ok(published.length <= 11);
    assert.ok(published.every(x => x.endsWith('.sqlite')));
    assert.ok(weeks.size <= 4);
    await import('node:fs/promises').then(({ writeFile }) => writeFile(path.join(dest, 'unrelated.bin'), 'keep'));
    await retainSyntheticBackups({ destination: dest, now: new Date('2025-02-10T13:00:00Z') });
    assert.ok((await readdir(dest)).includes('unrelated.bin'));
    assert.equal((await syntheticBackupStatus({ destination: dest, now: new Date('2025-02-12T00:00:01Z') })).stale, true);
    assert.ok(!(await readdir(dest)).some(x => x.endsWith('.tmp')));
  } finally { await rm(dir, { recursive: true, force: true }); }
});
