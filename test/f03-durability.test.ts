import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { openMemory } from '../src/memory.js';

test('HTTP-confirmed writes survive worker SIGKILL; interrupted transaction remains atomic', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'f03-crash-'));
  const dbPath = join(dir, 'memory.sqlite');
  const runWorker = (mode: string, marker: string) => new Promise<string>((resolve, reject) => {
    const child = spawn(process.execPath, ['dist/test/f03-crash-worker.js', dbPath, mode], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = ''; let errors = ''; let settled = false; let markerSeen = false;
    const timer = setTimeout(() => { child.kill('SIGKILL'); finish(new Error(`worker timeout: ${errors}`)); }, 12_000);
    const finish = (error?: Error) => { if (settled) return; settled = true; clearTimeout(timer); error ? reject(error) : resolve(output); };
    child.stdout.setEncoding('utf8'); child.stdout.on('data', chunk => { output += chunk; if (output.includes(marker) && !markerSeen) { markerSeen = true; child.kill('SIGKILL'); } });
    child.stderr.setEncoding('utf8'); child.stderr.on('data', chunk => errors += chunk);
    child.on('error', err => finish(err)); child.on('exit', (code, signal) => { if (markerSeen && signal === 'SIGKILL') finish(); else finish(new Error(`worker exited before successful SIGKILL (${code}/${signal}): ${errors}`)); });
  });
  try {
    const confirmed = await runWorker('confirmed', 'CONFIRMED:');
    assert.match(confirmed, /CONFIRMED:\{"ok":true\}/);
    let store = openMemory(dbPath);
    try {
      const rows = store.list(); assert.equal(rows.length, 2); assert.deepEqual(rows.map(row => row.id).sort(), ['crash-confirmed','crash-confirmed-2']);
      // Both confirmed records contain durable; OR does not require needle.
      assert.deepEqual(store.search({ scope: 'project:SampleOne', query: 'durable needle' }).map(row => row.id).sort(), ['crash-confirmed','crash-confirmed-2']);
      assert.deepEqual(store.search({ scope: 'project:SampleOne', query: 'needle' }).map(row => row.id), ['crash-confirmed']);
      assert.ok(rows.every(row => !row.conflict));
    }
    finally { store.close(); }
    const interrupted = await runWorker('interrupted', 'UNCOMMITTED'); assert.match(interrupted, /UNCOMMITTED/);
    const db = new DatabaseSync(dbPath);
    try {
      assert.equal((db.prepare('PRAGMA integrity_check').get() as { integrity_check: string }).integrity_check, 'ok');
      assert.equal(db.prepare("SELECT id FROM memories WHERE id='interrupted'").get(), undefined);
      assert.equal((db.prepare("SELECT count(*) AS n FROM memories_fts WHERE memories_fts MATCH 'durable'").get() as { n: number }).n, 2);
      assert.equal((db.prepare('SELECT count(*) AS n FROM memories WHERE conflict=1').get() as { n: number }).n, 0);
      assert.equal((db.prepare('SELECT count(*) AS n FROM memories WHERE replaces_id IS NOT NULL').get() as { n: number }).n, 0);
    } finally { db.close(); }
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
