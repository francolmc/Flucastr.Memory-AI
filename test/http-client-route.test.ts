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
    const sixFields = { id:'id', type:'decision', scope:'general', text:'text', origin:'test', date:'2026-01-01' };
    res.end(JSON.stringify(req.url === '/v1/memories' ? sixFields : req.url === '/v1/forget' ? {ok:true} : { memories: req.url === '/v1/search' ? [] : Array.from({length: 30}, (_, i) => ({...sixFields,id:`m${i}`,text:'界'.repeat(300)}) ) }));
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
    const recent = await postF03(options, '/v1/recent', { scope:'general', limit:30 });
    assert.equal(JSON.parse(recent).memories.length,30);
    await postF03(options, '/v1/forget', {id:'id'});
    assert.deepEqual(seen, ['/v1/memories', '/v1/search','/v1/recent','/v1/forget']);
  } finally {
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    rmSync(dir,{recursive:true,force:true});
  }
});

test('postF03 accepts a short server-compatible token and rejects empty or invalid characters', async () => {
  const options={url:'http://127.0.0.1:1'};
  await assert.rejects(postF03({...options,token:''},'/v1/search',{}),/Invalid token/);
  await assert.rejects(postF03({...options,token:'bad token'},'/v1/search',{}),/Invalid token/);
  await assert.rejects(postF03({...options,token:'valid-short'},'/v1/search',{}),/Request failed/);
});
