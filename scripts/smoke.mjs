#!/usr/bin/env node
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { basename, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const timeoutMs = 5000;
const maxResponseBytes = 64 * 1024;
const tokenPattern = /^[A-Za-z0-9._~-]+$/;

function projectScope() {
  const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  const name = basename(root);
  if (!name || name.trim() !== name) throw new Error('invalid project scope');
  return `project:${name}`;
}

function configuration(env) {
  const token = env.MEM_TOKEN;
  const rawUrl = env.MEM_URL;
  if (typeof token !== 'string' || !tokenPattern.test(token)) throw new Error('MEM_TOKEN falta o no tiene un formato válido');
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) throw new Error('MEM_URL es obligatorio');
  let url;
  try { url = new URL(rawUrl); } catch { throw new Error('MEM_URL no es una URL válida'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('MEM_URL debe ser el origen HTTP(S) del servidor, sin ruta ni credenciales');
  }
  const scope = env.MEM_SCOPE === undefined ? projectScope() : env.MEM_SCOPE;
  if (typeof scope !== 'string' || !(scope === 'general' || (scope.startsWith('project:') && scope.length > 8 && scope.trim() === scope))) {
    throw new Error('MEM_SCOPE debe ser general o project:<nombre>');
  }
  return { token, base: url.origin, scope };
}

async function request(base, token, path, body) {
  let response;
  try {
    response = await fetch(new URL(path, base), {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch {
    throw new Error('no se pudo contactar el servidor (timeout o conexión fallida)');
  }
  let bytes;
  try { bytes = Buffer.from(await response.arrayBuffer()); } catch { throw new Error('respuesta del servidor inválida'); }
  if (bytes.length > maxResponseBytes) throw new Error('respuesta del servidor fuera de límite');
  let json;
  try { json = JSON.parse(bytes.toString('utf8')); } catch { throw new Error('respuesta del servidor inválida'); }
  if (!response.ok) {
    if (response.status === 401) throw new Error('autenticación rechazada; revisa MEM_TOKEN');
    throw new Error(`el servidor rechazó la operación (HTTP ${response.status})`);
  }
  return json;
}

export async function runSmoke(env = process.env, out = console.log, err = console.error) {
  let config;
  try { config = configuration(env); }
  catch (error) { err(`mem smoke: ${error.message}`); return 1; }

  const suffix = randomUUID();
  const marker = `mem-smoke-${suffix}`;
  const memory = {
    id: `smoke-${suffix}`,
    type: 'learning',
    scope: config.scope,
    text: `Registro sintético temporal ${marker}`,
    origin: 'mem-smoke',
    date: new Date().toISOString().slice(0, 10),
  };
  let failure;
  try {
    const saved = await request(config.base, config.token, '/v1/memories', { memory });
    if (saved.id !== memory.id || saved.scope !== memory.scope || saved.text !== memory.text) throw new Error('el servidor no confirmó el registro de prueba');
    const found = await request(config.base, config.token, '/v1/search', { scope: config.scope, query: marker });
    if (!Array.isArray(found.memories) || !found.memories.some(item => item?.id === memory.id && item.scope === memory.scope)) {
      throw new Error('la búsqueda no encontró el registro de prueba');
    }
  } catch (error) { failure = error instanceof Error ? error.message : 'fallo desconocido'; }

  // The generated ID is unique. Attempt forget even when save/search failed, then verify absence.
  try {
    const forgotten = await request(config.base, config.token, '/v1/forget', { id: memory.id });
    if (forgotten.ok !== true) throw new Error('el servidor no confirmó la eliminación');
    const after = await request(config.base, config.token, '/v1/search', { scope: config.scope, query: marker });
    if (!Array.isArray(after.memories) || after.memories.some(item => item?.id === memory.id)) throw new Error('el registro de prueba sigue visible');
  } catch (error) {
    err(`mem smoke: falló la limpieza; el registro sintético puede permanecer (${error instanceof Error ? error.message : 'fallo desconocido'})`);
    return 1;
  }

  if (failure) { err(`mem smoke: ${failure}`); return 1; }
  out('mem smoke: guardó, encontró y eliminó el registro sintético.');
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runSmoke().then(code => { process.exitCode = code; }).catch(() => {
    console.error('mem smoke: falló la prueba por un error inesperado.');
    process.exitCode = 1;
  });
}
