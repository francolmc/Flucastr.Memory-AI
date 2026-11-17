import { DatabaseSync } from 'node:sqlite';
import { MEMORY_FIELDS, MemoryIdConflictError, validMemoryScope, validateMemoryInputForSave, type AuthorizedMemoryStore, type MemoryInput, type MemoryStore, type SaveOptions, type StoredMemory } from '../domain/memory.js';
import { prepareMemorySchema } from './schema.js';

export { MemoryIdConflictError, validMemoryScope, validateMemoryInput } from '../domain/memory.js';
export type { AuthorizedMemoryStore, MemoryInput, MemoryStore, SaveOptions, StoredMemory } from '../domain/memory.js';
export function openAuthorizedMemory(path: string): AuthorizedMemoryStore {
  const store = openMemory(path);
  const opaque = () => new Error('Memory is unavailable');
  return {
    save(input) {
      try { return store.save(input, { confirmGeneralRule: true }); } catch (error) {
        if (error instanceof Error && error.message.startsWith('Memory ID collision:')) throw new MemoryIdConflictError();
        throw opaque();
      }
    },
    replace(input, previousId) {
      if (!validMemoryScope(input.scope) || input.scope === 'general' || input.type === 'rule' || input.id === previousId) throw opaque();
      try { return store.save(input, { replacesId: previousId, confirmGeneralRule: true }); } catch { throw opaque(); }
    },
    markConflict(ids) {
      try {
        if (ids.length < 2 || new Set(ids).size !== ids.length) throw opaque();
        store.markConflict(ids);
      } catch { throw opaque(); }
    },
    search({ scope, query }) {
      if (!validMemoryScope(scope)) throw opaque();
      try { return store.search({ scope, query }); } catch { throw opaque(); }
    },
    recent({ scope, limit }) {
      if (!validMemoryScope(scope) || !Number.isInteger(limit) || limit < 1) throw opaque();
      try { return store.recent({ scope, limit }); } catch { throw opaque(); }
    },
    forget(id) { try { store.forget(id); } catch { throw opaque(); } },
    close() { store.close(); },
  };
}
function transaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE'); try { const result = fn(); db.exec('COMMIT'); return result; } catch (error) { db.exec('ROLLBACK'); throw error; }
}
export function openMemory(path: string): MemoryStore {
  const db = new DatabaseSync(path);
  try {
    prepareMemorySchema(db);
  } catch (error) { db.close(); throw error; }
  const fetch = (id: string) => db.prepare('SELECT * FROM memories WHERE id=?').get(id) as (Record<string, unknown> & { scope: string }) | undefined;
  const exists = (id: string) => { if (!fetch(id)) throw new Error(`Unknown memory ID: ${id}`); };
  const common = (ids: string[]) => {
    if (!Array.isArray(ids) || ids.length < 2 || new Set(ids).size !== ids.length) throw new Error('At least two distinct IDs are required');
    const rows = ids.map(id => { exists(id); return fetch(id)!; });
    const projects = new Set(rows.map(r => r.scope === 'general' ? 'general' : r.scope));
    if (projects.size > 1 && [...projects].some(p => p !== 'general')) throw new Error('Conflict operations cannot cross projects');
    return rows;
  };
  return {
    save(input, options = {}) {
      validateMemoryInputForSave(input, options);
      if (options.replacesId !== undefined && (options.replacesId === input.id)) throw new Error('A memory cannot replace itself');
      const canonical = JSON.stringify([...MEMORY_FIELDS.map(f => input[f]), options.replacesId ?? null]);
      return transaction(db, () => {
        const existing = fetch(input.id);
        if (existing) { if (existing.canonical !== canonical) throw new Error(`Memory ID collision: ${input.id}`); return { ...input }; }
        if (options.replacesId) { const prior = fetch(options.replacesId); if (!prior) throw new Error(`Unknown replacement ID: ${options.replacesId}`); if (prior.scope !== input.scope) throw new Error('Replacement must have the same scope'); }
        db.prepare('INSERT INTO memories(id,type,scope,text,origin,date,canonical,replaces_id) VALUES(?,?,?,?,?,?,?,?)').run(input.id,input.type,input.scope,input.text,input.origin,input.date,canonical,options.replacesId ?? null);
        db.prepare('INSERT INTO memories_fts(id,text) VALUES(?,?)').run(input.id,input.text);
        return { ...input };
      });
    },
    markConflict(ids) { transaction(db, () => { common(ids); db.prepare(`UPDATE memories SET conflict=1 WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids); }); },
    resolveConflict(ids, options) { if (options?.confirmedByFranco !== true) throw new Error('Resolution requires Franco confirmation'); transaction(db, () => { common(ids); db.prepare(`UPDATE memories SET conflict=0 WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids); }); },
    archive(id, options) { if (options?.confirmedByFranco !== true) throw new Error('Archiving requires Franco confirmation'); transaction(db, () => { exists(id); db.prepare('UPDATE memories SET archived=1 WHERE id=?').run(id); }); },
    list() { return (db.prepare('SELECT id,type,scope,text,origin,date,replaces_id,archived,conflict FROM memories').all() as Record<string, unknown>[]).map(r => ({ id:r.id as string,type:r.type as MemoryInput['type'],scope:r.scope as string,text:r.text as string,origin:r.origin as string,date:r.date as string,replacesId:r.replaces_id as string|null,archived:r.archived === 1,conflict:r.conflict === 1 })); },
    search({ scope, query }) {
      if (!validMemoryScope(scope)) throw new Error('Invalid memory scope');
      const terms = query.match(/[\p{L}\p{N}]+/gu) ?? [];
      if (!terms.length) return [];
      const match = terms.map(term => `"${term.replaceAll('"', '""')}"`).join(' OR ');
      const allowed = scope === 'general' ? ['general'] : [scope, 'general'];
      const placeholders = allowed.map(() => '?').join(',');
      const rows = db.prepare(`SELECT m.id,m.type,m.scope,m.text,m.origin,m.date,m.replaces_id,m.archived,m.conflict FROM memories_fts JOIN memories AS m ON m.id=memories_fts.id WHERE memories_fts MATCH ? AND m.archived=0 AND m.scope IN (${placeholders}) ORDER BY bm25(memories_fts) ASC,m.id ASC`).all(match,...allowed) as Record<string, unknown>[];
      return rows.map(r => ({ id:r.id as string,type:r.type as MemoryInput['type'],scope:r.scope as string,text:r.text as string,origin:r.origin as string,date:r.date as string,replacesId:r.replaces_id as string|null,archived:r.archived === 1,conflict:r.conflict === 1 }));
    },
    recent({ scope, limit }) {
      if (!validMemoryScope(scope) || !Number.isInteger(limit) || limit < 1) throw new Error('Invalid recent request');
      const allowed = scope === 'general' ? ['general'] : [scope, 'general'];
      const placeholders = allowed.map(() => '?').join(',');
      const rows = db.prepare(`SELECT id,type,scope,text,origin,date,replaces_id,archived,conflict FROM memories WHERE archived=0 AND scope IN (${placeholders}) ORDER BY date DESC,id ASC LIMIT ?`).all(...allowed, limit) as Record<string, unknown>[];
      return rows.map(r => ({ id:r.id as string,type:r.type as MemoryInput['type'],scope:r.scope as string,text:r.text as string,origin:r.origin as string,date:r.date as string,replacesId:r.replaces_id as string|null,archived:r.archived === 1,conflict:r.conflict === 1 }));
    },
    forget(id) { transaction(db, () => { db.prepare('DELETE FROM memories_fts WHERE id=?').run(id); db.prepare('DELETE FROM memories WHERE id=?').run(id); }); },
    close() { db.close(); },
  };
}
