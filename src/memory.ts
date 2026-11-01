import { DatabaseSync } from 'node:sqlite';

export interface MemoryInput {
  id: string; type: 'decision' | 'learning' | 'resolved-blocker' | 'rule';
  scope: string; text: string; origin: string; date: string;
}
export interface SaveOptions { confirmGeneralRule?: boolean; replacesId?: string }
export interface StoredMemory extends MemoryInput { archived: boolean; conflict: boolean; replacesId: string | null }
export interface MemoryStore {
  save(input: MemoryInput, options?: SaveOptions): MemoryInput;
  markConflict(ids: string[]): void;
  resolveConflict(ids: string[], options: { confirmedByFranco: true }): void;
  archive(id: string, options: { confirmedByFranco: true }): void;
  list(): StoredMemory[];
  search(options: { scope: string; query: string }): StoredMemory[];
  close(): void;
  authorizedSave(input: MemoryInput, allowed: string[], previousId?: string): MemoryInput;
  authorizedConflict(ids: string[], allowed: string[]): void;
  authorizedSearch(options: { scope: string; query: string }, allowed: string[]): StoredMemory[];
}
export interface AuthorizedMemoryStore {
  save(input: MemoryInput): MemoryInput;
  replace(input: MemoryInput, previousId: string): MemoryInput;
  markConflict(ids: string[]): void;
  search(options: { scope: string; query: string }): StoredMemory[];
  close(): void;
}
const fields = ['id', 'type', 'scope', 'text', 'origin', 'date'] as const;
const validTypes = new Set(['decision', 'learning', 'resolved-blocker', 'rule']);
function validate(input: unknown, options: SaveOptions): asserts input is MemoryInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Memory must be an object');
  const value = input as Record<string, unknown>;
  if (Object.keys(value).length !== fields.length || fields.some((field) => !Object.hasOwn(value, field))) throw new Error('Memory must contain exactly id, type, scope, text, origin, date');
  for (const field of fields) if (typeof value[field] !== 'string') throw new Error(`${field} must be a string`);
  for (const field of ['id', 'text', 'origin'] as const) if (!(value[field] as string).trim()) throw new Error(`${field} must contain a non-whitespace character`);
  if (!validTypes.has(value.type as string)) throw new Error('Invalid memory type');
  const scope = value.scope as string;
  if (scope !== 'general' && (!scope.startsWith('project:') || !scope.slice(8) || scope.slice(8).trim() !== scope.slice(8))) throw new Error('Invalid memory scope');
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.date as string);
  if (!match) throw new Error('date must be YYYY-MM-DD');
  const [year, month, day] = match.slice(1).map(Number);
  const leap = year! % 4 === 0 && (year! % 100 !== 0 || year! % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year! < 1 || month! < 1 || month! > 12 || day! < 1 || day! > days[month! - 1]!) throw new Error('Invalid civil date');
  if (value.type === 'rule' && scope === 'general' && options.confirmGeneralRule !== true) throw new Error('Saving a general rule requires confirmGeneralRule: true');
}
export function openAuthorizedMemory(path: string): AuthorizedMemoryStore {
  const store = openMemory(path);
  const allowedScope = (scope: string) => scope === 'general' || scope === 'project:Atlas' || scope === 'project:Birch';
  const opaque = () => new Error('Memory is unavailable');
  return {
    save(input) {
      if (!allowedScope(input.scope) || input.type === 'rule' && input.scope === 'general') throw opaque();
      return store.authorizedSave(input, ['general', 'project:Atlas', 'project:Birch']);
    },
    replace(input, previousId) {
      if (!allowedScope(input.scope) || input.scope === 'general' || input.type === 'rule' || input.id === previousId) throw opaque();
      try { return store.authorizedSave(input, ['general', 'project:Atlas', 'project:Birch'], previousId); } catch { throw opaque(); }
    },
    markConflict(ids) {
      try {
        if (ids.length < 2 || new Set(ids).size !== ids.length) throw opaque();
        store.authorizedConflict(ids, ['general', 'project:Atlas', 'project:Birch']);
      } catch { throw opaque(); }
    },
    search({ scope, query }) {
      if (!allowedScope(scope)) throw opaque();
      try { return store.authorizedSearch({ scope, query }, ['general', 'project:Atlas', 'project:Birch']); } catch { throw opaque(); }
    },
    close() { store.close(); },
  };
}
function transaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE'); try { const result = fn(); db.exec('COMMIT'); return result; } catch (error) { db.exec('ROLLBACK'); throw error; }
}
export function openMemory(path: string): MemoryStore {
  const db = new DatabaseSync(path);
  try {
    const version = (db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;
    if (version !== 0 && version !== 1 && version !== 2) throw new Error(`Unsupported memory schema version: ${version}`);
    if (!version) db.exec(`BEGIN IMMEDIATE; CREATE TABLE memories(id TEXT PRIMARY KEY,type TEXT NOT NULL,scope TEXT NOT NULL,text TEXT NOT NULL,origin TEXT NOT NULL,date TEXT NOT NULL,canonical TEXT NOT NULL,replaces_id TEXT,archived INTEGER NOT NULL DEFAULT 0,conflict INTEGER NOT NULL DEFAULT 0); CREATE VIRTUAL TABLE memories_fts USING fts5(id UNINDEXED, text, tokenize='unicode61'); PRAGMA user_version=2; COMMIT;`);
    else {
      db.exec('BEGIN IMMEDIATE');
      try {
        const cols = db.prepare('PRAGMA table_info(memories)').all() as { name: string }[];
        if (!cols.some(c => c.name === 'archived')) db.exec('ALTER TABLE memories ADD COLUMN archived INTEGER NOT NULL DEFAULT 0');
        if (!cols.some(c => c.name === 'conflict')) db.exec('ALTER TABLE memories ADD COLUMN conflict INTEGER NOT NULL DEFAULT 0');
        if (!cols.some(c => c.name === 'replaces_id')) db.exec('ALTER TABLE memories ADD COLUMN replaces_id TEXT');
        db.exec('DROP TABLE IF EXISTS memories_fts; CREATE VIRTUAL TABLE memories_fts USING fts5(id UNINDEXED, text, tokenize=\'unicode61\'); INSERT INTO memories_fts(id,text) SELECT id,text FROM memories; PRAGMA user_version=2; COMMIT;');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    }
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
    authorizedSave(input, allowedScopes, previousId) {
      if (!allowedScopes.includes(input.scope) || previousId !== undefined && (!allowedScopes.includes(input.scope) || input.scope === 'general' || input.id === previousId)) throw new Error('Memory is unavailable');
      validate(input, { replacesId: previousId });
      const canonical = JSON.stringify([...fields.map(f => input[f]), previousId ?? null]);
      return transaction(db, () => {
        const existing = fetch(input.id);
        if (existing) { if (!allowedScopes.includes(existing.scope) || existing.canonical !== canonical) throw new Error('Memory is unavailable'); return { ...input }; }
        if (previousId !== undefined) { const prior = fetch(previousId); if (!prior || !allowedScopes.includes(prior.scope) || prior.scope !== input.scope) throw new Error('Memory is unavailable'); }
        db.prepare('INSERT INTO memories(id,type,scope,text,origin,date,canonical,replaces_id) VALUES(?,?,?,?,?,?,?,?)').run(input.id,input.type,input.scope,input.text,input.origin,input.date,canonical,previousId ?? null);
        db.prepare('INSERT INTO memories_fts(id,text) VALUES(?,?)').run(input.id,input.text);
        return { ...input };
      });
    },
    authorizedConflict(ids, allowedScopes) { transaction(db, () => {
      if (!Array.isArray(ids) || ids.length < 2 || new Set(ids).size !== ids.length) throw new Error('Memory is unavailable');
      const rows = ids.map(id => fetch(id));
      if (rows.some(row => !row || !allowedScopes.includes(row.scope))) throw new Error('Memory is unavailable');
      const projects = new Set(rows.map(row => row!.scope === 'general' ? 'general' : row!.scope));
      if (projects.size > 1 && [...projects].some(project => project !== 'general')) throw new Error('Memory is unavailable');
      db.prepare(`UPDATE memories SET conflict=1 WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids);
    }); },
    authorizedSearch({ scope, query }, allowedScopes) {
      if (!allowedScopes.includes(scope)) throw new Error('Memory is unavailable');
      const eligible = scope === 'general' ? ['general'] : [scope, 'general'];
      const related = db.prepare(`SELECT r.scope AS related_scope FROM memories m LEFT JOIN memories r ON r.id=m.replaces_id WHERE m.archived=0 AND m.scope IN (${eligible.map(() => '?').join(',')}) AND m.replaces_id IS NOT NULL`).all(...eligible) as { related_scope: string | null }[];
      if (related.some(row => !row.related_scope || !allowedScopes.includes(row.related_scope))) throw new Error('Memory is unavailable');
      return this.search({ scope, query });
    },
    save(input, options = {}) {
      validate(input, options);
      if (options.replacesId !== undefined && (options.replacesId === input.id)) throw new Error('A memory cannot replace itself');
      const canonical = JSON.stringify([...fields.map(f => input[f]), options.replacesId ?? null]);
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
      const terms = query.match(/[\p{L}\p{N}]+/gu) ?? [];
      if (!terms.length) return [];
      const match = terms.map(term => `"${term.replaceAll('"', '""')}"`).join(' AND ');
      const allowed = scope === 'general' ? ['general'] : [scope, 'general'];
      const placeholders = allowed.map(() => '?').join(',');
      db.exec('DROP TABLE IF EXISTS temp.search_fts; CREATE VIRTUAL TABLE temp.search_fts USING fts5(id UNINDEXED, text, tokenize=\'unicode61\')');
      db.prepare(`INSERT INTO temp.search_fts(id,text) SELECT id,text FROM memories WHERE archived=0 AND scope IN (${placeholders})`).run(...allowed);
      const rows = db.prepare(`SELECT m.id,m.type,m.scope,m.text,m.origin,m.date,m.replaces_id,m.archived,m.conflict FROM temp.search_fts AS f JOIN memories AS m ON m.id=f.id WHERE search_fts MATCH ? ORDER BY bm25(search_fts) ASC,m.id ASC LIMIT 5`).all(match) as Record<string, unknown>[];
      return rows.map(r => ({ id:r.id as string,type:r.type as MemoryInput['type'],scope:r.scope as string,text:r.text as string,origin:r.origin as string,date:r.date as string,replacesId:r.replaces_id as string|null,archived:r.archived === 1,conflict:r.conflict === 1 }));
    },
    close() { db.close(); },
  };
}
