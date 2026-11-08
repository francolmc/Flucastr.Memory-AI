import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, delimiter } from 'node:path';
import { openMemory } from '../src/memory.js';
import { postF03 } from '../src/http-client.js';

const root = process.cwd();
const token = 'operation_template_test-token';

function run(command: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  return spawnSync(command, args, { encoding: 'utf8', cwd: root, env: { ...process.env, ...env } });
}
function start(command: string, args: string[], env: NodeJS.ProcessEnv) {
  return new Promise<{ child: ReturnType<typeof spawn>; output: () => string; exit: Promise<number | null> }>((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.setEncoding('utf8'); child.stdout.on('data', chunk => output += chunk);
    child.stderr.setEncoding('utf8'); child.stderr.on('data', chunk => output += chunk);
    const exit = new Promise<number | null>((done, fail) => { child.once('error', fail); child.once('close', done); });
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(`server readiness timeout: ${output}`)); }, 5000);
    child.stdout.on('data', () => {
      const match = /mem server listening on (\d+)/.exec(output);
      if (match) { clearTimeout(timer); resolve({ child, output: () => output, exit }); }
    });
  });
}

test('rendered systemd and cron use the real server and backup entrypoints without token environment', async () => {
  const analyze = spawnSync('systemd-analyze', ['--version'], { encoding: 'utf8' });
  assert.equal(analyze.status, 0, analyze.stderr || 'systemd-analyze must be installed in acceptance image');
  await access('/usr/bin/sqlite3');

  const dir = await mkdtemp(join(tmpdir(), 'mem operation-'));
  const home = join(dir, 'home');
  const memHome = join(home, '.mem');
  const database = join(memHome, 'memory.sqlite');
  const backupDir = join(home, 'backups with spaces');
  await mkdir(memHome, { recursive: true, mode: 0o700 });
  await writeFile(join(memHome, 'token'), `${token}\n`, { mode: 0o600 });

  const node = process.execPath;
  const user = 'nobody';
  const values: Record<string, string> = {
    '@MEM_USER@': user,
    '@MEM_HOME@': home,
    '@MEM_REPO@': root,
    '@MEM_NODE@': node,
    '@MEM_DB@': database,
    '@MEM_BACKUP_DIR@': backupDir,
  };
  const render = (template: string) => Object.entries(values).reduce((result, [marker, value]) => result.split(marker).join(value), template);
  const service = render(await readFile(join(root, 'ops/flucastr-memory.service.in'), 'utf8'));
  const servicePath = join(dir, 'flucastr-memory.service');
  await writeFile(servicePath, service);
  const cron = render(await readFile(join(root, 'ops/flucastr-memory.cron.in'), 'utf8'));
  try {
    assert.doesNotMatch(service, /@[A-Z0-9_]+@/); assert.doesNotMatch(cron, /@[A-Z0-9_]+@/);
    assert.match(service, new RegExp(`^User=${user}$`, 'm'));
    assert.match(service, /^UMask=0077$/m);
    assert.match(service, /^Restart=on-failure$/m);
    assert.doesNotMatch(service, /MEM_TOKEN/); assert.doesNotMatch(cron, /MEM_TOKEN/);
    const checked = run('systemd-analyze', ['verify', servicePath]);
    assert.equal(checked.status, 0, checked.stderr || checked.stdout);

    const startMatch = /^ExecStart="([^"]+)" "([^"]+)" (.+)$/m.exec(service);
    assert.ok(startMatch, 'quoted ExecStart must render as executable, script path, and arguments');
    const executable = startMatch[1]!;
    const args = [startMatch[2]!, ...startMatch[3]!.split(/\s+/)];
    assert.equal(executable, node);
    const workingDirectory = /^WorkingDirectory=(.+)$/m.exec(service)?.[1];
    assert.equal(workingDirectory, root);
    assert.doesNotMatch(workingDirectory!, /[ '\"\\]/, 'systemd WorkingDirectory must be an unquoted simple absolute path');
    const renderedHome = /^Environment="HOME=(.*)"$/m.exec(service)?.[1];
    const renderedDatabase = /^Environment="MEM_DB=(.*)"$/m.exec(service)?.[1];
    assert.equal(renderedHome, home); assert.equal(renderedDatabase, database);
    assert.match(home, / /); assert.match(database, / /, 'quoted environment paths are exercised with spaces');
    const serverEnv: NodeJS.ProcessEnv = { ...process.env, HOME: renderedHome, MEM_DB: renderedDatabase };
    delete serverEnv.MEM_TOKEN;
    const server = await start(executable!, args!, serverEnv);
    const port = Number(/mem server listening on (\d+)/.exec(server.output())?.[1]);
    assert.ok(port > 0, server.output());
    const saved = await postF03({ url: `http://127.0.0.1:${port}`, token }, '/v1/memories', { memory: {
      id: 'operation-service-memory', type: 'decision', scope: 'project:operation-test',
      text: 'service template real server check', origin: 'test/operation', date: '2026-11-08',
    } });
    assert.equal(JSON.parse(saved).id, 'operation-service-memory');
    server.child.kill('SIGTERM'); assert.equal(await server.exit, 0, server.output());
    const reopened = openMemory(database);
    try { assert.equal(reopened.list().some(memory => memory.id === 'operation-service-memory'), true); }
    finally { reopened.close(); }

    const cronLine = cron.split('\n').find(line => line.startsWith('0 3 '));
    assert.ok(cronLine);
    const cronCommand = cronLine.replace(/^0 3 \* \* \* \S+ /, '');
    assert.notEqual(cronCommand, cronLine, 'cron entry must contain an explicit user field');
    const cronRun = run('/bin/sh', ['-c', cronCommand], { ...process.env, HOME: home });
    assert.equal(cronRun.status, 0, cronRun.stderr);
    const files = (await readdir(backupDir)).filter(name => /^mem-[0-9]{8}T[0-9]{15}Z-[0-9]+\.sqlite$/.test(name));
    assert.equal(files.length, 1);
    const backupPath = join(backupDir, files[0]!);
    const integrity = run('/usr/bin/sqlite3', ['-readonly', '-batch', '-noheader', backupPath, 'PRAGMA integrity_check;']);
    assert.equal(integrity.status, 0, integrity.stderr); assert.equal(integrity.stdout.trim(), 'ok');
  } finally { await rm(dir, { recursive: true, force: true }); }
});
