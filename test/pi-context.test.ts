import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFile, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { createServer } from 'node:http';
import { createAssistantMessageEventStream } from '@earendil-works/pi-ai';
import { getModel } from '@earendil-works/pi-ai/compat';
import { createAgentSession, DefaultResourceLoader, ModelRuntime, SessionManager, SettingsManager } from '@earendil-works/pi-coding-agent';
import { openAuthorizedMemory, type MemoryInput } from '../src/memory.js';
import { startLocalServer } from '../src/http-server.js';
import { createHttpAuthenticator, digestSyntheticKey } from '../src/http-auth.js';

const exec = promisify(execFile);
const token = 'pi-sdk-synthetic-token-012345678901234567890';
const record: MemoryInput = { id: 'pi-decision-expected', type: 'decision', scope: 'project:pi-project', text: 'The service owns the only memory database.', origin: 'test', date: '2026-11-08' };

test('Pi SDK receives packaged memory once per session through its real request pipeline', async () => {
  const root = mkdtempSync(join(tmpdir(), 'pi-sdk-context-'));
  const cwd = join(root, 'pi-project'); const home = join(root, 'home'); const binDir = join(root, 'bin');
  mkdirSync(cwd); mkdirSync(home); mkdirSync(binDir);
  await exec('git', ['init', '-q'], { cwd });
  const store = openAuthorizedMemory(join(root, 'server.sqlite'));
  const auth = createHttpAuthenticator({ state: { currentDigest: digestSyntheticKey(token), issuedAt: Date.now() } });
  const server = await startLocalServer({ store, auth, port: 0 });
  const sessions: Array<{ dispose(): void }> = [];
  try {
    store.save(record);
    const packResult = await exec('npm', ['pack', '--ignore-scripts', '--offline', '--json', '--pack-destination', root], {
      cwd: process.cwd(), env: { PATH: process.env.PATH ?? '', HOME: home }, encoding: 'utf8',
    });
    const tarball = join(root, JSON.parse(packResult.stdout)[0].filename as string);
    const prefix = join(root, 'installed'); mkdirSync(prefix);
    await exec('npm', ['install', '--prefix', prefix, '--ignore-scripts', '--omit=dev', '--no-audit', '--no-fund', '--offline', tarball], {
      cwd: root, env: { PATH: process.env.PATH ?? '', HOME: home }, encoding: 'utf8',
    });
    const installed = join(prefix, 'node_modules', 'flucastr-memory-ai');
    const extensionFile = join(installed, 'integrations', 'pi-memory.mjs');
    const { createPiMemoryExtension } = await import(pathToFileURL(extensionFile).href);
    const calls = join(root, 'mem-calls.log'); const realMem = join(prefix, 'node_modules', '.bin', 'mem');
    const callCount = () => existsSync(calls) ? readFileSync(calls, 'utf8').trim().split('\n').filter(Boolean).length : 0;
    const wrapper = join(binDir, 'mem');
    writeFileSync(wrapper, `#!/usr/bin/env node\nconst { appendFileSync } = require('node:fs');\nconst { spawnSync } = require('node:child_process');\nappendFileSync(process.env.MEM_CALLS, 'recent\\n');\nconst result = spawnSync(process.env.MEM_REAL_BIN, process.argv.slice(2), { stdio: 'inherit', env: process.env });\nprocess.exit(result.status ?? 1);\n`);
    chmodSync(wrapper, 0o755);
    const env = {
      PATH: `${binDir}${delimiter}${process.env.PATH ?? ''}`, HOME: home,
      MEM_URL: `http://127.0.0.1:${server.address.port}`, MEM_TOKEN: token,
      MEM_CALLS: calls, MEM_REAL_BIN: realMem,
    };
    const model = getModel('anthropic', 'claude-sonnet-4-5');
    assert.ok(model, 'synthetic static model is available without credentials');

    const openSession = async (options: { url?: string | null; token?: string | null; cwd?: string; scope?: string | null; path?: string; extension?: (pi: any) => void } = {}) => {
      const agentDir = join(home, `agent-${sessions.length}`); mkdirSync(agentDir);
      const sessionCwd = options.cwd ?? cwd;
      const settings = SettingsManager.inMemory({ defaultTools: [] });
      const runtime = await ModelRuntime.create({
        authPath: join(agentDir, 'auth.json'), modelsPath: null, allowModelNetwork: false, refreshOnCreate: false,
      });
      await runtime.setRuntimeApiKey(model.provider, 'synthetic-test-key-never-sent-to-a-provider');
      const extensionEnv: NodeJS.ProcessEnv = { ...env, PATH: options.path ?? env.PATH };
      if (options.url === null) delete extensionEnv.MEM_URL;
      else if (options.url !== undefined) extensionEnv.MEM_URL = options.url;
      if (options.token === null) delete extensionEnv.MEM_TOKEN;
      else if (options.token !== undefined) extensionEnv.MEM_TOKEN = options.token;
      const loader = new DefaultResourceLoader({
        cwd: sessionCwd, agentDir, settingsManager: settings, noSkills: true, noPromptTemplates: true, noThemes: true, noContextFiles: true,
        extensionFactories: [options.extension ?? createPiMemoryExtension({
          scope: options.scope,
          env: extensionEnv,
        })],
      });
      await loader.reload();
      const { session } = await createAgentSession({
        cwd: sessionCwd, agentDir, model, modelRuntime: runtime, settingsManager: settings,
        sessionManager: SessionManager.inMemory(sessionCwd), resourceLoader: loader, noTools: 'all',
      });
      const requests: string[] = [];
      session.agent.streamFunction = async (requestModel, context) => {
        requests.push(JSON.stringify(context.messages));
        const stream = createAssistantMessageEventStream();
        stream.end({
          role: 'assistant', content: [{ type: 'text', text: 'synthetic response' }],
          api: requestModel.api, provider: requestModel.provider, model: requestModel.id,
          usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
          stopReason: 'stop', timestamp: Date.now(),
        });
        return stream;
      };
      await session.bindExtensions({});
      sessions.push(session);
      return { session, requests };
    };

    const first = await openSession();
    await first.session.prompt('first prompt');
    assert.equal(first.requests.length, 1);
    assert.equal(first.requests[0]!.split(record.id).length - 1, 1);
    assert.match(first.requests[0]!, /The service owns the only memory database/);
    await first.session.prompt('second prompt');
    assert.equal(first.requests.length, 2);
    assert.equal(first.requests[1]!.split(record.id).length - 1, 1);
    assert.equal(readFileSync(calls, 'utf8').trim().split('\n').length, 1, 'second prompt does not query mem again');

    const next = await openSession();
    await next.session.prompt('new session');
    assert.equal(next.requests[0]!.split(record.id).length - 1, 1, 'a new Pi session reloads memory');
    assert.equal(readFileSync(calls, 'utf8').trim().split('\n').length, 2);

    const mutationDir = join(root, 'mutation'); mkdirSync(mutationDir);
    const mutationExtension = join(mutationDir, 'pi-memory.mjs');
    copyFileSync(join(installed, 'integrations', 'recent-context.mjs'), join(mutationDir, 'recent-context.mjs'));
    const goodExtension = readFileSync(extensionFile, 'utf8');
    const disabledExtension = goodExtension.replace("return { message: { customType: 'flucastr-memory', content, display: false } };", 'return undefined;');
    assert.notEqual(disabledExtension, goodExtension, 'mutation target exists in packaged extension');
    writeFileSync(mutationExtension, disabledExtension);
    const disabledModule = await import(`${pathToFileURL(mutationExtension).href}?mutation=disabled`);
    const beforeMutationCalls = callCount();
    const disabled = await openSession({ extension: disabledModule.createPiMemoryExtension({ env }) });
    await disabled.session.prompt('sensitivity check');
    const injectedCount = disabled.requests[0]!.split(record.id).length - 1;
    assert.equal(callCount(), beforeMutationCalls + 1, 'mutation reached the real mem client with valid configuration');
    assert.equal(injectedCount, 0, 'isolated mutation disables message injection');
    assert.throws(() => assert.equal(injectedCount, 1, 'A3 expects the stored memory in Pi provider context'));

    const offline = await openSession({ url: 'http://127.0.0.1:1' });
    await offline.session.prompt('offline session');
    assert.ok(!offline.requests[0]!.includes(record.id), 'failed load does not reuse another session’s memory');
    assert.equal(callCount(), beforeMutationCalls + 2, 'offline case reached the real mem client');

    const missingEnv = await openSession({ url: null, token: null });
    await missingEnv.session.prompt('missing configuration');
    assert.ok(!missingEnv.requests[0]!.includes(record.id));
    const noGitCwd = join(root, 'outside-git'); mkdirSync(noGitCwd);
    const noGit = await openSession({ cwd: noGitCwd, scope: undefined });
    await noGit.session.prompt('outside Git');
    assert.ok(!noGit.requests[0]!.includes(record.id));
    assert.equal(callCount(), beforeMutationCalls + 4, 'mutation, offline, missing-env, and no-Git cases each reach the installed mem client');
    const wrongToken = await openSession({ token: 'wrong-synthetic-token' });
    await wrongToken.session.prompt('rejected token');
    assert.ok(!wrongToken.requests[0]!.includes(record.id));

    const badBin = join(root, 'bad-bin'); mkdirSync(badBin);
    writeFileSync(join(badBin, 'mem'), `#!${process.execPath}\nconst { appendFileSync } = require('node:fs');\nappendFileSync(process.env.MEM_CALLS, 'invalid-json\\n');\nprocess.stdout.write('not-json');\n`);
    chmodSync(join(badBin, 'mem'), 0o755);
    const invalidResponse = await openSession({ path: badBin });
    await invalidResponse.session.prompt('invalid client response');
    assert.ok(!invalidResponse.requests[0]!.includes(record.id));

    const emptyBin = join(root, 'empty-bin'); mkdirSync(emptyBin);
    const missingBin = await openSession({ path: emptyBin });
    await missingBin.session.prompt('missing mem binary');
    assert.ok(!missingBin.requests[0]!.includes(record.id));

    const empty = await openSession({ scope: 'project:empty' });
    await empty.session.prompt('no stored memory');
    assert.ok(!empty.requests[0]!.includes(record.id));

    let delayedResponse: NodeJS.Timeout | undefined;
    let slowRequestCount = 0;
    const slowServer = createServer((_request, response) => {
      slowRequestCount++;
      delayedResponse = setTimeout(() => { response.writeHead(200, { 'content-type': 'application/json' }).end('{"memories":[]}'); }, 10_000);
    });
    await new Promise<void>(resolve => slowServer.listen(0, '127.0.0.1', resolve));
    const slowAddress = slowServer.address(); assert.ok(slowAddress && typeof slowAddress !== 'string');
    const slowStart = Date.now();
    try {
      const slowPath = [join(prefix, 'node_modules', '.bin'), dirname(process.execPath)].join(delimiter);
      const slow = await openSession({ url: `http://127.0.0.1:${slowAddress.port}`, path: slowPath, scope: 'project:pi-project' });
      await slow.session.prompt('slow server');
      assert.equal(slowRequestCount, 1, 'slow HTTP test received exactly one request from the real mem client');
      assert.ok(!slow.requests[0]!.includes(record.id));
      assert.ok(Date.now() - slowStart <= 3000, `Pi waited ${Date.now() - slowStart}ms for slow memory server`);
    } finally {
      if (delayedResponse) clearTimeout(delayedResponse);
      slowServer.closeAllConnections(); await new Promise<void>(resolve => slowServer.close(() => resolve()));
    }
    assert.equal(existsSync(join(home, 'mem.sqlite')), false, 'Pi client never creates a local database');
  } finally {
    for (const session of sessions) session.dispose();
    await server.close(); store.close(); rmSync(root, { recursive: true, force: true });
  }
});
