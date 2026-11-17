import { randomUUID } from 'node:crypto';
import { mkdir, open, readFile, rename, rm, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { MemoryInput } from './domain/memory.js';
import { fileURLToPath } from 'node:url';
import { postF03 } from './http-client.js';

export interface MemoryProposal {
  id: string;
  type: MemoryInput['type'];
  scope: string;
  text: string;
  date: string;
  state: 'proposed';
}

const types = new Set<MemoryInput['type']>(['decision', 'learning', 'resolved-blocker', 'rule']);
const baseDir = () => process.env.XDG_STATE_HOME ? join(process.env.XDG_STATE_HOME, 'flucastr-memory-ai') : join(homedir(), '.local', 'state', 'flucastr-memory-ai');
const proposalFile = () => join(baseDir(), 'proposals.json');
const lockFile = () => join(baseDir(), 'proposals.lock');
type Work = { op: 'propose'; items: MemoryProposal[] } | { op: 'list' } | { op: 'get'; id: string } | { op: 'remove'; id: string } | { op: 'confirm'; id: string; url: string; token: string } | { op: 'increment'; agent: string; tool: string } | { op: 'stats' };
export type StatRow = { agent: string; tool: string; count: number };
const statsFile = () => join(baseDir(), 'stats.json');
const statTools = new Set(['memory_search', 'memory_save', 'memory_recent', 'memory_context', 'memory_forget', 'memory_propose', 'search', 'context', 'propose']);
export async function incrementStat(agent: string | undefined, tool: string): Promise<void> {
  if (!statTools.has(tool)) throw new Error('Invalid statistics tool');
  const label = agent?.trim() || 'desconocido';
  if (!/^[a-zA-Z0-9_.-]{1,64}$/.test(label)) throw new Error('Invalid statistics agent label');
  await withLock({ op: 'increment', agent: label, tool });
}
export async function readStats(): Promise<StatRow[]> { return withLock({ op: 'stats' }); }

async function withLock<T>(work: Work): Promise<T> {
  if (process.platform !== 'linux' && process.platform !== 'darwin') throw new Error(`Local proposal locking is unavailable on ${process.platform}`);
  await ensureDir();
  let handle;
  try { handle = await open(lockFile(), 'a', 0o600); }
  catch (error) { throw new Error(`Local proposal store cannot create its lock file: ${(error as Error).message}`); }
  await handle.chmod(0o600);
  await handle.close();
  const linux = process.platform === 'linux';
  const utility = linux ? 'flock' : process.execPath;
  const args = linux
    ? ['--no-fork', '-x', lockFile(), process.execPath, fileURLToPath(import.meta.url), '--proposal-worker']
    : [fileURLToPath(import.meta.url), '--proposal-worker-macos'];
  const holder = spawn(utility, args, { stdio: ['pipe', 'pipe', 'pipe'] });
  return new Promise<T>((resolve, reject) => {
    let output = '', errors = '';
    const deadline = setTimeout(() => { holder.kill('SIGKILL'); }, 30000);
    holder.stdout.setEncoding('utf8').on('data', chunk => { output += chunk; });
    holder.stderr.setEncoding('utf8').on('data', chunk => { errors += chunk; });
    holder.stdin.on('error', () => {});
    holder.once('error', error => { clearTimeout(deadline); reject(new Error(`Local proposal locking is unavailable (worker could not start): ${error.message}`)); });
    holder.once('close', code => {
      clearTimeout(deadline);
      if (code !== 0) return reject(new Error(`Local proposal locking is unavailable (worker exited ${code ?? 'without a status'}${errors ? `: ${errors.trim()}` : ''})`));
      try {
        const response = JSON.parse(output) as { ok: boolean; result: T; error?: string };
        if (!response.ok) return reject(new Error(response.error ?? 'Local proposal operation failed'));
        resolve(response.result);
      } catch { reject(new Error('Local proposal worker returned an invalid response')); }
    });
    holder.stdin.end(JSON.stringify(work));
  });
}

function validScope(scope: unknown): scope is string {
  return typeof scope === 'string' && scope.trim() === scope && (scope === 'general' || (scope.startsWith('project:') && !!scope.slice(8).trim()));
}
function validate(value: unknown): MemoryProposal {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid local proposal state');
  const p = value as Record<string, unknown>;
  if (typeof p.id !== 'string' || !p.id || !types.has(p.type as MemoryProposal['type']) || !validScope(p.scope) || typeof p.text !== 'string' || !p.text.trim() || p.text.trim() !== p.text || Buffer.byteLength(p.text, 'utf8') > 2000 || typeof p.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.date) || p.state !== 'proposed') throw new Error('Invalid local proposal');
  return { id: p.id, type: p.type as MemoryProposal['type'], scope: p.scope, text: p.text, date: p.date, state: 'proposed' };
}
async function ensureDir(): Promise<void> {
  await mkdir(baseDir(), { recursive: true, mode: 0o700 });
  await import('node:fs/promises').then(({ chmod }) => chmod(baseDir(), 0o700));
}
async function readAll(): Promise<MemoryProposal[]> {
  try {
    const info = await stat(proposalFile());
    if ((info.mode & 0o077) !== 0) await import('node:fs/promises').then(({ chmod }) => chmod(proposalFile(), 0o600));
    const parsed: unknown = JSON.parse(await readFile(proposalFile(), 'utf8'));
    if (!Array.isArray(parsed)) throw new Error('Invalid local proposal state');
    return parsed.map(validate);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw error;
  }
}
async function writeAll(items: MemoryProposal[]): Promise<void> {
  const path = proposalFile();
  const temp = join(baseDir(), `proposals.${process.pid}.${randomUUID()}.tmp`);
  const handle = await open(temp, 'wx', 0o600);
  try { await handle.writeFile(`${JSON.stringify(items)}\n`, 'utf8'); await handle.sync(); }
  finally { await handle.close(); }
  try { await rename(temp, path); }
  catch (error) { await rm(temp, { force: true }); throw error; }
}

export async function proposeMemories(inputs: Array<Pick<MemoryProposal, 'type' | 'scope' | 'text'>>): Promise<MemoryProposal[]> {
  if (!Array.isArray(inputs) || inputs.length < 1 || inputs.length > 3) throw new Error('At most three proposals are allowed per call');
  const date = new Date().toISOString().slice(0, 10);
  const clean = inputs.map(input => validate({ ...input, id: randomUUID(), date, state: 'proposed' }));
  return withLock({ op: 'propose', items: clean });
}
export async function listProposals(): Promise<MemoryProposal[]> {
  return withLock({ op: 'list' });
}
export async function getProposal(id: string): Promise<MemoryProposal | undefined> {
  return (await withLock<MemoryProposal | null>({ op: 'get', id })) ?? undefined;
}
export async function removeProposal(id: string): Promise<boolean> {
  return withLock({ op: 'remove', id });
}
export async function confirmProposal(id: string, http: { url: string; token: string }): Promise<unknown> {
  return withLock({ op: 'confirm', id, ...http });
}

async function executeWork(work: Work): Promise<unknown> {
  if (work.op === 'increment' || work.op === 'stats') {
    let rows: StatRow[];
    try {
      const parsed: unknown = JSON.parse(await readFile(statsFile(), 'utf8'));
      if (!Array.isArray(parsed) || !parsed.every(r => r && typeof r.agent === 'string' && /^[a-zA-Z0-9_.-]{1,64}$/.test(r.agent) && statTools.has(r.tool) && Number.isSafeInteger(r.count) && r.count > 0)) throw new Error('Invalid statistics state');
      rows = parsed;
      await import('node:fs/promises').then(({ chmod }) => chmod(statsFile(), 0o600));
    } catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') rows = []; else throw error; }
    if (work.op === 'stats') return rows;
    const row = rows.find(r => r.agent === work.agent && r.tool === work.tool);
    if (row) { if (!Number.isSafeInteger(row.count + 1)) throw new Error('Statistics overflow'); row.count++; }
    else rows.push({ agent: work.agent, tool: work.tool, count: 1 });
    const temp = join(baseDir(), `stats.${process.pid}.${randomUUID()}.tmp`);
    const handle = await open(temp, 'wx', 0o600);
    try { await handle.writeFile(`${JSON.stringify(rows)}\n`, 'utf8'); await handle.sync(); } finally { await handle.close(); }
    try { await rename(temp, statsFile()); } catch (error) { await rm(temp, { force: true }); throw error; }
    return null;
  }
  const proposals = await readAll();
  if (work.op === 'list') return proposals;
  if (work.op === 'get') return proposals.find(p => p.id === work.id) ?? null;
  if (work.op === 'propose') {
    const items = work.items.map(validate);
    await writeAll([...proposals, ...items]);
    return items;
  }
  const proposal = proposals.find(p => p.id === work.id);
  if (work.op === 'remove') {
    if (!proposal) return false;
    await writeAll(proposals.filter(p => p.id !== work.id));
    return true;
  }
  if (!proposal) throw new Error('Proposal not found');
  const memory = { id: proposal.id, type: proposal.type, scope: proposal.scope, text: proposal.text, origin: 'mem/confirm', date: proposal.date };
  const result = JSON.parse(await postF03({ url: work.url, token: work.token }, '/v1/memories', { memory }));
  await writeAll(proposals.filter(p => p.id !== work.id));
  return result;
}

// BSD lockf's descriptor mode locks the inherited open file description and exits
// without unlocking it. The worker retains that description throughout executeWork.
async function acquireMacLock(): Promise<import('node:fs/promises').FileHandle> {
  const handle = await open(lockFile(), 'a', 0o600);
  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn('lockf', ['-t', '25', '3'], { stdio: ['ignore', 'ignore', 'pipe', handle.fd] });
      let errors = '';
      child.stderr!.setEncoding('utf8').on('data', chunk => { errors += chunk; });
      child.once('error', error => reject(new Error(`Local proposal locking is unavailable (lockf could not start): ${error.message}`)));
      child.once('close', code => code === 0 ? resolve() : reject(new Error(`Local proposal locking is unavailable (lockf exited ${code}: ${errors.trim()})`)));
    });
    return handle;
  } catch (error) { await handle.close(); throw error; }
}

if (process.argv[1] === fileURLToPath(import.meta.url) && (process.argv[2] === '--proposal-worker' || process.argv[2] === '--proposal-worker-macos')) {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;
  let handle: import('node:fs/promises').FileHandle | undefined;
  try {
    if (process.argv[2] === '--proposal-worker-macos') handle = await acquireMacLock();
    process.stdout.write(JSON.stringify({ ok: true, result: await executeWork(JSON.parse(input) as Work) }));
  } catch (error) { process.stdout.write(JSON.stringify({ ok: false, error: (error as Error).message })); }
  finally { await handle?.close(); }
}
