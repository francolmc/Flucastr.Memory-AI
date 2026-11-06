#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { probeSqlite, openMemory, serializeSearch } from './index.js';
import { startServe } from './serve.js';

const help = `Flucastr Memory AI local CLI

Usage:
  flucastr-memory-ai [--help]
  flucastr-memory-ai doctor
  flucastr-memory-ai serve [--port N]
  flucastr-memory-ai save --db PATH --input PATH [--confirm-general-rule]
  flucastr-memory-ai search --db PATH --scope SCOPE --query TEXT
  flucastr-memory-ai archive --db PATH --id ID --confirm-franco
  flucastr-memory-ai conflict --db PATH --ids ID1,ID2
  flucastr-memory-ai resolve-conflict --db PATH --ids ID1,ID2 --confirm-franco
`;

function options(args: string[]): Record<string, string | true> {
  const parsed: Record<string, string | true> = {};
  for (let i = 0; i < args.length; i++) {
    const key = args[i]!;
    if (!key.startsWith('--') || parsed[key.slice(2)] !== undefined) throw new Error('Invalid or duplicate option');
    if (key === '--confirm-general-rule' || key === '--confirm-franco') parsed[key.slice(2)] = true;
    else { const value = args[++i]; if (!value || value.startsWith('--')) throw new Error('Missing option value'); parsed[key.slice(2)] = value; }
  }
  return parsed;
}
function requireOptions(opts: Record<string, string | true>, required: string[], flags: string[] = []): void {
  if (required.some(key => typeof opts[key] !== 'string') || Object.keys(opts).some(key => !required.includes(key) && !flags.includes(key))) throw new Error('Invalid command options');
}
function safeError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Operation failed';
  return message.replace(/[\r\n\t]/g, ' ').slice(0, 300);
}
export function runCli(args: string[]): number {
  if (args.length === 0 || (args.length === 1 && args[0] === '--help')) { process.stdout.write(help); return 0; }
  if (args.length === 1 && args[0] === 'doctor') {
    try { process.stdout.write(`${JSON.stringify(probeSqlite())}\n`); return 0; }
    catch (error) { process.stderr.write(`Diagnostic failed: ${safeError(error)}\n`); return 1; }
  }
  const command = args[0];
  if (!['save', 'search', 'archive', 'conflict', 'resolve-conflict'].includes(command ?? '')) {
    process.stderr.write(`Unknown command.\n\n${help}`); return 2;
  }
  try {
    const opts = options(args.slice(1));
    let required: string[]; let flags: string[] = [];
    if (command === 'save') { required = ['db', 'input']; flags = ['confirm-general-rule']; }
    else if (command === 'search') required = ['db', 'scope', 'query'];
    else if (command === 'archive') { required = ['db', 'id']; flags = ['confirm-franco']; }
    else if (command === 'conflict') required = ['db', 'ids'];
    else { required = ['db', 'ids']; flags = ['confirm-franco']; }
    requireOptions(opts, required, flags);
    if ((command === 'archive' || command === 'resolve-conflict') && opts['confirm-franco'] !== true) throw new Error('This operation requires --confirm-franco');
    const db = opts.db as string;
    const store = openMemory(db);
    try {
      if (command === 'save') {
        const data = JSON.parse(readFileSync(opts.input as string, 'utf8')) as unknown;
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Input must be an object');
        const input = data as Record<string, unknown>;
        const replacesId = input.replacesId;
        delete input.replacesId;
        if (replacesId !== undefined && typeof replacesId !== 'string') throw new Error('replacesId must be a string');
        const result = store.save(input as never, { confirmGeneralRule: opts['confirm-general-rule'] === true, ...(replacesId === undefined ? {} : { replacesId }) });
        process.stdout.write(`${JSON.stringify({ id: result.id, status: 'saved' })}\n`);
      } else if (command === 'search') {
        process.stdout.write(serializeSearch(store.search({ scope: opts.scope as string, query: opts.query as string })));
      } else if (command === 'archive') {
        store.archive(opts.id as string, { confirmedByFranco: true }); process.stdout.write(`${JSON.stringify({ id: opts.id, status: 'archived' })}\n`);
      } else {
        const ids = (opts.ids as string).split(',');
        if (command === 'conflict') { store.markConflict(ids); process.stdout.write(`${JSON.stringify({ ids, status: 'conflict' })}\n`); }
        else { store.resolveConflict(ids, { confirmedByFranco: true }); process.stdout.write(`${JSON.stringify({ ids, status: 'resolved' })}\n`); }
      }
      return 0;
    } finally { store.close(); }
  } catch (error) { process.stderr.write(`Operation failed: ${safeError(error)}\n`); return 1; }
}

if (process.argv[2] === 'serve') {
  const serveArgs = process.argv.slice(3);
  if (serveArgs.length === 2 && serveArgs[0] === '--port' && (!/^\d+$/.test(serveArgs[1]!) || Number(serveArgs[1]) < 1 || Number(serveArgs[1]) > 65535)) { process.stderr.write('Unable to start server.\n'); process.exitCode = 1; }
  else void startServe(serveArgs).then(handle => {
    const stop = (): void => { void handle.close().then(() => { process.exitCode = 0; }); };
    process.once('SIGINT', stop); process.once('SIGTERM', stop);
  }).catch(() => { process.stderr.write('Unable to start server.\n'); process.exitCode = 1; });
} else process.exitCode = runCli(process.argv.slice(2));
