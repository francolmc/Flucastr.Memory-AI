import { spawn } from 'node:child_process';

const timeoutMs = 2_000;

export async function loadRecentContext({ cwd, scope, env = process.env } = {}) {
  if (typeof cwd !== 'string' || !cwd || (scope !== undefined && (typeof scope !== 'string' || !scope))) return '';
  const args = ['context'];
  if (scope !== undefined) args.push('--scope', scope);
  try {
    const stdout = await new Promise((resolve, reject) => {
      const child = spawn('mem', args, { cwd, env, stdio: ['ignore', 'pipe', 'ignore'], windowsHide: true });
      const chunks = [];
      let timedOut = false;
      const timer = setTimeout(() => { timedOut = true; child.kill('SIGKILL'); }, timeoutMs);
      child.stdout.on('data', chunk => chunks.push(chunk));
      child.once('error', error => { clearTimeout(timer); reject(error); });
      child.once('close', code => {
        clearTimeout(timer);
        if (code === 0 && !timedOut) resolve(Buffer.concat(chunks).toString('utf8'));
        else reject(new Error('mem context failed'));
      });
    });
    const result = JSON.parse(stdout);
    if (!result || typeof result !== 'object' || Array.isArray(result) || typeof result.warning !== 'string' || !Array.isArray(result.memories)) return '';
    if (!result.memories.every(isMemory) || Buffer.byteLength(stdout, 'utf8') > 4000) return '';
    if (!result.memories.length) return '';
    return stdout;
  } catch {
    return '';
  }
}

function isMemory(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
    && Object.keys(value).length === 6
    && ['id', 'type', 'scope', 'text', 'origin', 'date'].every(key => typeof value[key] === 'string');
}
