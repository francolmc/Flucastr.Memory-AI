import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:https';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { postF03 } from '../src/http-client.js';
import { createEphemeralTls } from './f03-tls.js';

test('postF03 sends both exact routes over verified HTTPS', async () => {
  const tls = createEphemeralTls();
  const seen: string[] = [];
  const server = createServer({ key: tls.key, cert: tls.cert }, (req, res) => {
    seen.push(req.url ?? '');
    req.resume();
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ memories: [] }));
  });
  try {
    const caPath = join(tls.directory, 'client-ca.pem');
    const tokenPath = join(tls.directory, 'client-token');
    writeFileSync(caPath, tls.ca);
    writeFileSync(tokenPath, 'synthetic-token-012345678901234567890');
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const options = { url: `https://127.0.0.1:${address.port}`, caPath, tokenPath };
    await postF03(options, '/v1/memories', { memory: {} });
    await postF03(options, '/v1/search', { scope: 'general', query: 'synthetic' });
    assert.deepEqual(seen, ['/v1/memories', '/v1/search']);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    tls.cleanup();
  }
});
