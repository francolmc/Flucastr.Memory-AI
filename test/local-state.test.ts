import test from 'node:test';
import assert from 'node:assert/strict';
import { chmodSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile, spawn } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const exec = promisify(execFile);
const modulePath = fileURLToPath(new URL('../src/local-state.js', import.meta.url));
const memPath = fileURLToPath(new URL('../src/mem.js', import.meta.url));

test('local proposal storage is private, durable, and safe across concurrent processes', async () => {
  const root = mkdtempSync(join(tmpdir(), 'local-proposals-'));
  const xdg = join(root, 'state');
  const script = `import { proposeMemories } from ${JSON.stringify(modulePath)}; await proposeMemories([{type:'decision',scope:'project:parallel',text:process.argv[1]}]);`;
  try {
    await Promise.all(Array.from({ length: 8 }, (_, i) => exec(process.execPath, ['--input-type=module', '-e', script, `worker-${i}`], { env: { ...process.env, XDG_STATE_HOME: xdg } })));
    const dir = join(xdg, 'flucastr-memory-ai');
    const file = join(dir, 'proposals.json');
    assert.equal(statSync(dir).mode & 0o777, 0o700);
    assert.equal(statSync(file).mode & 0o777, 0o600);
    const state = JSON.parse(await (await import('node:fs/promises')).readFile(file, 'utf8')) as Array<{text:string;state:string;date:string}>;
    assert.equal(state.length, 8);
    assert.deepEqual(new Set(state.map(item => item.text)), new Set(Array.from({ length: 8 }, (_, i) => `worker-${i}`)));
    assert.ok(state.every(item => item.state === 'proposed' && /^\d{4}-\d{2}-\d{2}$/.test(item.date)));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('concurrent statistics survive restarts without content', async () => {
  const root = mkdtempSync(join(tmpdir(), 'local-stats-'));
  const env = { ...process.env, XDG_STATE_HOME: root };
  const script = `import {incrementStat} from ${JSON.stringify(modulePath)}; await incrementStat(process.argv[1], 'search');`;
  try {
    await Promise.all(Array.from({length: 12}, (_, i) => exec(process.execPath, ['--input-type=module', '-e', script, i % 2 ? 'pi' : 'claude'], {env})));
    const dir = join(root, 'flucastr-memory-ai');
    const file = join(dir, 'stats.json');
    const raw = await readFile(file, 'utf8');
    assert.deepEqual((JSON.parse(raw) as Array<{agent:string;tool:string;count:number}>).sort((a,b) => a.agent.localeCompare(b.agent)), [{agent:'claude',tool:'search',count:6},{agent:'pi',tool:'search',count:6}]);
    assert.equal(statSync(file).mode & 0o777, 0o600);
    assert.doesNotMatch(raw, /token|secret|content/i);
  } finally { rmSync(root, {recursive:true, force:true}); }
});

test('concurrent OS-lock writers preserve every proposal', async () => {
  const root = mkdtempSync(join(tmpdir(), 'local-proposals-reclaim-'));
  const xdg = join(root, 'state');
  const env = { ...process.env, XDG_STATE_HOME: xdg };
  const dir = join(xdg, 'flucastr-memory-ai');
  const script = `import { proposeMemories } from ${JSON.stringify(modulePath)}; await proposeMemories([{type:'learning',scope:'project:reclaim',text:process.argv[1]}]);`;
  try {
    const workers = 18;
    await Promise.all(Array.from({ length: workers }, (_, i) => exec(process.execPath, ['--input-type=module', '-e', script, `reclaimer-${i}`], { env })));
    const state = JSON.parse(await (await import('node:fs/promises')).readFile(join(dir, 'proposals.json'), 'utf8')) as Array<{text:string}>;
    assert.equal(state.length, workers, 'every concurrent writer must preserve its proposal');
    assert.deepEqual(new Set(state.map(item => item.text)), new Set(Array.from({ length: workers }, (_, i) => `reclaimer-${i}`)));
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('missing OS lock utility gives a clear CLI error without changing proposals', async () => {
  if (process.platform !== 'linux') return;
  const root = mkdtempSync(join(tmpdir(), 'local-proposals-no-flock-'));
  const xdg = join(root, 'state');
  const env = { ...process.env, XDG_STATE_HOME: xdg };
  const module = JSON.stringify(modulePath);
  try {
    const made = await exec(process.execPath, ['--input-type=module', '-e', `import { proposeMemories } from ${module}; console.log((await proposeMemories([{type:'learning',scope:'project:lock',text:'keep me'}]))[0].id);`], { env });
    const id = made.stdout.trim();
    const failed = await exec(process.execPath, [memPath, 'propose', '--type', 'learning', '--text', 'must fail', '--scope', 'project:lock'], { env: { ...env, PATH: '' } }).then(() => assert.fail('CLI should fail without flock'), error => error);
    assert.equal(failed.code, 1);
    assert.equal(failed.stderr.trim(), 'mem: estadísticas locales no disponibles; la operación continúa\nmem: el bloqueo local de propuestas no está disponible; no se modificaron las propuestas');
    assert.doesNotMatch(failed.stderr, /servidor no disponible/);
    const listed = await exec(process.execPath, ['--input-type=module', '-e', `import { listProposals } from ${module}; console.log(JSON.stringify(await listProposals()));`], { env });
    assert.deepEqual(JSON.parse(listed.stdout).map((item: { id: string }) => item.id), [id]);
  } finally { rmSync(root, { recursive: true, force: true }); }
});

test('descriptor-mode worker retains its lock after helper exit and releases it on death', async () => {
  if (process.platform !== 'linux') return;
  const root = mkdtempSync(join(tmpdir(), 'proposal-fd-lock-'));
  const xdg = join(root, 'state');
  const bin = join(root, 'bin');
  mkdirSync(bin);
  // Linux flock on an inherited descriptor models BSD lockf's descriptor mode;
  // this is not a macOS compatibility test.
  const flock = (await exec('which', ['flock'])).stdout.trim();
  writeFileSync(join(bin, 'lockf'), `#!/bin/sh\nexec ${flock} -x 3\n`);
  chmodSync(join(bin, 'lockf'), 0o700);
  const env = { ...process.env, XDG_STATE_HOME: xdg, PATH: `${bin}:${process.env.PATH}` };
  let ready!: () => void;
  const request = new Promise<void>(resolve => { ready = resolve; });
  const server = createServer((req) => { req.resume(); req.on('end', ready); });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No server address');
  try {
    const script = `import { proposeMemories } from ${JSON.stringify(modulePath)}; console.log((await proposeMemories([{type:'learning',scope:'project:fd',text:'kept'}]))[0].id);`;
    const id = (await exec(process.execPath, ['--input-type=module', '-e', script], { env })).stdout.trim();
    const worker = spawn(process.execPath, [modulePath, '--proposal-worker-macos'], { env, stdio: ['pipe', 'pipe', 'pipe'] });
    worker.stdin.end(JSON.stringify({ op: 'confirm', id, url: `http://127.0.0.1:${address.port}`, token: 'test' }));
    await request;
    const contenderScript = `import { proposeMemories } from ${JSON.stringify(modulePath)}; console.log('WAITING'); await proposeMemories([{type:'learning',scope:'project:fd',text:'contender'}]); console.log('WROTE');`;
    const contender = spawn(process.execPath, ['--input-type=module', '-e', contenderScript], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    contender.stdout.setEncoding('utf8').on('data', chunk => { output += chunk; });
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('contender did not start')), 5000);
      contender.stdout.on('data', () => { if (output.includes('WAITING')) { clearTimeout(timer); resolve(); } });
    });
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.doesNotMatch(output, /WROTE/);
    const workerExit = new Promise<void>(resolve => worker.once('exit', () => resolve()));
    worker.kill('SIGKILL');
    await workerExit;
    const contenderExit = await new Promise<number | null>(resolve => contender.once('close', resolve));
    assert.equal(contenderExit, 0);
    assert.match(output, /WROTE/);
    const state = JSON.parse(await readFile(join(xdg, 'flucastr-memory-ai', 'proposals.json'), 'utf8')) as Array<{id:string;text:string}>;
    assert.ok(state.some(item => item.id === id));
    assert.ok(state.some(item => item.text === 'contender'));
    const missing = spawn(process.execPath, [modulePath, '--proposal-worker-macos'], { env: { ...env, PATH: '' }, stdio: ['pipe', 'pipe', 'pipe'] });
    let missingOutput = '';
    missing.stdout.setEncoding('utf8').on('data', chunk => { missingOutput += chunk; });
    missing.stdin.end(JSON.stringify({ op: 'remove', id }));
    assert.equal(await new Promise<number | null>(resolve => missing.once('close', resolve)), 0);
    assert.match(JSON.parse(missingOutput).error, /locking is unavailable.*lockf could not start/);
    assert.deepEqual(JSON.parse(await readFile(join(xdg, 'flucastr-memory-ai', 'proposals.json'), 'utf8')), state);
  } finally { server.closeAllConnections(); server.close(); rmSync(root, { recursive: true, force: true }); }
});

test('confirmation and discard serialize, and OS lock releases after owner process death', async () => {
  const root = mkdtempSync(join(tmpdir(), 'local-proposals-lock-'));
  const xdg = join(root, 'state');
  const env = { ...process.env, XDG_STATE_HOME: xdg };
  if (process.platform !== 'linux') return;
  let requestReady!: () => void;
  const requestReceived = new Promise<void>(resolve => { requestReady = resolve; });
  let requests = 0;
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      if (++requests === 2) { requestReady(); return; }
      setTimeout(() => { res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(JSON.parse(body).memory)); }, 180);
    });
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No server address');
  const url = `http://127.0.0.1:${address.port}`;
  const script = `import { proposeMemories, confirmProposal, removeProposal } from ${JSON.stringify(modulePath)}; const [mode,id] = process.argv.slice(1); if (mode === 'make') { const [p] = await proposeMemories([{type:'learning',scope:'project:race',text:'race'}]); console.log(p.id); } else if (mode === 'confirm') { await confirmProposal(id, {url:${JSON.stringify(url)},token:'test'}); } else { await new Promise(r => setTimeout(r, 35)); console.log(await removeProposal(id)); }`;
  try {
    const made = await exec(process.execPath, ['--input-type=module', '-e', script, 'make'], { env });
    const id = made.stdout.trim();
    const [confirmed, discarded] = await Promise.all([
      exec(process.execPath, ['--input-type=module', '-e', script, 'confirm', id], { env }),
      exec(process.execPath, ['--input-type=module', '-e', script, 'discard', id], { env }),
    ]);
    assert.equal(confirmed.stderr, '');
    assert.match(discarded.stdout.trim(), /^(true|false)$/);
    assert.equal(JSON.parse(await (await import('node:fs/promises')).readFile(join(xdg, 'flucastr-memory-ai', 'proposals.json'), 'utf8')).length, 0);

    const madeForDeath = await exec(process.execPath, ['--input-type=module', '-e', `import { proposeMemories } from ${JSON.stringify(modulePath)}; console.log((await proposeMemories([{type:'learning',scope:'project:death',text:'preserve after process death'}]))[0].id);`], { env });
    const proposalId = madeForDeath.stdout.trim();
    const dyingScript = `import { confirmProposal } from ${JSON.stringify(modulePath)}; await confirmProposal(${JSON.stringify(proposalId)}, {url:${JSON.stringify(url)},token:'test'});`;
    const dying = spawn(process.execPath, ['--input-type=module', '-e', dyingScript], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    dying.stdout.setEncoding('utf8').on('data', chunk => { output += chunk; });
    await requestReceived;
    const children = (await readFile(`/proc/${dying.pid}/task/${dying.pid}/children`, 'utf8')).trim().split(/\s+/).map(Number);
    assert.equal(children.length, 1);
    const holderPid = children[0]!;
    assert.match(await readFile(`/proc/${holderPid}/cmdline`, 'utf8'), /--proposal-worker/);
    const contenderScript = `import { proposeMemories } from ${JSON.stringify(modulePath)}; console.log('WAITING'); const [p] = await proposeMemories([{type:'learning',scope:'project:death',text:'writer after owner death'}]); console.log('WROTE:'+p.id);`;
    const contender = spawn(process.execPath, ['--input-type=module', '-e', contenderScript], { env, stdio: ['ignore', 'pipe', 'pipe'] });
    let contenderOutput = '';
    contender.stdout.setEncoding('utf8').on('data', chunk => { contenderOutput += chunk; });
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('contender did not start')), 5000);
      const check = () => { if (contenderOutput.includes('WAITING')) { clearTimeout(timer); resolve(); } };
      contender.stdout.on('data', check);
      contender.once('error', error => { clearTimeout(timer); reject(error); });
      check();
    });
    await new Promise(resolve => setTimeout(resolve, 150));
    assert.doesNotMatch(contenderOutput, /WROTE:/, 'a second process must not write while the original owner holds the lock');
    const dyingExit = new Promise<void>(resolve => dying.once('exit', () => resolve()));
    process.kill(holderPid, 'SIGKILL');
    await dyingExit;
    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('contender did not continue after owner death')), 5000);
      const check = () => { if (contenderOutput.includes('WROTE:')) { clearTimeout(timer); resolve(); } };
      contender.stdout.on('data', check);
      contender.once('error', error => { clearTimeout(timer); reject(error); });
      check();
    });
    await new Promise<void>(resolve => contender.once('exit', () => resolve()));
    const remaining = await exec(process.execPath, ['--input-type=module', '-e', `import { listProposals } from ${JSON.stringify(modulePath)}; console.log(JSON.stringify(await listProposals()));`], { env });
    const afterDeath = JSON.parse(remaining.stdout) as Array<{ id: string; text: string }>;
    assert.ok(afterDeath.some(item => item.id === proposalId), 'owner death must not lose the unconfirmed proposal');
    assert.ok(afterDeath.some(item => item.text === 'writer after owner death'), 'the waiting writer must commit only after the dead owner releases the lock');
    const removed = await exec(process.execPath, ['--input-type=module', '-e', `import { removeProposal } from ${JSON.stringify(modulePath)}; console.log(await removeProposal(${JSON.stringify(proposalId)}));`], { env });
    assert.equal(removed.stdout.trim(), 'true');
  } finally { server.closeAllConnections(); server.close(); rmSync(root, { recursive: true, force: true }); }
});
