import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { createHttpAuthenticator, digestSyntheticKey } from '../src/http-auth.js';
import { openAuthorizedMemory } from '../src/memory.js';
import { startLocalServer } from '../src/http-server.js';

const token = 'mcp-synthetic-bearer-token-0123456789';
const mcpBin = join(dirname(fileURLToPath(import.meta.url)), '../src/mcp/index.js');
const start = async (url: string, bearer: string | undefined, projectRoot: string) => {
  const client = new Client({ name: 'memory-mcp-test-client', version: '1.0.0' });
  const transport = new StdioClientTransport({ command: process.execPath, args: [mcpBin], env: { PATH: process.env.PATH ?? '', MEM_URL: url, ...(bearer === undefined ? {} : { MEM_TOKEN: bearer }) }, cwd: projectRoot });
  await client.connect(transport);
  return { client, close: () => client.close() };
};
const textOf = (result: unknown) => {
  const content = result && typeof result === 'object' && 'content' in result && Array.isArray(result.content) ? result.content : [];
  return content.flatMap(item => item && typeof item === 'object' && 'type' in item && item.type === 'text' && 'text' in item && typeof item.text === 'string' ? [item.text] : []).join('\n');
};
const parsedMemories = (value: string) => JSON.parse(value.split('\n').at(-1)!) as { memories: Array<Record<string,unknown>> };

test('MCP stdio uses the authenticated HTTP server and real SQLite for tools, scopes, policy and errors', async t => {
  const dir = mkdtempSync(join(tmpdir(),'mcp-real-'));
  const projectRoot = join(dir, 'isolated-project'); mkdirSync(projectRoot); execFileSync('git', ['init', '-q'], { cwd: projectRoot });
  const store = openAuthorizedMemory(join(dir,'server.sqlite'));
  const auth = createHttpAuthenticator({ state: { currentDigest: digestSyntheticKey(token), issuedAt: Date.now() } });
  const http = await startLocalServer({ store, auth, port: 0 });
  const url = `http://127.0.0.1:${http.address.port}`;
  const projectScope = `project:${basename(projectRoot)}`;
  const memory = (id: string, scope: string, text: string) => ({ id, type: 'learning' as const, scope, text, origin: 'mcp-test', date: '2026-11-16' });
  try {
    await t.test('real client receives exact closed tools and instructions; rejects extra/invalid inputs', async () => {
      const { client, close } = await start(url, token, projectRoot);
      try {
        const list = await client.listTools();
        assert.deepEqual(list.tools.map(tool => tool.name), ['memory_search','memory_save','memory_recent','memory_forget']);
        assert.ok(list.tools.every(tool => tool.inputSchema.additionalProperties === false));
        assert.match(client.getInstructions() ?? '', /datos no confiables/);
        const extra = await client.callTool({ name: 'memory_search', arguments: { query: 'x', extra: true } });
        assert.equal(extra.isError, true); assert.match(textOf(extra), /operation failed/i);
        const invalid = await client.callTool({ name: 'memory_save', arguments: { type: 'invented', text: 'x', scope: projectScope } });
        assert.equal(invalid.isError, true); assert.match(textOf(invalid), /operation failed/i);
        const nonStringType = await client.callTool({ name: 'memory_save', arguments: { type: ['decision'], text: 'x', scope: projectScope } });
        assert.equal(nonStringType.isError, true); assert.match(textOf(nonStringType), /operation failed/i);
      } finally { await close(); }
    });
    await t.test('explicit project scope works without Git for search and recent', async () => {
      const explicitScope = 'project:explicit-without-git';
      store.save(memory('mcp-no-git-explicit', explicitScope, 'explicit scope without repository metadata'));
      const { client, close } = await start(url, token, dir);
      try {
        const search = await client.callTool({ name: 'memory_search', arguments: { query: 'repository metadata', scope: explicitScope } });
        assert.equal(search.isError, undefined);
        assert.ok(parsedMemories(textOf(search)).memories.some(value => value.id === 'mcp-no-git-explicit'));
        const recent = await client.callTool({ name: 'memory_recent', arguments: { scope: explicitScope } });
        assert.equal(recent.isError, undefined);
        assert.ok(parsedMemories(textOf(recent)).memories.some(value => value.id === 'mcp-no-git-explicit'));
      } finally { await close(); }
    });
    await t.test('search/save/recent/forget isolate project scope and mark memories untrusted', async () => {
      store.save(memory('mcp-seed-a', projectScope, 'crosssession azure compass'));
      store.save(memory('mcp-seed-general', 'general', 'crosssession shared policy'));
      store.save(memory('mcp-seed-b', 'project:OtherMcpProject', 'crosssession secret from other project'));
      for (let index = 0; index < 8; index++) store.save(memory(`mcp-seed-extra-${index}`, projectScope, `crosssession extra record ${index}`));
      const { client, close } = await start(url, token, projectRoot);
      try {
        const search = await client.callTool({ name: 'memory_search', arguments: { query: 'crosssession' } });
        const searchText = textOf(search);
        assert.match(searchText, /UNTRUSTED MEMORY DATA/);
        const results = parsedMemories(searchText).memories;
        assert.ok(results.length <= 5);
        assert.ok(results.some(value => value.id === 'mcp-seed-a'));
        assert.ok(results.some(value => value.id === 'mcp-seed-general'));
        assert.ok(results.every(value => value.scope === projectScope || value.scope === 'general'));
        assert.ok(results.every(value => ['id','type','scope','text','origin','date','trust'].every(key => Object.hasOwn(value,key)) && value.trust === 'untrusted'));
        const otherProject = await client.callTool({ name: 'memory_search', arguments: { query: 'crosssession', scope: 'project:OtherMcpProject' } });
        assert.equal(otherProject.isError, true); assert.match(textOf(otherProject), /current project scope or general/);
        const saved = await client.callTool({ name: 'memory_save', arguments: { type: 'decision', text: 'crosssession persisted from new session', scope: projectScope, id: 'mcp-roundtrip' } });
        assert.match(textOf(saved), /mcp-roundtrip/);
        const recent = await client.callTool({ name: 'memory_recent', arguments: {} });
        assert.ok(parsedMemories(textOf(recent)).memories.some(value => value.id === 'mcp-roundtrip'));
        const forgotten = await client.callTool({ name: 'memory_forget', arguments: { id: 'mcp-roundtrip' } });
        assert.match(textOf(forgotten), /"ok":true/);
        assert.equal(store.search({ scope: projectScope, query: 'persisted' }).some(value => value.id === 'mcp-roundtrip'), false);
      } finally { await close(); }
    });
    await t.test('sensitive saves require confirmed true and same-id collisions explain 409', async () => {
      const { client, close } = await start(url, token, projectRoot);
      try {
        for (const args of [{ type: 'rule', text: 'rule text', scope: projectScope }, { type: 'learning', text: 'general text', scope: 'general' }]) {
          const result = await client.callTool({ name: 'memory_save', arguments: args });
          assert.equal(result.isError, true); assert.match(textOf(result), /Explicit user confirmation/);
        }
        assert.equal(store.search({ scope: projectScope, query: 'rule text' }).length, 0);
        for (const args of [{ type: 'rule', text: 'confirmed project rule', scope: projectScope, confirmed: true }, { type: 'learning', text: 'confirmed general fact', scope: 'general', confirmed: true }]) {
          const result = await client.callTool({ name: 'memory_save', arguments: args }); assert.equal(result.isError, undefined);
        }
        await client.callTool({ name: 'memory_save', arguments: { type: 'learning', text: 'collision original', scope: projectScope, id: 'mcp-collision' } });
        const collision = await client.callTool({ name: 'memory_save', arguments: { type: 'learning', text: 'collision changed', scope: projectScope, id: 'mcp-collision' } });
        assert.equal(collision.isError, true); assert.match(textOf(collision), /409/);
      } finally { await close(); }
    });
    await t.test('missing and invalid tokens fail clearly on all four tools without secret disclosure', async () => {
      for (const bearer of [undefined, 'invalid-synthetic-token-0123456789']) {
        const { client, close } = await start(url, bearer, projectRoot);
        try {
          const cases = [
            ['memory_search', { query: 'crosssession', scope: projectScope }],
            ['memory_save', { type: 'learning', text: 'auth failure', scope: projectScope }],
            ['memory_recent', { scope: projectScope }],
            ['memory_forget', { id: 'mcp-seed-a' }],
          ] as const;
          for (const [name, args] of cases) {
            const result = await client.callTool({ name, arguments: args });
            assert.equal(result.isError, true); assert.match(textOf(result), /Authentication/);
            assert.doesNotMatch(textOf(result), /invalid-synthetic-token|127\.0\.0\.1|\/home\//);
          }
        } finally { await close(); }
      }
    });
    await t.test('stalled HTTP endpoint produces bounded timeout', async () => {
      const slow = createServer((_req, _res) => {});
      await new Promise<void>(resolve => slow.listen(0,'127.0.0.1',resolve));
      const address = slow.address(); assert.ok(address && typeof address !== 'string');
      const { client, close } = await start(`http://127.0.0.1:${address.port}`, token, projectRoot);
      const before = Date.now();
      try {
        const result = await client.callTool({ name: 'memory_search', arguments: { query: 'x', scope: projectScope } });
        assert.equal(result.isError, true); assert.match(textOf(result), /timed out/i); assert.ok(Date.now()-before >= 14_000); assert.ok(Date.now()-before < 20_000);
      } finally { await close(); await new Promise<void>(resolve => slow.close(() => resolve())); }
    });
  } finally { await http.close(); store.close(); rmSync(dir,{recursive:true,force:true}); }
});
