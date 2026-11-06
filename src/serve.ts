import { createHash, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { openAuthorizedMemory } from './memory.js';
import { startLocalServer } from './http-server.js';
import type { HttpAuthenticator } from './http-auth.js';

export async function startServe(args: string[], env: NodeJS.ProcessEnv = process.env, home = homedir()) {
  let port = 7420;
  if (args.length) {
    if (args.length !== 2 || args[0] !== '--port' || !/^\d+$/.test(args[1]!)) throw new Error('Unable to start server');
    port = Number(args[1]);
    if (!Number.isSafeInteger(port) || port < 0 || port > 65535) throw new Error('Unable to start server');
  }
  const db = env.MEM_DB ?? join(home, '.mem', 'mem.sqlite');
  let token: string;
  try {
    token = env.MEM_TOKEN !== undefined ? env.MEM_TOKEN : (await readFile(join(home, '.mem', 'token'), 'utf8')).replace(/\r?\n$/, '');
    if (!/^[A-Za-z0-9._~-]+$/.test(token)) throw new Error();
    await mkdir(dirname(db), { recursive: true });
  } catch { throw new Error('Unable to start server'); }
  const digest = createHash('sha256').update(token).digest();
  const auth: HttpAuthenticator = {
    validate(headers) {
      const value = headers.get('authorization');
      const match = value && /^Bearer ([A-Za-z0-9._~-]+)$/.exec(value);
      if (!match) return false;
      const candidate = createHash('sha256').update(match[1]!).digest();
      return timingSafeEqual(candidate, digest);
    },
    rotate() { throw new Error('Unavailable'); }, revoke() { throw new Error('Unavailable'); }, install() { throw new Error('Unavailable'); },
  };
  const store = openAuthorizedMemory(db);
  let server;
  try { server = await startLocalServer({ store, auth, port }); }
  catch { store.close(); throw new Error('Unable to start server'); }
  let closed = false;
  return { address: server.address, async close() { if (closed) return; closed = true; try { await server.close(); } finally { store.close(); } } };
}
