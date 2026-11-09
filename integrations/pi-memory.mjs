import { loadRecentContext } from './recent-context.mjs';

export function createPiMemoryExtension({ scope, env = process.env } = {}) {
  return pi => {
    let pendingContext = '';
    pi.on('session_start', async (_event, context) => {
      pendingContext = await loadRecentContext({ cwd: context.cwd, scope, env });
    });
    pi.on('before_agent_start', async () => {
      const content = pendingContext;
      pendingContext = '';
      if (!content) return;
      return { message: { customType: 'flucastr-memory', content, display: false } };
    });
  };
}

export default createPiMemoryExtension();
