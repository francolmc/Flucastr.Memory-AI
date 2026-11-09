#!/usr/bin/env node
import { loadRecentContext } from './recent-context.mjs';

async function main() {
  try {
    let raw = '';
    for await (const chunk of process.stdin.setEncoding('utf8')) raw += chunk;
    const input = JSON.parse(raw);
    const args = process.argv.slice(2);
    let scope;
    if (args.length) {
      if (args.length !== 2 || args[0] !== '--scope' || !args[1]) return;
      scope = args[1];
    }
    const context = await loadRecentContext({ cwd: input?.cwd, scope });
    if (!context) return;
    process.stdout.write(`${JSON.stringify({
      hookSpecificOutput: { hookEventName: 'SessionStart', additionalContext: context },
    })}\n`);
  } catch {
    // Startup hooks are best-effort and must not interrupt the agent.
  }
}

await main();
