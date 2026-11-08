import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, writeFile, chmod, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, delimiter } from 'node:path';
import { spawn } from 'node:child_process';
import { startServe } from '../src/serve.js';
import { openMemory } from '../src/memory.js';

const root = process.cwd();
async function runVerify(env: NodeJS.ProcessEnv, timeout = 60_000): Promise<{ code: number | null; output: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(join(root, 'verify'), [], { cwd: root, env: { ...process.env, ...env }, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', b => output += b); child.stderr.on('data', b => output += b);
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('verify test timeout')); }, timeout);
    child.once('close', code => { clearTimeout(timer); resolve({ code, output }); });
  });
}
async function fixture(): Promise<{ dir: string; path: string; log: string }> {
  const dir = await mkdtemp(join(tmpdir(), 'verify-orch-'));
  const path = join(dir, 'docker'); const log = join(dir, 'calls');
  await writeFile(path, `#!/bin/sh\nprintf '%s\\n' "$*" >> "$FAKE_DOCKER_LOG"\ncase "$*" in\n  'info --format {{.ServerVersion}}') echo fake-engine;;\n  *' build '*|*' build') [ "${'${FAKE_FAIL:-}'}" != build ] || exit 31; [ "${'${FAKE_SLOW:-}'}" != 1 ] || sleep 30;;\n  *' up -d') [ "${'${FAKE_FAIL:-}'}" != up ] || exit 32;;\n  *' exec '* ) case "$*" in *' env VERIFY_WRITE=1 '*) [ "${'${FAKE_FAIL:-}'}" != flow ] || exit 33;; esac; echo 'VERIFY OK';;\n  *' down -v --remove-orphans') [ "${'${FAKE_FAIL:-}'}" != down ] || exit 34;;\nesac\n`);
  await chmod(path, 0o755); return { dir, path, log };
}
async function httpFixture() {
  let writes = 0;
  let reads = 0;
  let memory: Record<string, string> | undefined;
  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = []; for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
    if (req.headers.authorization !== 'Bearer test-token') { res.writeHead(401, { 'content-type': 'application/json' }); res.end('{"error":"unauthorized"}\n'); return; }
    const send = (status: number, value: unknown) => { res.writeHead(status, { 'content-type': 'application/json' }); res.end(`${JSON.stringify(value)}\n`); };
    if (req.url === '/v1/search') { reads++; send(200, { memories: writes && body.scope === memory?.scope && body.query && memory && body.query.includes(memory.id) ? [memory] : [] }); }
    else if (req.url === '/v1/recent') send(200, {memories: memory && body.scope === memory.scope ? [memory] : []});
    else if (req.url === '/v1/memories') {
      if (memory?.id === body.memory.id && JSON.stringify(memory) !== JSON.stringify(body.memory)) send(409, {error:'id_conflict'});
      else { if (!memory) writes++; memory = body.memory; send(200, body.memory); }
    }
    else if (req.url === '/v1/forget') { memory = undefined; send(200,{ok:true}); }
    else send(404, { error: 'not_found' });
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('no test server address');
  return { server, url: `http://127.0.0.1:${address.port}`, writes: () => writes, reads: () => reads };
}

test('remote read is mandatory and does not write without permission', async () => {
  const http = await httpFixture();
  try {
    const result = await runVerify({ VERIFY_TARGET: http.url, MEM_TOKEN: 'test-token' });
    assert.equal(result.code, 0, result.output); assert.match(result.output, /VERIFY OK \(solo lectura\)/); assert.equal(http.writes(), 0);
  } finally { await new Promise<void>(resolve => http.server.close(() => resolve())); }
});

test('remote mode against the real server is read-only by default and writes idempotently with permission', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'verify-real-'));
  const db = join(dir, 'memory.sqlite');
  const server = await startServe(['--port', '0'], { MEM_DB: db, MEM_TOKEN: 'test-token' });
  const target = `http://127.0.0.1:${server.address.port}`;
  try {
    const readonly = await runVerify({ VERIFY_TARGET: target, MEM_TOKEN: 'test-token' });
    assert.equal(readonly.code, 0, readonly.output); assert.match(readonly.output, /VERIFY OK \(solo lectura\)/);
    let store = openMemory(db); assert.equal(store.list().length, 0); store.close();
    const writing = await runVerify({ VERIFY_TARGET: target, MEM_TOKEN: 'test-token', VERIFY_PERMITIR_ESCRITURA: '1' });
    assert.equal(writing.code, 0, writing.output); assert.match(writing.output, /VERIFY OK/);
    store = openMemory(db); assert.equal(store.list().length, 0); store.close();
  } finally { await server.close(); await rm(dir, { recursive: true, force: true }); }
});

test('non-empty API_URL overrides VERIFY_TARGET and WEB_URL inherits the target when absent', async () => {
  const target = await httpFixture(); const api = await httpFixture();
  try {
    const result = await runVerify({ VERIFY_TARGET: target.url, API_URL: api.url, MEM_TOKEN: 'test-token' });
    assert.equal(result.code, 0, result.output); assert.equal(target.reads(), 0); assert.ok(api.reads() > 0);
  } finally {
    await Promise.all([target, api].map(f => new Promise<void>(resolve => f.server.close(() => resolve()))));
  }
});

test('remote writing requires explicit permission and does not invoke Docker', async () => {
  const http = await httpFixture(); const fake = await fixture();
  try {
    const result = await runVerify({ VERIFY_TARGET: http.url, MEM_TOKEN: 'test-token', VERIFY_PERMITIR_ESCRITURA: '1', PATH: `${fake.dir}${delimiter}${process.env.PATH}`, FAKE_DOCKER_LOG: fake.log });
    assert.equal(result.code, 0, result.output); assert.match(result.output, /VERIFY OK/); assert.equal(http.writes(), 2);
    await assert.rejects(readFile(fake.log));
  } finally { await new Promise<void>(resolve => http.server.close(() => resolve())); await rm(fake.dir, { recursive: true, force: true }); }
});

test('local orchestration cleans up after build, startup, flow, or cleanup failures', async () => {
  for (const fail of ['build', 'up', 'flow', 'down']) {
    const fake = await fixture();
    try {
      const result = await runVerify({ PATH: `${fake.dir}${delimiter}${process.env.PATH}`, FAKE_DOCKER_LOG: fake.log, FAKE_FAIL: fail });
      assert.notEqual(result.code, 0, `${fail}: ${result.output}`); assert.doesNotMatch(result.output, /VERIFY OK/);
      const calls = await readFile(fake.log, 'utf8'); assert.match(calls, /down -v --remove-orphans/);
    } finally { await rm(fake.dir, { recursive: true, force: true }); }
  }
});

test('TERM during a build triggers scoped cleanup', async () => {
  const fake = await fixture();
  try {
    const child = spawn(join(root, 'verify'), [], { cwd: root, env: { ...process.env, PATH: `${fake.dir}${delimiter}${process.env.PATH}`, FAKE_DOCKER_LOG: fake.log, FAKE_SLOW: '1' }, stdio: 'ignore' });
    await new Promise(resolve => setTimeout(resolve, 500)); const started = Date.now(); child.kill('SIGTERM');
    const code = await new Promise<number | null>(resolve => child.once('close', resolve));
    assert.ok(Date.now() - started < 5000, 'TERM should cancel the current process promptly');
    assert.notEqual(code, 0); assert.match(await readFile(fake.log, 'utf8'), /down -v --remove-orphans/);
  } finally { await rm(fake.dir, { recursive: true, force: true }); }
});
