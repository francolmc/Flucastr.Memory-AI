import { randomUUID } from 'node:crypto';

const base = process.env.VERIFY_URL;
const token = process.env.MEM_TOKEN;
const timeout = Number(process.env.VERIFY_REQUEST_TIMEOUT_MS ?? 5000);
const max = 4000;
if (!base || !token) throw new Error('VERIFY_URL y MEM_TOKEN son obligatorios');

async function request(path, body, bearer = true) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(new URL(path, base), {
      method: 'POST', signal: controller.signal,
      headers: { 'content-type': 'application/json; charset=utf-8', ...(bearer ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > max || bytes.at(-1) !== 10) throw new Error('Respuesta fuera del contrato');
    let json;
    try { json = JSON.parse(bytes.toString('utf8')); } catch { throw new Error('Respuesta no JSON'); }
    return { status: response.status, json };
  } finally { clearTimeout(timer); }
}
function assert(ok, message) { if (!ok) throw new Error(message); }
async function emptyRead() {
  const result = await request('/v1/search', { scope: 'general', query: '' });
  assert(result.status === 200 && Array.isArray(result.json.memories) && result.json.memories.length === 0, 'Lectura vacía no válida');
}
async function main() {
  const unauthorized = await request('/v1/search', { scope: 'general', query: '' }, false);
  assert(unauthorized.status === 401 && unauthorized.json.error === 'unauthorized', 'La petición sin token no fue rechazada');
  await emptyRead();
  if (process.env.VERIFY_WRITE !== '1') {
    console.log('LECTURA OK');
    console.log('OMITIDO: escritura');
    console.log('VERIFY OK (solo lectura)');
    return;
  }
  const suffix = `verify-${process.pid}-${randomUUID()}`;
  const memory = {
    id: suffix, type: 'decision', scope: `project:${suffix}`,
    text: `Verificación aislada ${suffix}`, origin: 'verify-loopback',
    date: new Date().toISOString().slice(0, 10),
  };
  try {
    const save = async () => request('/v1/memories', { memory });
    const one = await save();
    assert(one.status === 200 && Object.keys(one.json).length === 6 && Object.entries(memory).every(([k, v]) => one.json[k] === v), 'Alta no devolvió los seis campos esperados');
    const two = await save();
    assert(two.status === 200 && Object.entries(memory).every(([k, v]) => two.json[k] === v), 'Alta idéntica no fue idempotente');
    const collision = await request('/v1/memories', { memory: { ...memory, text: `${memory.text} distinto` } });
    assert(collision.status === 409 && collision.json.error === 'id_conflict', 'La colisión de ID no devolvió 409 id_conflict');
    const found = await request('/v1/search', { scope: memory.scope, query: suffix });
    assert(found.status === 200 && Array.isArray(found.json.memories) && found.json.memories.length === 1 && Object.keys(found.json.memories[0]).length === 6 && found.json.memories[0].id === memory.id && found.json.memories[0].text === memory.text, 'Búsqueda no encontró la memoria exacta de seis campos');
    const isolated = await request('/v1/search', { scope: `project:verify-isolated-${process.pid}`, query: suffix });
    assert(isolated.status === 200 && Array.isArray(isolated.json.memories) && !isolated.json.memories.some(m => m.id === memory.id), 'La memoria cruzó el aislamiento de scope');
    const recent = await request('/v1/recent', { scope: memory.scope });
    assert(recent.status === 200 && recent.json.memories.length === 1 && recent.json.memories[0].id === memory.id, 'Recent no encontró la memoria');
    const forgotten = await request('/v1/forget', { id: memory.id });
    assert(forgotten.status === 200 && forgotten.json.ok === true, 'Forget falló');
    const forgottenAgain = await request('/v1/forget', { id: memory.id });
    assert(forgottenAgain.status === 200 && forgottenAgain.json.ok === true, 'Forget repetido falló');
    assert((await request('/v1/search', { scope: memory.scope, query: suffix })).json.memories.length === 0, 'Forget dejó un resultado en FTS');
    assert((await save()).status === 200, 'No se pudo reutilizar el ID olvidado');
    const retired = await request('/v1/replacements', {});
    assert(retired.status === 404 && retired.json.error === 'not_found', 'Ruta retirada no respondió 404');
  } finally {
    const cleanup = await request('/v1/forget', { id: memory.id });
    assert(cleanup.status === 200 && cleanup.json.ok === true, 'No se pudo limpiar el registro de prueba');
    const afterCleanup = await request('/v1/search', { scope: memory.scope, query: suffix });
    assert(afterCleanup.status === 200 && !afterCleanup.json.memories.some(m => m.id === memory.id), 'La limpieza dejó el registro de prueba en SQLite/FTS');
  }
  console.log('LECTURA OK');
  console.log('ESCRITURA OK');
  console.log('LIMPIEZA DE REGISTRO OK');
  console.log('VERIFY OK');
}
main().catch(error => { console.error(`VERIFY FLUJO FAIL: ${error instanceof Error ? error.message : 'fallo desconocido'}`); process.exitCode = 1; });
