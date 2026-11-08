import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, writeFile, readFile, readdir, lstat, rm, access, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, delimiter } from 'node:path';
import { openMemory } from '../src/memory.js';

const root = process.cwd();
const script = join(root, 'scripts/backup-memory.sh');
const sqlite = '/usr/bin/sqlite3';
const token = 'backup_test-token';

async function requireSqlite(): Promise<void> {
  try { await access(sqlite); }
  catch { throw new Error('backup tests require sqlite3 CLI (installed in Docker verify)'); }
}
async function fixture() {
  const dir = await mkdtemp(join(tmpdir(), 'mem-backup-'));
  const db = join(dir, 'memory.sqlite');
  const destination = join(dir, "backups with spaces 'single'");
  const store = openMemory(db);
  store.save({ id: 'seed-memory', type: 'decision', scope: 'project:backup-test', text: 'the preserved searchable backup marker', origin: 'test', date: '2026-11-08' });
  store.close();
  return { dir, db, destination };
}
function runBackup(db: string, destination: string, env: NodeJS.ProcessEnv = process.env) {
  return spawnSync('bash', [script, db, destination], { encoding: 'utf8', env: { ...process.env, ...env } });
}
function memoriesSqlite(path: string): string {
  return spawnSync(sqlite, ['-readonly', '-batch', '-noheader', path, "SELECT id FROM memories WHERE id='seed-memory';"], { encoding: 'utf8' }).stdout.trim();
}
function finalFiles(dir: string): Promise<string[]> {
  return readdir(dir).then(async names => {
    const files: string[] = [];
    for (const name of names) {
      if (!/^mem-[0-9]{8}T[0-9]{15}Z-[0-9]+\.sqlite$/.test(name)) continue;
      if ((await lstat(join(dir, name))).isFile()) files.push(name);
    }
    return files.sort();
  });
}
async function hashSnapshot(dir: string): Promise<Record<string, string>> {
  const snapshot: Record<string, string> = {};
  for (const name of await finalFiles(dir)) snapshot[name] = createHash('sha256').update(await readFile(join(dir, name))).digest('hex');
  return snapshot;
}
async function startMemServer(db: string, home: string) {
  const child = spawn(process.execPath, [join(root, 'dist/src/mem.js'), 'serve', '--port', '0'], {
    cwd: root, env: { ...process.env, HOME: home, MEM_DB: db, MEM_TOKEN: token }, stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  const exited = new Promise<{ code: number | null; signal: NodeJS.Signals | null }>(resolve => child.once('exit', (code, signal) => resolve({ code, signal })));
  const ready = new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`mem serve readiness timeout: ${output}`)), 5000);
    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      output += chunk;
      const match = /mem server listening on (\d+)/.exec(output);
      if (match) { clearTimeout(timer); resolve(`http://127.0.0.1:${match[1]}`); }
    });
    child.stderr.setEncoding('utf8'); child.stderr.on('data', (chunk: string) => output += chunk);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', (code, signal) => { if (!output.includes('mem server listening on ')) { clearTimeout(timer); reject(new Error(`mem serve exited (${code}/${signal}): ${output}`)); } });
  });
  const origin = await ready;
  return {
    origin,
    async close() { child.kill('SIGTERM'); const result = await exited; assert.equal(result.code, 0, output); },
  };
}
function saveViaMem(origin: string, id: string): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [join(root, 'dist/src/mem.js'), 'save', '--type', 'learning', '--text', `concurrent writer ${id}`, '--scope', 'project:backup-test', '--origin', 'test/http'], {
      cwd: root, env: { ...process.env, MEM_URL: origin, MEM_TOKEN: token }, stdio: 'ignore',
    });
    child.once('error', reject); child.once('close', resolve);
  });
}

test('backup uses the live HTTP server, publishes a valid FTS snapshot and accepts later writes', async () => {
  await requireSqlite();
  const f = await fixture();
  const server = await startMemServer(f.db, f.dir);
  const delayDir = join(f.dir, 'delay-sqlite'); await mkdir(delayDir);
  await writeFile(join(delayDir, 'sqlite3'), `#!/bin/sh\nsleep 0.3\nexec ${sqlite} "$@"\n`);
  assert.equal(spawnSync('chmod', ['+x', join(delayDir, 'sqlite3')]).status, 0);
  let output = '';
  try {
    const child = spawn('bash', [script, f.db, f.destination], { cwd: root, env: { ...process.env, PATH: `${delayDir}${delimiter}${process.env.PATH}` }, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.setEncoding('utf8'); child.stdout.on('data', chunk => output += chunk);
    child.stderr.setEncoding('utf8'); child.stderr.on('data', chunk => output += chunk);
    let exitedAt: number | undefined;
    child.once('exit', () => { exitedAt = Date.now(); });
    const closed = new Promise<number | null>((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
    const started = Date.now();
    let confirmedDuring = 0;
    let sequence = 0;
    while (Date.now() - started < 5000) {
      const id = `during-${sequence++}`;
      try { const code = await saveViaMem(server.origin, id); if (code === 0 && exitedAt === undefined) confirmedDuring++; } catch { /* database backup can briefly hold SQLite's writer lock */ }
      if (confirmedDuring && child.exitCode !== null) break;
    }
    const code = await closed;
    assert.equal(code, 0, output);
    assert.ok(confirmedDuring > 0, 'HTTP writer confirmed no write while backup was running');
    const backup = output.trim();
    assert.ok(backup.startsWith(f.destination));
    const integrity = spawnSync(sqlite, ['-readonly', '-batch', '-noheader', backup, 'PRAGMA integrity_check;'], { encoding: 'utf8' });
    assert.equal(integrity.status, 0, integrity.stderr); assert.equal(integrity.stdout.trim(), 'ok');
    assert.equal(memoriesSqlite(backup), 'seed-memory');
    const fts = spawnSync(sqlite, ['-readonly', '-batch', '-noheader', backup, "SELECT id FROM memories_fts WHERE memories_fts MATCH 'searchable';"], { encoding: 'utf8' });
    assert.equal(fts.status, 0, fts.stderr); assert.equal(fts.stdout.trim(), 'seed-memory');
    assert.equal(await saveViaMem(server.origin, 'after-backup'), 0, 'mem save should still work after backup');
  } finally { await server.close(); await rm(f.dir, { recursive: true, force: true }); }
});

test('invalid input, corrupt database, bad destination and failed integrity preserve prior copies', async () => {
  await requireSqlite();
  const f = await fixture();
  try {
    const good = runBackup(f.db, f.destination);
    assert.equal(good.status, 0, good.stderr);
    const before = await hashSnapshot(f.destination);
    const sourceHash = createHash('sha256').update(await readFile(f.db)).digest('hex');
    const published = await readdir(f.destination).then(names => names.find(name => /^mem-.*\.sqlite$/.test(name))!);
    assert.equal((await lstat(join(f.destination, published))).mode & 0o777, 0o600);
    assert.equal(createHash('sha256').update(await readFile(f.db)).digest('hex'), sourceHash);
    const absentPath = join(f.dir, 'absent.sqlite');
    const absent = runBackup(absentPath, f.destination);
    assert.notEqual(absent.status, 0); assert.deepEqual(await hashSnapshot(f.destination), before);
    await assert.rejects(access(absentPath));
    const wrongArgs = spawnSync('bash', [script], { encoding: 'utf8' }); assert.notEqual(wrongArgs.status, 0);
    const badDb = join(f.dir, 'corrupt.sqlite'); await writeFile(badDb, 'not a sqlite database');
    assert.notEqual(runBackup(badDb, f.destination).status, 0); assert.deepEqual(await hashSnapshot(f.destination), before);
    const badDestination = join(f.dir, 'file-not-directory'); await writeFile(badDestination, 'x');
    assert.notEqual(runBackup(f.db, badDestination).status, 0); assert.deepEqual(await hashSnapshot(f.destination), before);

    const shimDir = join(f.dir, 'sqlite-shim'); await mkdir(shimDir);
    await writeFile(join(shimDir, 'sqlite3'), `#!/bin/sh\ncase "$*" in *'PRAGMA integrity_check;'*) printf 'not ok\\n'; exit 0;; esac\nexec ${sqlite} "$@"\n`);
    const chmod = spawnSync('chmod', ['+x', join(shimDir, 'sqlite3')]); assert.equal(chmod.status, 0);
    const failedIntegrity = runBackup(f.db, f.destination, { PATH: `${shimDir}${delimiter}${process.env.PATH}` });
    assert.notEqual(failedIntegrity.status, 0); assert.deepEqual(await hashSnapshot(f.destination), before);
    assert.equal((await readdir(f.destination)).some(name => name.startsWith('.mem-backup.')), false);
    const sourceStillExists = await readFile(f.db); assert.ok(sourceStillExists.length > 0);
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});

test('retention keeps newest seven exact-pattern regular copies and leaves unrelated entries', async () => {
  await requireSqlite();
  const f = await fixture();
  try {
    const outside = join(f.dir, 'outside.sqlite'); await writeFile(outside, 'untouched');
    await mkdir(f.destination, { recursive: true });
    await writeFile(join(f.destination, 'other.sqlite'), 'untouched');
    await writeFile(join(f.destination, 'mem-20261108T000000000000000Z-1.sqlite.tmp'), 'temporary');
    const linked = join(f.destination, 'mem-20261108T000000000000000Z-1.sqlite');
    await symlink(outside, linked);
    const published: string[] = [];
    for (let i = 0; i < 9; i++) {
      const result = runBackup(f.db, f.destination);
      assert.equal(result.status, 0, result.stderr);
      published.push(result.stdout.trim());
    }
    const remaining = await finalFiles(f.destination);
    assert.deepEqual(remaining, published.slice(-7).map(path => path.split('/').at(-1)).sort());
    for (const name of remaining) {
      const full = join(f.destination, name);
      assert.equal((await lstat(full)).isFile(), true);
      const integrity = spawnSync(sqlite, ['-readonly', '-batch', '-noheader', full, 'PRAGMA integrity_check;'], { encoding: 'utf8' });
      assert.equal(integrity.status, 0, integrity.stderr); assert.equal(integrity.stdout.trim(), 'ok');
    }
    assert.equal(await readFile(join(f.destination, 'other.sqlite'), 'utf8'), 'untouched');
    assert.equal(await readFile(outside, 'utf8'), 'untouched');
    assert.equal(await readFile(join(f.destination, 'mem-20261108T000000000000000Z-1.sqlite.tmp'), 'utf8'), 'temporary');
    assert.equal((await lstat(linked)).isSymbolicLink(), true);

    const source = await readFile(script, 'utf8');
    const mutated = source.replace('> 7', '> 8').replace('- 7))', '- 8))');
    assert.notEqual(mutated, source, 'sensitivity mutation should change the retention threshold');
    const mutatedScript = join(f.dir, 'backup-retention-8.sh'); await writeFile(mutatedScript, mutated);
    const mutatedDestination = join(f.dir, 'retention-mutated');
    for (let i = 0; i < 9; i++) {
      const result = spawnSync('bash', [mutatedScript, f.db, mutatedDestination], { encoding: 'utf8', env: process.env });
      assert.equal(result.status, 0, result.stderr);
    }
    const mutatedCount = (await finalFiles(mutatedDestination)).length;
    assert.equal(mutatedCount, 8);
    assert.throws(() => assert.equal(mutatedCount, 7, 'A3 exact retention'), /A3 exact retention/);
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});

test('overlapping backup fails without changing copies; TERM cleans its own temporary', async () => {
  await requireSqlite();
  const f = await fixture();
  try {
    const first = runBackup(f.db, f.destination); assert.equal(first.status, 0, first.stderr);
    const before = await hashSnapshot(f.destination);
    const lock = spawn('flock', ['-n', join(f.destination, '.backup-memory.lock'), 'sleep', '2']);
    await new Promise(resolve => setTimeout(resolve, 100));
    const overlap = runBackup(f.db, f.destination);
    assert.notEqual(overlap.status, 0); assert.match(overlap.stderr, /ya hay una copia/); assert.deepEqual(await hashSnapshot(f.destination), before);
    lock.kill('SIGTERM'); await new Promise(resolve => lock.once('close', resolve));

    const lockProgram = `import { DatabaseSync } from 'node:sqlite'; const db = new DatabaseSync(process.argv[1]); db.exec('BEGIN EXCLUSIVE'); console.log('SQLITE LOCKED'); process.on('SIGTERM', () => { db.exec('ROLLBACK'); db.close(); process.exit(0); }); setInterval(() => {}, 1000);`;
    const sqliteLock = spawn(process.execPath, ['--input-type=module', '-e', lockProgram, f.db], { stdio: ['ignore', 'pipe', 'pipe'] });
    const sqliteLocked = new Promise<void>((resolve, reject) => {
      let output = '';
      sqliteLock.stdout.setEncoding('utf8'); sqliteLock.stdout.on('data', chunk => { output += chunk; if (output.includes('SQLITE LOCKED')) resolve(); });
      sqliteLock.once('error', reject); sqliteLock.once('exit', (code, signal) => reject(new Error(`SQLite lock worker exited (${code}/${signal}): ${output}`)));
    });
    const lockExit = new Promise<number | null>(resolve => sqliteLock.once('exit', code => resolve(code)));
    await sqliteLocked;
    const blocked = runBackup(f.db, f.destination);
    assert.notEqual(blocked.status, 0); assert.match(blocked.stderr, /copia SQLite/); assert.deepEqual(await hashSnapshot(f.destination), before);
    sqliteLock.kill('SIGTERM'); assert.equal(await lockExit, 0);
    assert.equal(runBackup(f.db, f.destination).status, 0, 'SQLite lock should be released for the next backup');
    const beforeCancellation = await hashSnapshot(f.destination);

    const shimDir = join(f.dir, 'slow-sqlite'); await mkdir(shimDir);
    await writeFile(join(shimDir, 'sqlite3'), '#!/bin/sh\nexec sleep 2\n');
    assert.equal(spawnSync('chmod', ['+x', join(shimDir, 'sqlite3')]).status, 0);
    const child = spawn('bash', [script, f.db, f.destination], { env: { ...process.env, PATH: `${shimDir}${delimiter}${process.env.PATH}` }, detached: true, stdio: 'ignore' });
    const closed = new Promise<number | null>((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
    const watchdog = setTimeout(() => { if (child.pid) process.kill(-child.pid, 'SIGKILL'); }, 5000);
    await new Promise(resolve => setTimeout(resolve, 300));
    const started = Date.now();
    if (child.pid) process.kill(-child.pid, 'SIGTERM');
    const code = await closed; clearTimeout(watchdog);
    assert.ok(Date.now() - started < 5000, 'TERM should finish before the test watchdog');
    assert.notEqual(code, 0); assert.deepEqual(await hashSnapshot(f.destination), beforeCancellation);
    assert.equal((await readdir(f.destination)).some(name => name.startsWith('.mem-backup.')), false);

    const timeoutDir = join(f.dir, 'short-timeout'); await mkdir(timeoutDir);
    await writeFile(join(timeoutDir, 'timeout'), `#!/bin/bash\nargs=("$@")\nfor ((i=0; i<\${#args[@]}; i++)); do if [[ \${args[i]} == 60s ]]; then args[i]=1s; break; fi; done\nexec /usr/bin/timeout "\${args[@]}"\n`);
    assert.equal(spawnSync('chmod', ['+x', join(timeoutDir, 'timeout')]).status, 0);
    const timeoutChild = spawn('bash', [script, f.db, f.destination], { env: { ...process.env, PATH: `${shimDir}${delimiter}${timeoutDir}${delimiter}${process.env.PATH}` }, stdio: 'ignore' });
    const timeoutClosed = new Promise<number | null>((resolve, reject) => { timeoutChild.once('error', reject); timeoutChild.once('close', resolve); });
    const timeoutWatchdog = setTimeout(() => timeoutChild.kill('SIGKILL'), 5000);
    const timeoutCode = await timeoutClosed; clearTimeout(timeoutWatchdog);
    assert.notEqual(timeoutCode, 0); assert.deepEqual(await hashSnapshot(f.destination), beforeCancellation);
    assert.equal((await readdir(f.destination)).some(name => name.startsWith('.mem-backup.')), false);
  } finally { await rm(f.dir, { recursive: true, force: true }); }
});
