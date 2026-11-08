import { createServer, type Server } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { MemoryIdConflictError, validMemoryScope, validateMemoryInput, type AuthorizedMemoryStore } from './memory.js';
import type { HttpAuthenticator } from './http-auth.js';
import { serializeSearch } from './response.js';

export interface LocalServerOptions { store: AuthorizedMemoryStore; auth: HttpAuthenticator; port: number }
export interface LocalServer { address: AddressInfo; close(): Promise<void> }
const send = (res: ServerResponse, status: number, body: string): void => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(body) }); res.end(body); };
const error = (res: ServerResponse, status: number, code: string): void => send(res, status, `${JSON.stringify({ error: code })}\n`);
const closedObject = (v: unknown, keys: string[]): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === keys.length && keys.every(k => Object.hasOwn(v, k));
function jsonHeaders(req: IncomingMessage): boolean { const values = req.headers['content-type']; return typeof values === 'string' && /^application\/json(?:\s*;\s*charset=utf-8)?$/i.test(values); }
export async function startLocalServer(options: LocalServerOptions): Promise<LocalServer> {
  if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) throw new Error('Invalid local HTTP configuration');
  let server: Server;
  try { server = createServer({ requestTimeout: 15_000, headersTimeout: 10_000, keepAliveTimeout: 1_000 }, (req, res) => {
    void (async () => {
      // Authorize before examining method, path, content type, or payload.
      const rawAuth = req.rawHeaders.filter((_, i) => i % 2 === 0 && req.rawHeaders[i]!.toLowerCase() === 'authorization');
      if (rawAuth.length !== 1 || req.headers.cookie || (req.url ?? '').includes('?') || !req.headers.authorization || !options.auth.validate(new Headers({ authorization: req.headers.authorization }))) { req.resume(); error(res, 401, 'unauthorized'); return; }
      const routes = new Set(['/v1/search','/v1/memories','/v1/recent','/v1/forget']);
      if (!routes.has(req.url ?? '')) { req.resume(); error(res, 404, 'not_found'); return; }
      if (req.method !== 'POST') { req.resume(); error(res, 405, 'method_not_allowed'); return; }
      if (!jsonHeaders(req)) { req.resume(); error(res, 400, 'invalid_request'); return; }
      let body = ''; try { for await (const chunk of req) body += chunk.toString('utf8'); } catch { error(res, 400, 'invalid_request'); return; }
      let data: unknown; try { data = JSON.parse(body); } catch { error(res, 400, 'invalid_request'); return; }
      try {
        if (req.url === '/v1/search') {
          if (!closedObject(data, ['scope','query']) || typeof data.scope !== 'string' || !validMemoryScope(data.scope) || typeof data.query !== 'string') return error(res,400,'invalid_request');
          send(res,200,serializeSearch(options.store.search({ scope:data.scope, query:data.query }))); return;
        }
        if (req.url === '/v1/recent') {
          if (!data || typeof data !== 'object' || Array.isArray(data)) return error(res,400,'invalid_request');
          const value = data as Record<string, unknown>;
          if (Object.keys(value).some(k => !['scope','limit'].includes(k)) || typeof value.scope !== 'string' || !validMemoryScope(value.scope) || (value.limit !== undefined && (!Number.isInteger(value.limit) || (value.limit as number) < 1))) return error(res,400,'invalid_request');
          const rows = options.store.recent({ scope:value.scope, limit:(value.limit as number | undefined) ?? 15 });
          const memories = rows.map(({ id,type,scope,text,origin,date }) => ({ id,type,scope,text,origin,date }));
          send(res,200,`${JSON.stringify({memories})}\n`); return;
        }
        if (req.url === '/v1/forget') {
          if (!closedObject(data,['id']) || typeof data.id !== 'string' || !data.id.trim()) return error(res,400,'invalid_request');
          options.store.forget(data.id); send(res,200,'{"ok":true}\n'); return;
        }
        if (req.url === '/v1/memories') {
          if (!closedObject(data,['memory']) || !validateMemoryInput(data.memory)) return error(res,400,'invalid_request');
          const saved = options.store.save(data.memory); send(res,200,`${JSON.stringify(saved)}\n`); return;
        }
      } catch (cause) { error(res,cause instanceof MemoryIdConflictError ? 409 : 500,cause instanceof MemoryIdConflictError ? 'id_conflict' : 'internal_error'); }
    })();
  }); } catch { throw new Error('Unable to initialize local HTTP'); }
  const sockets = new Set<import('node:stream').Duplex>();
  server.on('connection', socket => { sockets.add(socket); socket.once('close', () => sockets.delete(socket)); });
  server.on('clientError', (_err, socket) => { socket.destroy(); });
  await new Promise<void>((resolve,reject) => { server.once('error',reject); server.listen(options.port,'127.0.0.1',resolve); });
  const address = server.address(); if (!address || typeof address === 'string') { server.close(); throw new Error('Unable to bind local HTTP'); }
  return { address, close: () => new Promise<void>((resolve,reject) => { server.close(err => err ? reject(err) : resolve()); for (const socket of sockets) socket.destroy(); }) };
}
