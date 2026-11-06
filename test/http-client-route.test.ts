import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { postF03 } from '../src/http-client.js';

test('postF03 sends both JSON routes over HTTP', async () => {
  const dir=mkdtempSync(join(tmpdir(),'http-client-'));
  const seen: string[] = [];
  const server = createServer( (req, res) => {
    seen.push(req.url ?? '');
    req.resume();
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ memories: [] }));
  });
  try {
    const tokenPath = join(dir, 'client-token');
    writeFileSync(tokenPath, 'synthetic-token-012345678901234567890');
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const options = { url: `http://127.0.0.1:${address.port}`, tokenPath };
    await postF03(options, '/v1/memories', { memory: {} });
    await postF03(options, '/v1/search', { scope: 'general', query: 'synthetic' });
    assert.deepEqual(seen, ['/v1/memories', '/v1/search']);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    rmSync(dir,{recursive:true,force:true});
  }
});
