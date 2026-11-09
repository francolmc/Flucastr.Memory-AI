import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createAssistantMessageEventStream } from '@earendil-works/pi-ai';
import { getModel } from '@earendil-works/pi-ai/compat';
import { createAgentSession, DefaultResourceLoader, ModelRuntime, SessionManager, SettingsManager } from '@earendil-works/pi-coding-agent';
import { openAuthorizedMemory } from '../src/memory.js';
import { startLocalServer } from '../src/http-server.js';
import { createHttpAuthenticator, digestSyntheticKey } from '../src/http-auth.js';

const exec = promisify(execFile);
const token = 'pi-actions-synthetic-token-012345678901234567890';
const scope = 'project:pi-actions-explicit';
const adverseText = `Texto adverso 'comillas' "dobles" $(touch MARCA) y \`backticks\``;
const adverseQuoted = `'${adverseText.replace(/'/g, `'\\''`)}'`;

test('Pi SDK executes real bash search and save tools against isolated HTTP and SQLite memory', async () => {
  const root = mkdtempSync(join(tmpdir(), 'pi-memory-actions-'));
  const cwd = join(root, 'checkout-with-different-name'); const neighbor = join(root, 'neighbor'); const home = join(root, 'home'); const binDir = join(root, 'bin');
  mkdirSync(cwd); mkdirSync(neighbor); mkdirSync(home); mkdirSync(binDir);
  const originalEnv = { PATH: process.env.PATH, HOME: process.env.HOME, MEM_URL: process.env.MEM_URL, MEM_TOKEN: process.env.MEM_TOKEN, MEM_REAL_BIN: process.env.MEM_REAL_BIN, MEM_ARGV_LOG: process.env.MEM_ARGV_LOG };
  await exec('git', ['init', '-q'], { cwd });
  const database = join(root, 'server.sqlite');
  const store = openAuthorizedMemory(database);
  const server = await startLocalServer({ store, auth: createHttpAuthenticator({ state: { currentDigest: digestSyntheticKey(token), issuedAt: Date.now() } }), port: 0 });
  const sessions: Array<{ dispose(): void }> = [];
  try {
    store.save({ id: 'expected-project-memory', type: 'decision', scope, text: 'synthetic azure search marker', origin: 'test', date: '2026-11-09' });
    store.save({ id: 'neighbor-project-memory', type: 'decision', scope: 'project:neighbor', text: 'synthetic azure search marker', origin: 'test', date: '2026-11-09' });
    const pack = await exec('npm', ['pack', '--ignore-scripts', '--offline', '--json', '--pack-destination', root], { cwd: process.cwd(), env: { PATH: process.env.PATH ?? '', HOME: home }, encoding: 'utf8' });
    const prefix = join(root, 'installed'); mkdirSync(prefix);
    await exec('npm', ['install', '--prefix', prefix, '--ignore-scripts', '--omit=dev', '--no-audit', '--no-fund', '--offline', join(root, JSON.parse(pack.stdout)[0].filename as string)], { cwd: root, env: { PATH: process.env.PATH ?? '', HOME: home }, encoding: 'utf8' });
    const installed = join(prefix, 'node_modules', 'flucastr-memory-ai');
    const log = join(root, 'mem-argv.jsonl');
    const wrapper = join(binDir, 'mem');
    writeFileSync(wrapper, `#!/usr/bin/env node\nconst fs=require('node:fs');const cp=require('node:child_process');fs.appendFileSync(process.env.MEM_ARGV_LOG,JSON.stringify(process.argv.slice(2))+'\\n');const r=cp.spawnSync(process.env.MEM_REAL_BIN,process.argv.slice(2),{stdio:'inherit',env:process.env});process.exit(r.status??1);\n`);
    chmodSync(wrapper, 0o755);
    const realMem = join(prefix, 'node_modules', '.bin', 'mem');
    const baseEnv: NodeJS.ProcessEnv = { ...process.env, PATH: `${binDir}${delimiter}${process.env.PATH ?? ''}`, HOME: home, MEM_URL: `http://127.0.0.1:${server.address.port}`, MEM_TOKEN: token, MEM_REAL_BIN: realMem, MEM_ARGV_LOG: log };
    Object.assign(process.env, { PATH: baseEnv.PATH, HOME: home, MEM_URL: baseEnv.MEM_URL, MEM_TOKEN: token, MEM_REAL_BIN: realMem, MEM_ARGV_LOG: log });
    const model = getModel('anthropic', 'claude-sonnet-4-5'); assert.ok(model);
    let nextSession = 0;
    const makeSession = async (actions: boolean) => {
      const agentDir = join(home, `agent-${nextSession++}`); mkdirSync(agentDir);
      const settings = SettingsManager.inMemory({ defaultTools: [] });
      const runtime = await ModelRuntime.create({ authPath: join(agentDir, 'auth.json'), modelsPath: null, allowModelNetwork: false, refreshOnCreate: false });
      await runtime.setRuntimeApiKey(model.provider, 'synthetic-test-key-never-sent-to-a-provider');
      const env = { ...baseEnv };
      const loader = new DefaultResourceLoader({ cwd, agentDir, settingsManager: settings, noSkills: true, noPromptTemplates: true, noThemes: true, noContextFiles: true,
        extensionFactories: [(await import(pathToFileURL(join(installed, 'integrations', 'pi-memory.mjs')).href)).createPiMemoryExtension({ scope, env })] });
      await loader.reload();
      const { session } = await createAgentSession({ cwd, agentDir, model, modelRuntime: runtime, settingsManager: settings, sessionManager: SessionManager.inMemory(cwd), resourceLoader: loader,
        ...(actions ? { tools: ['bash'] } : { noTools: 'all' as const }) });
      const requests: string[] = [];
      session.agent.streamFunction = async (requestModel, context) => {
        requests.push(JSON.stringify(context.messages));
        const stream = createAssistantMessageEventStream();
        const actionIndex = requests.length - 1;
        const content = actions && actionIndex === 0
          ? [{ type: 'toolCall' as const, id: 'call-search', name: 'bash', arguments: { command: `mem search --query 'synthetic azure search marker' --scope '${scope}'` } }]
          : actions && actionIndex === 1
            ? [{ type: 'toolCall' as const, id: 'call-save', name: 'bash', arguments: { command: `mem save --type learning --text 'Pi SDK action saved marker' --scope '${scope}'` } }]
            : actions && actionIndex === 2
              ? [{ type: 'toolCall' as const, id: 'call-save-adverse', name: 'bash', arguments: { command: `mem save --type learning --text ${adverseQuoted} --scope '${scope}'` } }]
              : [{ type: 'text' as const, text: 'synthetic response' }];
        stream.end({ role: 'assistant', content, api: requestModel.api, provider: requestModel.provider, model: requestModel.id, usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } }, stopReason: actions && actionIndex < 3 ? 'toolUse' : 'stop', timestamp: Date.now() });
        return stream;
      };
      await session.bindExtensions({}); sessions.push(session); return { session, requests };
    };

    const first = await makeSession(true);
    await first.session.prompt('Find relevant memory and save a consolidated learning.');
    assert.equal(first.requests.length, 4, 'SDK processed search and two save tool calls before the final model response');
    const searchMessages = JSON.parse(first.requests[1]!) as Array<{ role: string; toolCallId?: string; isError?: boolean; content: unknown }>;
    const searchResult = searchMessages.find(message => message.role === 'toolResult' && message.toolCallId === 'call-search');
    assert.ok(searchResult, 'search returned a tool result to the model');
    assert.equal(searchResult.isError, false, 'search tool succeeded');
    assert.match(JSON.stringify(searchResult.content), /expected-project-memory/);
    assert.ok(!JSON.stringify(searchResult.content).includes('neighbor-project-memory'));
    assert.match(first.requests[1]!, /expected-project-memory/);
    assert.ok(!first.requests[1]!.includes('neighbor-project-memory'), 'explicit scope excludes the neighboring project');
    assert.match(first.requests[2]!, /Pi SDK action saved marker/);
    const argv = readFileSync(log, 'utf8').trim().split('\n').map(line => JSON.parse(line) as string[]);
    assert.deepEqual(argv[0], ['recent', '--limit', '15', '--scope', scope], 'extension loads recent context once at startup');
    assert.deepEqual(argv[1], ['search', '--query', 'synthetic azure search marker', '--scope', scope]);
    assert.deepEqual(argv[2]?.slice(0, 1), ['save']);
    assert.ok(argv[2]?.includes('--scope') && argv[2]?.includes(scope), 'save passes the configured scope as one argument');
    assert.equal(argv.length, 4, 'the SDK executed exactly recent plus the scripted search and two save commands');
    assert.equal(argv[3]?.[0], 'save', 'the adverse save runs after the search and the first save');
    const persisted = store.search({ scope, query: 'Pi SDK action saved marker' });
    const savedMatches = persisted.filter(memory => memory.text === 'Pi SDK action saved marker');
    assert.equal(savedMatches.length, 1);
    const savedId = savedMatches[0]!.id;
    assert.match(first.requests[2]!, new RegExp(savedId), 'save result returned the persistent ID to the model');
    assert.equal(store.search({ scope: 'project:neighbor', query: 'Pi SDK action saved marker' }).filter(memory => memory.text === 'Pi SDK action saved marker').length, 0);

    const adverseResult = (JSON.parse(first.requests[3]!) as Array<{ role: string; toolCallId?: string; isError?: boolean }>).find(message => message.role === 'toolResult' && message.toolCallId === 'call-save-adverse');
    assert.ok(adverseResult, 'adverse save returned a tool result to the model');
    assert.equal(adverseResult.isError, false, 'adverse save succeeded');
    const adverseMatches = store.search({ scope, query: 'adverso' }).filter(memory => memory.text === adverseText);
    assert.equal(adverseMatches.length, 1, 'adverse text persisted exactly as written');
    assert.equal(existsSync(join(cwd, 'MARCA')), false, 'quoted metacharacters were not executed');

    const next = await makeSession(false); await next.session.prompt('Load recent memory in another session.');
    assert.match(next.requests[0]!, new RegExp(savedId));
    assert.match(next.requests[0]!, /Pi SDK action saved marker/);
    assert.equal(existsSync(join(home, 'mem.sqlite')), false, 'all data remained in the isolated server database');
  } finally {
    for (const session of sessions) session.dispose();
    for (const [key, value] of Object.entries(originalEnv)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    await server.close(); store.close(); rmSync(root, { recursive: true, force: true });
  }
});
