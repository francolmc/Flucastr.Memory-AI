import { DatabaseSync } from 'node:sqlite';

export function probeSqlite(): { sqliteVersion: string; fts5: true } {
  const database = new DatabaseSync(':memory:');
  try {
    const versionRow = database.prepare('SELECT sqlite_version() AS version').get() as
      | { version: string }
      | undefined;
    if (!versionRow?.version) {
      throw new Error('SQLite did not report a version');
    }
    database.exec('CREATE VIRTUAL TABLE temp.probe USING fts5(body)');
    return { sqliteVersion: versionRow.version, fts5: true };
  } finally {
    database.close();
  }
}
