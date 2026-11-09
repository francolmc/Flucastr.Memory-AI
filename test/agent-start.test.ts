import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { promisify } from 'node:util';
import { openAuthorizedMemory, type MemoryInput } from '../src/memory.js';
import { startLocalServer } from '../src/http-server.js';
import { createHttpAuthenticator, digestSyntheticKey } from '../src/http-auth.js';

const exec = promisify(execFile);
const hook = join(process.cwd(), 'integrations/claude-session-start.mjs');
const memBin = join(process.cwd(), 'dist/src/mem.js');
const token = 'agent-start-synthetic-token-012345678901';
const record = (id: string, scope: string, text = id): MemoryInput => ({
  id, type: 'decision', scope, text, origin: 'test', date: '2026-11-08',
});

async function runHook({ cwd, path, scope, env = {} }: {
  cwd: string; path?: string; scope?: string; env?: NodeJS.ProcessEnv;
}) {
  const args = [hook, ...(scope ? ['--scope', scope] : [])];
  const childEnv: NodeJS.ProcessEnv = { PATH: process.env.PATH ?? '', HOME: cwd };
  Object.assign(childEnv, env);
  if (path && env.PATH === undefined) childEnv.PATH = `${path}${delimiter}${process.env.PATH ?? ''}`;
  return runWithInput(process.execPath, args, {
    cwd,
    env: childEnv,
    input: JSON.stringify({ hook_event_name: 'SessionStart', cwd }),
  });
}

function runWithInput(file: string, args: string[], options: { cwd: string; env: NodeJS.ProcessEnv; input: string }) {
  return new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(file, args, { cwd: options.cwd, env: options.env, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = ''; let stderr = '';
    child.stdout.setEncoding('utf8').on('data', chunk => { stdout += chunk; });
    child.stderr.setEncoding('utf8').on('data', chunk => { stderr += chunk; });
    child.once('error', reject);
    child.once('close', code => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`child exited ${code}: ${stderr}`)));
    child.stdin.end(options.input);
  });
}

test('Claude SessionStart injects recent project and general records without truncation', async () => {
  const snippet = JSON.parse(readFileSync(join(process.cwd(), 'integrations/claude-settings.example.json'), 'utf8'));
  const settingsCommand = snippet.hooks.SessionStart[0].hooks[0].command as string;
  assert.match(settingsCommand, /^node '.+claude-session-start\.mjs'$/);
  const dir = mkdtempSync(join(tmpdir(), 'agent-start-'));
  const repo = join(dir, 'repo');
  const nested = join(repo, 'nested');
  const clone = join(dir, 'second-copy', 'repo');
  const path = join(dir, 'bin');
  mkdirSync(nested, { recursive: true }); mkdirSync(path);
  await exec('git', ['init', '-q'], { cwd: repo });
  const store = openAuthorizedMemory(join(dir, 'server.sqlite'));
  const auth = createHttpAuthenticator({ state: { currentDigest: digestSyntheticKey(token), issuedAt: Date.now() } });
  const server = await startLocalServer({ store, auth, port: 0 });
  try {
    for (let i = 0; i < 17; i++) store.save(record(`repo-${i}`, 'project:repo', i === 16 ? `large-${'x'.repeat(5000)}` : `project-${i}`));
    store.save(record('general-memory', 'general', 'general decision'));
    store.save(record('other-project', 'project:other', 'must not leak'));
    const expectedIds = [...store.recent({ scope: 'project:repo', limit: 100 }), ...store.recent({ scope: 'project:other', limit: 100 })].map(item => item.id).sort();
    writeFileSync(join(path, 'mem'), `#!/bin/sh\nexec "${process.execPath}" "${memBin}" "$@"\n`);
    chmodSync(join(path, 'mem'), 0o755);
    const result = await runHook({ cwd: nested, path, env: { MEM_URL: `http://127.0.0.1:${server.address.port}`, MEM_TOKEN: token } });
    const payload = JSON.parse(result.stdout);
    assert.equal(payload.hookSpecificOutput.hookEventName, 'SessionStart');
    const memories = JSON.parse(payload.hookSpecificOutput.additionalContext.split('\n').slice(1).join('\n')).memories as MemoryInput[];
    assert.equal(memories.length, 15);
    assert.ok(memories.some((item: MemoryInput) => item.id === 'repo-16' && item.text.length > 4000));
    assert.ok(memories.some((item: MemoryInput) => item.id === 'general-memory'));
    assert.ok(!result.stdout.includes('other-project'));
    mkdirSync(clone, { recursive: true }); await exec('git', ['init', '-q'], { cwd: clone });
    const homonym = await runHook({ cwd: clone, path, env: { MEM_URL: `http://127.0.0.1:${server.address.port}`, MEM_TOKEN: token } });
    const homonymMemories = JSON.parse(JSON.parse(homonym.stdout).hookSpecificOutput.additionalContext.split('\n').slice(1).join('\n')).memories as MemoryInput[];
    assert.deepEqual(homonymMemories.map(item => item.id), memories.map(item => item.id), 'same root basename resolves the same project scope');
    const explicitStart = Date.now();
    const explicit = await runHook({ cwd: dir, path, scope: 'project:repo', env: { MEM_URL: `http://127.0.0.1:${server.address.port}`, MEM_TOKEN: token } });
    const explicitMemories: MemoryInput[] = explicit.stdout
      ? JSON.parse(JSON.parse(explicit.stdout).hookSpecificOutput.additionalContext.split('\n').slice(1).join('\n')).memories as MemoryInput[]
      : [];
    assert.deepEqual(explicitMemories.map(item => item.id), memories.map(item => item.id), `explicit scope response differs after ${Date.now() - explicitStart}ms; explicit=${explicitMemories.map(item => item.id).join(',') || '<empty>'}; default=${memories.map(item => item.id).join(',')}`);
    assert.deepEqual([...store.recent({ scope: 'project:repo', limit: 100 }), ...store.recent({ scope: 'project:other', limit: 100 })].map(item => item.id).sort(), expectedIds);
  } finally {
    await server.close(); store.close(); rmSync(dir, { recursive: true, force: true });
  }
});

test('Claude SessionStart stays silent for empty, invalid, missing and slow mem clients', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'agent-start-errors-'));
  const path = join(dir, 'bin'); mkdirSync(path);
  const home = join(dir, 'client-home'); mkdirSync(home);
  const fake = join(path, 'mem');
  const writeFake = (body: string) => { writeFileSync(fake, `#!/usr/bin/env node\n${body}\n`); chmodSync(fake, 0o755); };
  try {
    writeFake("process.stdout.write('{\\\"memories\\\":[]}');");
    assert.equal((await runHook({ cwd: dir, path, scope: 'general' })).stdout, '');
    writeFake("process.stdout.write('not-json');");
    assert.equal((await runHook({ cwd: dir, path, scope: 'general' })).stdout, '');
    writeFake('setInterval(() => {}, 1000);');
    const start = Date.now();
    assert.equal((await runHook({ cwd: dir, path, scope: 'general' })).stdout, '');
    assert.ok(Date.now() - start <= 3000, `timed out after ${Date.now() - start}ms`);
    const absent = await runHook({ cwd: dir, scope: 'general', env: { PATH: '' } });
    assert.equal(absent.stdout, '');
    assert.equal(absent.stderr, '');
    const malformed = await runWithInput(process.execPath, [hook], { cwd: dir, env: { PATH: process.env.PATH, HOME: dir }, input: '{' });
    assert.equal(malformed.stdout, ''); assert.equal(malformed.stderr, '');

    writeFileSync(fake, `#!/bin/sh\nexec "${process.execPath}" "${memBin}" "$@"\n`); chmodSync(fake, 0o755);
    const realEnv = { HOME: home };
    const noConfig = await runHook({ cwd: dir, path, scope: 'general', env: realEnv });
    assert.equal(noConfig.stdout, ''); assert.equal(noConfig.stderr, '');
    const noGit = await runHook({ cwd: dir, path, env: { ...realEnv, MEM_URL: 'http://127.0.0.1:7420', MEM_TOKEN: token } });
    assert.equal(noGit.stdout, ''); assert.equal(noGit.stderr, '');
    const offline = await runHook({ cwd: dir, path, scope: 'general', env: { ...realEnv, MEM_URL: 'http://127.0.0.1:1', MEM_TOKEN: token } });
    assert.equal(offline.stdout, ''); assert.equal(offline.stderr, '');

    const store = openAuthorizedMemory(join(dir, 'server.sqlite'));
    const auth = createHttpAuthenticator({ state: { currentDigest: digestSyntheticKey(token), issuedAt: Date.now() } });
    const server = await startLocalServer({ store, auth, port: 0 });
    try {
      const wrongToken = await runHook({ cwd: dir, path, scope: 'general', env: { ...realEnv, MEM_URL: `http://127.0.0.1:${server.address.port}`, MEM_TOKEN: 'wrong-synthetic-token' } });
      assert.equal(wrongToken.stdout, ''); assert.equal(wrongToken.stderr, '');
    } finally { await server.close(); store.close(); }

    let delayedResponse: NodeJS.Timeout | undefined;
    const slowServer = createServer((_request, response) => {
      delayedResponse = setTimeout(() => { response.writeHead(200, { 'content-type': 'application/json' }).end('{"memories":[]}'); }, 10_000);
    });
    await new Promise<void>(resolve => slowServer.listen(0, '127.0.0.1', resolve));
    const address = slowServer.address(); assert.ok(address && typeof address !== 'string');
    const slowStart = Date.now();
    try {
      const slow = await runHook({ cwd: dir, path, scope: 'general', env: { ...realEnv, MEM_URL: `http://127.0.0.1:${address.port}`, MEM_TOKEN: token } });
      assert.equal(slow.stdout, ''); assert.equal(slow.stderr, '');
      assert.ok(Date.now() - slowStart <= 3000, `slow HTTP took ${Date.now() - slowStart}ms`);
    } finally {
      if (delayedResponse) clearTimeout(delayedResponse);
      slowServer.closeAllConnections(); await new Promise<void>(resolve => slowServer.close(() => resolve()));
    }
    assert.deepEqual(readdirSync(home), []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
