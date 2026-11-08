import { request } from 'node:http';
import { readFileSync } from 'node:fs';

export interface ClientOptions { url: string; tokenPath: string }
export async function postF03(options: ClientOptions, route: '/v1/memories' | '/v1/search' | '/v1/recent' | '/v1/forget', payload: unknown): Promise<string> {
  const url = new URL(options.url);
  if (url.protocol !== 'http:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('Invalid origin');
  const token = readFileSync(options.tokenPath, 'utf8').trim();
  if (!/^[A-Za-z0-9._~-]{32,}$/.test(token)) throw new Error('Invalid token');
  const body = JSON.stringify(payload);
  return new Promise((resolve, reject) => {
    const req = request(new URL(route, url), { method: 'POST', timeout: 15_000, headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json', 'content-length': Buffer.byteLength(body) } }, res => {
      const chunks: Buffer[] = []; let size = 0;
      res.on('data', (chunk: Buffer) => { size += chunk.length; if (route === '/v1/search' && size > 4000) { req.destroy(); reject(new Error('Invalid response')); return; } chunks.push(Buffer.from(chunk)); });
      res.on('end', () => {
        if ((res.statusCode ?? 500) < 200 || (res.statusCode ?? 500) >= 300 || res.statusCode === 300 || res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 303 || res.statusCode === 307 || res.statusCode === 308) return reject(new Error('Request failed'));
        const text = Buffer.concat(chunks).toString('utf8');
        try {
          const parsed: unknown = JSON.parse(text);
          if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error();
          if (route === '/v1/search' || route === '/v1/recent') {
            const memories = (parsed as { memories?: unknown }).memories;
            if (!Array.isArray(memories) || (route === '/v1/search' && memories.length > 5) || !memories.every(validMemory)) throw new Error();
          } else if (route === '/v1/memories') {
            if (!validMemory(parsed)) throw new Error();
          } else if ((parsed as { ok?: unknown }).ok !== true || Object.keys(parsed).length !== 1) throw new Error();
          const normalized = text.endsWith('\n') ? text : `${text}\n`;
          if (route === '/v1/search' && Buffer.byteLength(normalized, 'utf8') > 4000) throw new Error();
          resolve(normalized);
        } catch { return reject(new Error('Invalid response')); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', () => reject(new Error('Request failed')));
    req.end(body);
  });
}
function validMemory(v: unknown): boolean {
  return !!v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 6 && ['id','type','scope','text','origin','date'].every(k => Object.hasOwn(v,k) && typeof (v as Record<string,unknown>)[k] === 'string');
}
