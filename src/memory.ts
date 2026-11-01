import { DatabaseSync } from 'node:sqlite';

export interface MemoryInput {
  id: string;
  type: 'decision' | 'learning' | 'resolved-blocker' | 'rule';
  scope: string;
  text: string;
  origin: string;
  date: string;
}

export interface SaveOptions {
  confirmGeneralRule?: boolean;
}

export interface MemoryStore {
  save(input: MemoryInput, options?: SaveOptions): MemoryInput;
  close(): void;
}

const fields = ['id', 'type', 'scope', 'text', 'origin', 'date'] as const;
const validTypes = new Set(['decision', 'learning', 'resolved-blocker', 'rule']);

function validate(input: unknown, options: SaveOptions): asserts input is MemoryInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Memory must be an object');
  const value = input as Record<string, unknown>;
  if (Object.keys(value).length !== fields.length || fields.some((field) => !Object.hasOwn(value, field))) {
    throw new Error('Memory must contain exactly id, type, scope, text, origin, date');
  }
  for (const field of fields) if (typeof value[field] !== 'string') throw new Error(`${field} must be a string`);
  for (const field of ['id', 'text', 'origin'] as const) {
    if (!(value[field] as string).trim()) throw new Error(`${field} must contain a non-whitespace character`);
  }
  if (!validTypes.has(value.type as string)) throw new Error('Invalid memory type');
  const scope = value.scope as string;
  if (scope !== 'general' && (!scope.startsWith('project:') || !scope.slice(8) || scope.slice(8).trim() !== scope.slice(8))) {
    throw new Error('Invalid memory scope');
  }
  const date = value.date as string;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) throw new Error('date must be YYYY-MM-DD');
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > days[month - 1]!) throw new Error('Invalid civil date');
  if (value.type === 'rule' && scope === 'general' && options.confirmGeneralRule !== true) {
    throw new Error('Saving a general rule requires confirmGeneralRule: true');
  }
}

export function openMemory(path: string): MemoryStore {
  const database = new DatabaseSync(path);
  try {
    database.exec('PRAGMA user_version');
    const version = (database.prepare('PRAGMA user_version').get() as { user_version: number }).user_version;
    if (version !== 0 && version !== 1) throw new Error(`Unsupported memory schema version: ${version}`);
    if (version === 0) {
      database.exec(`BEGIN IMMEDIATE;
        CREATE TABLE memories (
          id TEXT PRIMARY KEY, type TEXT NOT NULL, scope TEXT NOT NULL,
          text TEXT NOT NULL, origin TEXT NOT NULL, date TEXT NOT NULL, canonical TEXT NOT NULL
        );
        PRAGMA user_version = 1;
        COMMIT;`);
    }
  } catch (error) {
    database.close();
    throw error;
  }
  return {
    save(input, options = {}) {
      validate(input, options);
      const canonical = JSON.stringify(fields.map((field) => input[field]));
      database.exec('BEGIN IMMEDIATE');
      try {
        const existing = database.prepare('SELECT canonical FROM memories WHERE id = ?').get(input.id) as { canonical: string } | undefined;
        if (existing) {
          if (existing.canonical !== canonical) throw new Error(`Memory ID collision: ${input.id}`);
          database.exec('COMMIT');
          return { ...input };
        }
        database.prepare('INSERT INTO memories (id, type, scope, text, origin, date, canonical) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(input.id, input.type, input.scope, input.text, input.origin, input.date, canonical);
        database.exec('COMMIT');
        return { ...input };
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
    close() { database.close(); },
  };
}
