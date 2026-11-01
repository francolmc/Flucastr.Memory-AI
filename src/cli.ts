#!/usr/bin/env node
import { probeSqlite } from './index.js';

const help = `Flucastr Memory AI diagnostic CLI

Usage:
  flucastr-memory-ai [--help]
  flucastr-memory-ai doctor

Commands:
  --help  Show this help
  doctor  Check SQLite and FTS5 availability
`;

export function runCli(args: string[]): number {
  if (args.length === 0 || (args.length === 1 && args[0] === '--help')) {
    process.stdout.write(help);
    return 0;
  }
  if (args.length === 1 && args[0] === 'doctor') {
    try {
      process.stdout.write(`${JSON.stringify(probeSqlite())}\n`);
      return 0;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown diagnostic failure';
      process.stderr.write(`Diagnostic failed: ${message}\n`);
      return 1;
    }
  }
  process.stderr.write(`Unknown command.\n\n${help}`);
  return 2;
}

process.exitCode = runCli(process.argv.slice(2));
