import { request } from 'node:http';
import { openAuthorizedMemory } from '../src/memory.js';
import { startLocalServer } from '../src/http-server.js';

const [dbPath, mode] = process.argv.slice(2);
if (!dbPath || !mode) throw new Error('Expected database path and mode');
const store = openAuthorizedMemory(dbPath);
const mem = (id: string, text: string) => ({ id, type: 'decision', scope: 'project:Atlas', text, origin: 'synthetic', date: '2026-02-03' });
try {
  const server = await startLocalServer({ store, auth: { validate: (h: Headers) => h.get('authorization') === 'Bearer synthetic-crash-key' } as never, port: 0 });
  if (mode === 'confirmed') {
    const port = server.address.port;
    const post = (path: string, body: unknown) => new Promise<{ status: number; body: string }>((resolve, reject) => {
      const req = request({ host: '127.0.0.1', port, path, method: 'POST', headers: { authorization: 'Bearer synthetic-crash-key', 'content-type': 'application/json' } }, res => {
        let body = ''; res.setEncoding('utf8'); res.on('data', chunk => body += chunk); res.on('end', () => resolve({ status: res.statusCode!, body }));
      });
      req.setTimeout(5000, () => req.destroy(new Error('request timeout'))); req.on('error', reject); req.end(JSON.stringify(body));
    });
    for (const id of ['crash-confirmed', 'crash-confirmed-2']) {
      const result = await post('/v1/memories', { memory: mem(id, id === 'crash-confirmed' ? 'durable needle' : 'second durable') });
      if (result.status !== 200) throw new Error(`unexpected save HTTP ${result.status}`);
    }
    const conflict = await post('/v1/conflicts', { ids: ['crash-confirmed', 'crash-confirmed-2'] });
    if (conflict.status !== 200) throw new Error(`unexpected conflict HTTP ${conflict.status}`);
    process.stdout.write(`CONFIRMED:${conflict.body}`);
  } else {
    // Exercise an uncommitted SQLite write, then halt before COMMIT.
    const { DatabaseSync } = await import('node:sqlite');
    const raw = new DatabaseSync(dbPath);
    raw.exec("BEGIN IMMEDIATE; INSERT INTO memories(id,type,scope,text,origin,date,canonical) VALUES('interrupted','decision','project:Atlas','partial needle','synthetic','2026-02-03','interrupted');");
    process.stdout.write('UNCOMMITTED\n');
  }
} catch (error) { console.error(error); process.exitCode = 1; }
