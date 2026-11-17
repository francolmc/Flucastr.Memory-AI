import type { IncomingMessage, ServerResponse } from 'node:http';

export async function readLimitedBody(req: IncomingMessage, res: ServerResponse, maxBodyBytes: number): Promise<Buffer | undefined> {
  const chunks: Buffer[] = [];
  let bodyBytes = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    bodyBytes += bytes.byteLength;
    if (bodyBytes > maxBodyBytes) {
      req.pause(); res.shouldKeepAlive = false;
      res.writeHead(413, { 'content-type': 'application/json; charset=utf-8', 'content-length': Buffer.byteLength('{"error":"payload_too_large"}\n'), connection: 'close' });
      res.once('finish', () => req.destroy());
      res.end('{"error":"payload_too_large"}\n');
      return undefined;
    }
    chunks.push(bytes);
  }
  return Buffer.concat(chunks, bodyBytes);
}
