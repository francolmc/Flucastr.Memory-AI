import type { DatabaseSync } from 'node:sqlite';

export function prepareMemorySchema(db: DatabaseSync): void {
  db.exec("PRAGMA journal_mode=DELETE; PRAGMA synchronous=FULL;");
  const durability = db.prepare('PRAGMA synchronous').get() as { synchronous: number };
  const journal = db.prepare('PRAGMA journal_mode').get() as { journal_mode: string };
  if (durability.synchronous !== 2 || journal.journal_mode.toLowerCase() !== 'delete') throw new Error('Unable to establish SQLite durability settings');
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
      if (version === 1) db.exec('DROP TABLE IF EXISTS memories_fts; CREATE VIRTUAL TABLE memories_fts USING fts5(id UNINDEXED, text, tokenize=\'unicode61\'); INSERT INTO memories_fts(id,text) SELECT id,text FROM memories;');
      db.exec('PRAGMA user_version=2; COMMIT;');
    } catch (error) { db.exec('ROLLBACK'); throw error; }
  }
}
