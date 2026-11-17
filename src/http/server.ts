import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import type { AuthorizedMemoryStore } from '../memory.js';
import type { HttpAuthenticator } from './auth.js';
import { handleHttpRoute } from './routes.js';

export interface LocalServerOptions { store: AuthorizedMemoryStore; auth: HttpAuthenticator; port: number; maxBodyBytes?: number }
export interface LocalServer { address: AddressInfo; close(): Promise<void> }
const DEFAULT_MAX_BODY_BYTES = 65_536;
const sendUnauthorized = (res: import('node:http').ServerResponse): void => {
  const body = `${JSON.stringify({ error: 'unauthorized' })}\n`;
  res.writeHead(401, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength(body) });
  res.end(body);
};
export async function startLocalServer(options: LocalServerOptions): Promise<LocalServer> {
  if (!Number.isInteger(options.port) || options.port < 0 || options.port > 65535) throw new Error('Invalid local HTTP configuration');
  const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;
  if (!Number.isSafeInteger(maxBodyBytes) || maxBodyBytes <= 0) throw new Error('Invalid local HTTP configuration');
  let server: Server;
  try { server = createServer({ requestTimeout: 15_000, headersTimeout: 10_000, keepAliveTimeout: 1_000 }, (req, res) => {
    void (async () => {
      // Authorize before examining method, path, content type, or payload.
      const rawAuth = req.rawHeaders.filter((_, i) => i % 2 === 0 && req.rawHeaders[i]!.toLowerCase() === 'authorization');
      if (rawAuth.length !== 1 || req.headers.cookie || (req.url ?? '').includes('?') || !req.headers.authorization || !options.auth.validate(new Headers({ authorization: req.headers.authorization }))) { req.resume(); sendUnauthorized(res); return; }
      await handleHttpRoute(req, res, { store: options.store, maxBodyBytes });
    })();
  }); } catch { throw new Error('Unable to initialize local HTTP'); }
  const sockets = new Set<import('node:stream').Duplex>();
  server.on('connection', socket => { sockets.add(socket); socket.once('close', () => sockets.delete(socket)); });
  server.on('clientError', (_err, socket) => { socket.destroy(); });
  await new Promise<void>((resolve,reject) => { server.once('error',reject); server.listen(options.port,'127.0.0.1',resolve); });
  const address = server.address(); if (!address || typeof address === 'string') { server.close(); throw new Error('Unable to bind local HTTP'); }
  return { address, close: () => new Promise<void>((resolve,reject) => { server.close(err => err ? reject(err) : resolve()); for (const socket of sockets) socket.destroy(); }) };
}
