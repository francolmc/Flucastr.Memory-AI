import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request } from 'node:http';
import { startServe } from '../src/serve.js';

test('serve binds loopback, authenticates HTTP, closes and reopens DB', async () => {
  const home = await mkdtemp(join(tmpdir(), 'mem-serve-'));
  const token = 'test_token.with~safe-chars';
  let handle: Awaited<ReturnType<typeof startServe>> | undefined;
  try {
    const env = { ...process.env, MEM_DB: join(home, 'db', 'memory.sqlite'), MEM_TOKEN: token };
    handle = await startServe(['--port', '0'], env, home);
    assert.equal(handle.address.address, '127.0.0.1');
    const post = (authorization?: string) => new Promise<number>((resolve, reject) => {
      const req = request({ host: '127.0.0.1', port: handle!.address.port, path: '/v1/search', method: 'POST', headers: { 'content-type': 'application/json', ...(authorization ? { authorization } : {}) } }, res => { res.resume(); res.on('end', () => resolve(res.statusCode!)); });
      req.on('error', reject); req.end('{"scope":"general","query":""}');
    });
    assert.equal(await post(), 401);
    assert.equal(await post(`Bearer ${token}`), 200);
    await handle.close(); handle = undefined;
    const reopened = await startServe(['--port', '0'], env, home);
    await reopened.close();
  } finally { await handle?.close(); await rm(home, { recursive: true, force: true }); }
});

test('missing token and invalid arguments fail before DB creation', async () => {
  const home = await mkdtemp(join(tmpdir(), 'mem-serve-'));
  try {
    await assert.rejects(startServe([], { ...process.env, MEM_DB: join(home, 'db.sqlite'), MEM_TOKEN: undefined }, home));
    await assert.rejects(startServe(['--bogus'], { ...process.env, MEM_DB: join(home, 'db.sqlite'), MEM_TOKEN: 'secret' }, home));
    const { access } = await import('node:fs/promises');
    await assert.rejects(access(join(home, 'db.sqlite')));
  } finally { await rm(home, { recursive: true, force: true }); }
});

test('invalid MEM_MAX_BODY_BYTES fails before DB creation', async () => {
  const home = await mkdtemp(join(tmpdir(), 'mem-serve-invalid-limit-'));
  const db = join(home, 'memory.sqlite');
  try {
    await assert.rejects(startServe([], { ...process.env, MEM_DB: db, MEM_TOKEN: 'secret', MEM_MAX_BODY_BYTES: '0' }, home));
    const { access } = await import('node:fs/promises');
    await assert.rejects(access(db));
  } finally { await rm(home, { recursive: true, force: true }); }
});

test('serve applies MEM_MAX_BODY_BYTES to authenticated requests', async () => {
  const home = await mkdtemp(join(tmpdir(), 'mem-serve-limit-'));
  const token = 'test_token.with~safe-chars';
  let handle: Awaited<ReturnType<typeof startServe>> | undefined;
  try {
    handle = await startServe(['--port', '0'], { ...process.env, MEM_DB: join(home, 'memory.sqlite'), MEM_TOKEN: token, MEM_MAX_BODY_BYTES: '10' }, home);
    const response = await new Promise<{ status: number; body: string }>((resolve, reject) => {
      const req = request({ host: '127.0.0.1', port: handle!.address.port, path: '/v1/search', method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' } }, res => {
        let body = ''; res.setEncoding('utf8'); res.on('data', chunk => body += chunk); res.on('end', () => resolve({ status: res.statusCode!, body }));
      });
      req.on('error', reject); req.end('{"scope":"general","query":""}');
    });
    assert.equal(response.status, 413);
    assert.deepEqual(JSON.parse(response.body), { error: 'payload_too_large' });
  } finally { await handle?.close(); await rm(home, { recursive: true, force: true }); }
});
