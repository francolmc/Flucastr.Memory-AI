import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { openAuthorizedMemory } from '../src/memory.js';
import { startLocalServer } from '../src/http-server.js';
import { createHttpAuthenticator, digestSyntheticKey } from '../src/http-auth.js';

const script = join(process.cwd(), 'scripts/smoke.mjs');
const token = 'synthetic-smoke-token-0123456789abcdef';
const smokeScope = 'project:smoke-test';
function run(env: NodeJS.ProcessEnv) {
  return new Promise<{ status: number; stdout: string; stderr: string }>(resolve => execFile(process.execPath, [script], { env: { ...process.env, ...env }, encoding: 'utf8' }, (error, stdout, stderr) => {
    resolve({ status: error?.code && typeof error.code === 'number' ? error.code : error ? 1 : 0, stdout, stderr });
  }));
}
async function listen(server: Server) {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return `http://127.0.0.1:${address.port}`;
}

test('smoke guarda, encuentra y elimina contra servidor loopback aislado; rechaza credenciales inválidas sin filtrarlas', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'mem-smoke-'));
  const store = openAuthorizedMemory(join(dir, 'server.sqlite'));
  let server: Awaited<ReturnType<typeof startLocalServer>> | undefined;
  try {
    server = await startLocalServer({ store, auth: createHttpAuthenticator({ state: { currentDigest: digestSyntheticKey(token), issuedAt: Date.now() } }), port: 0 });
    const base = `http://127.0.0.1:${server.address.port}`;
    const absent = await run({ MEM_URL: base, MEM_TOKEN: '', MEM_SCOPE: smokeScope });
    assert.equal(absent.status, 1);
    assert.match(absent.stderr, /MEM_TOKEN/);
    assert.doesNotMatch(absent.stderr, /synthetic-smoke-token/);
    const invalid = await run({ MEM_URL: base, MEM_TOKEN: 'bad-token/', MEM_SCOPE: smokeScope });
    assert.equal(invalid.status, 1);
    assert.match(invalid.stderr, /MEM_TOKEN/);
    const rejected = await run({ MEM_URL: base, MEM_TOKEN: 'synthetic-smoke-token-aaaaaaaaaaaaaaaa', MEM_SCOPE: smokeScope });
    assert.equal(rejected.status, 1);
    assert.match(rejected.stderr, /autenticación rechazada/);
    assert.doesNotMatch(rejected.stderr, /synthetic-smoke-token/);
    const success = await run({ MEM_URL: base, MEM_TOKEN: token, MEM_SCOPE: smokeScope });
    assert.equal(success.status, 0, success.stderr);
    assert.match(success.stdout, /guardó, encontró y eliminó/);
    assert.deepEqual(store.search({ scope: smokeScope, query: 'mem-smoke' }), []);
  } finally {
    if (server) await server.close();
    store.close();
    rmSync(dir, { recursive: true, force: true });
  }
});

test('smoke intenta limpiar tras un fallo de búsqueda y explica si falla la limpieza', async () => {
  let failForget = false;
  let searchCount = 0;
  const calls: string[] = [];
  const fake = createServer(async (req, res) => {
    let body = '';
    for await (const chunk of req) body += chunk.toString();
    calls.push(req.url ?? '');
    const data = body ? JSON.parse(body) as { memory?: Record<string, string> } : {};
    res.setHeader('content-type', 'application/json');
    if (req.url === '/v1/memories') { res.end(JSON.stringify(data.memory)); return; }
    if (req.url === '/v1/search') {
      searchCount++;
      if (searchCount % 2 === 1) { res.statusCode = 500; res.end('{"error":"internal_error"}'); }
      else res.end('{"memories":[]}');
      return;
    }
    if (req.url === '/v1/forget') { res.statusCode = failForget ? 500 : 200; res.end(failForget ? '{"error":"internal_error"}' : '{"ok":true}'); return; }
    res.statusCode = 404; res.end('{"error":"not_found"}');
  });
  const base = await listen(fake);
  try {
    const searchFailure = await run({ MEM_URL: base, MEM_TOKEN: token, MEM_SCOPE: smokeScope });
    assert.equal(searchFailure.status, 1);
    assert.match(searchFailure.stderr, /HTTP 500/);
    assert.ok(calls.includes('/v1/forget'), 'debió intentar forget después del fallo de búsqueda');
    calls.length = 0;
    searchCount = 0;
    failForget = true;
    const cleanupFailure = await run({ MEM_URL: base, MEM_TOKEN: token, MEM_SCOPE: smokeScope });
    assert.equal(cleanupFailure.status, 1);
    assert.match(cleanupFailure.stderr, /el registro sintético puede permanecer/);
    assert.doesNotMatch(cleanupFailure.stderr, /synthetic-smoke-token/);
  } finally { await new Promise<void>((resolve, reject) => fake.close(error => error ? reject(error) : resolve())); }
});
