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
function transaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec('BEGIN IMMEDIATE'); try { const result = fn(); db.exec('COMMIT'); return result; } catch (error) { db.exec('ROLLBACK'); throw error; }
}
export function openMemory(path: string): MemoryStore {
  const db = new DatabaseSync(path);
  try {
    const version = (db.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;
    if (version !== 0 && version !== 1) throw new Error(`Unsupported memory schema version: ${version}`);
    if (!version) db.exec(`BEGIN IMMEDIATE; CREATE TABLE memories(id TEXT PRIMARY KEY,type TEXT NOT NULL,scope TEXT NOT NULL,text TEXT NOT NULL,origin TEXT NOT NULL,date TEXT NOT NULL,canonical TEXT NOT NULL,replaces_id TEXT,archived INTEGER NOT NULL DEFAULT 0,conflict INTEGER NOT NULL DEFAULT 0); PRAGMA user_version=1; COMMIT;`);
    else {
      const cols = db.prepare('PRAGMA table_info(memories)').all() as { name: string }[];
      if (!cols.some(c => c.name === 'archived')) db.exec('ALTER TABLE memories ADD COLUMN archived INTEGER NOT NULL DEFAULT 0');
      if (!cols.some(c => c.name === 'conflict')) db.exec('ALTER TABLE memories ADD COLUMN conflict INTEGER NOT NULL DEFAULT 0');
      if (!cols.some(c => c.name === 'replaces_id')) db.exec('ALTER TABLE memories ADD COLUMN replaces_id TEXT');
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
    save(input, options = {}) {
      validate(input, options);
      if (options.replacesId !== undefined && (options.replacesId === input.id)) throw new Error('A memory cannot replace itself');
      const canonical = JSON.stringify([...fields.map(f => input[f]), options.replacesId ?? null]);
      return transaction(db, () => {
        const existing = fetch(input.id);
        if (existing) { if (existing.canonical !== canonical) throw new Error(`Memory ID collision: ${input.id}`); return { ...input }; }
        if (options.replacesId) { const prior = fetch(options.replacesId); if (!prior) throw new Error(`Unknown replacement ID: ${options.replacesId}`); if (prior.scope !== input.scope) throw new Error('Replacement must have the same scope'); }
        db.prepare('INSERT INTO memories(id,type,scope,text,origin,date,canonical,replaces_id) VALUES(?,?,?,?,?,?,?,?)').run(input.id,input.type,input.scope,input.text,input.origin,input.date,canonical,options.replacesId ?? null);
        return { ...input };
      });
    },
    markConflict(ids) { transaction(db, () => { common(ids); db.prepare(`UPDATE memories SET conflict=1 WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids); }); },
    resolveConflict(ids, options) { if (options?.confirmedByFranco !== true) throw new Error('Resolution requires Franco confirmation'); transaction(db, () => { common(ids); db.prepare(`UPDATE memories SET conflict=0 WHERE id IN (${ids.map(() => '?').join(',')})`).run(...ids); }); },
    archive(id, options) { if (options?.confirmedByFranco !== true) throw new Error('Archiving requires Franco confirmation'); transaction(db, () => { exists(id); db.prepare('UPDATE memories SET archived=1 WHERE id=?').run(id); }); },
    list() { return (db.prepare('SELECT id,type,scope,text,origin,date,replaces_id,archived,conflict FROM memories').all() as Record<string, unknown>[]).map(r => ({ id:r.id as string,type:r.type as MemoryInput['type'],scope:r.scope as string,text:r.text as string,origin:r.origin as string,date:r.date as string,replacesId:r.replaces_id as string|null,archived:r.archived === 1,conflict:r.conflict === 1 })); },
    close() { db.close(); },
  };
}
