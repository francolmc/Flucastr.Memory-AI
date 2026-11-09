import { loadRecentContext } from './recent-context.mjs';
import { renderMemoryPolicy } from './memory-policy.mjs';

export function createPiMemoryExtension({ scope, env = process.env } = {}) {
  return pi => {
    let pendingContext = '';
    let sessionCwd;
    pi.on('session_start', async (_event, context) => {
      sessionCwd = context.cwd;
      pendingContext = await loadRecentContext({ cwd: context.cwd, scope, env });
    });
    pi.on('before_agent_start', async event => {
      const content = pendingContext;
      pendingContext = '';
      const systemPrompt = [event.systemPrompt, renderMemoryPolicy({ cwd: sessionCwd, scope })].filter(Boolean).join('\n\n');
      return {
        systemPrompt,
        ...(content ? { message: { customType: 'flucastr-memory', content, display: false } } : {}),
      };
    });
  };
}

export default createPiMemoryExtension();
