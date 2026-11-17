import type { IncomingMessage, ServerResponse } from 'node:http';
import { MemoryIdConflictError, validMemoryScope, validateMemoryInput, type AuthorizedMemoryStore } from '../memory.js';
import { readLimitedBody } from './body.js';
import { serializeSearch } from './response.js';

export interface HttpRouteDependencies {
  store: AuthorizedMemoryStore;
  maxBodyBytes: number;
}

const send = (res: ServerResponse, status: number, body: string): void => {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
  });
  res.end(body);
};

const error = (res: ServerResponse, status: number, code: string): void =>
  send(res, status, `${JSON.stringify({ error: code })}\n`);

const closedObject = (value: unknown, keys: string[]): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));

function jsonHeaders(req: IncomingMessage): boolean {
  const values = req.headers['content-type'];
  return typeof values === 'string' && /^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(values);
}

export async function handleHttpRoute(
  req: IncomingMessage,
  res: ServerResponse,
  { store, maxBodyBytes }: HttpRouteDependencies,
): Promise<void> {
  const routes = new Set(['/v1/search', '/v1/memories', '/v1/recent', '/v1/forget']);
  if (!routes.has(req.url ?? '')) { req.resume(); error(res, 404, 'not_found'); return; }
  if (req.method !== 'POST') { req.resume(); error(res, 405, 'method_not_allowed'); return; }
  if (!jsonHeaders(req)) { req.resume(); error(res, 400, 'invalid_request'); return; }

  let body: Buffer | undefined;
  try {
    body = await readLimitedBody(req, res, maxBodyBytes);
  } catch {
    error(res, 400, 'invalid_request');
    return;
  }
  if (!body) return;

  let data: unknown;
  try { data = JSON.parse(body.toString('utf8')); } catch { error(res, 400, 'invalid_request'); return; }

  try {
    if (req.url === '/v1/search') {
      if (!closedObject(data, ['scope', 'query']) || typeof data.scope !== 'string' || !validMemoryScope(data.scope) || typeof data.query !== 'string') return error(res, 400, 'invalid_request');
      send(res, 200, serializeSearch(store.search({ scope: data.scope, query: data.query })));
      return;
    }
    if (req.url === '/v1/recent') {
      if (!data || typeof data !== 'object' || Array.isArray(data)) return error(res, 400, 'invalid_request');
      const value = data as Record<string, unknown>;
      if (Object.keys(value).some(key => !['scope', 'limit'].includes(key)) || typeof value.scope !== 'string' || !validMemoryScope(value.scope) || (value.limit !== undefined && (!Number.isInteger(value.limit) || (value.limit as number) < 1))) return error(res, 400, 'invalid_request');
      const rows = store.recent({ scope: value.scope, limit: (value.limit as number | undefined) ?? 15 });
      const memories = rows.map(({ id, type, scope, text, origin, date }) => ({ id, type, scope, text, origin, date }));
      send(res, 200, `${JSON.stringify({ memories })}\n`);
      return;
    }
    if (req.url === '/v1/forget') {
      if (!closedObject(data, ['id']) || typeof data.id !== 'string' || !data.id.trim()) return error(res, 400, 'invalid_request');
      store.forget(data.id);
      send(res, 200, '{"ok":true}\n');
      return;
    }
    if (req.url === '/v1/memories') {
      if (!closedObject(data, ['memory']) || !validateMemoryInput(data.memory)) return error(res, 400, 'invalid_request');
      send(res, 200, `${JSON.stringify(store.save(data.memory))}\n`);
    }
  } catch (cause) {
    error(res, cause instanceof MemoryIdConflictError ? 409 : 500, cause instanceof MemoryIdConflictError ? 'id_conflict' : 'internal_error');
  }
}
