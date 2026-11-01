import { DatabaseSync } from 'node:sqlite';

export { openMemory, openAuthorizedMemory } from './memory.js';
export type { AuthorizedMemoryStore, MemoryInput, MemoryStore, SaveOptions, StoredMemory } from './memory.js';
export { serializeSearch } from './response.js';
export { createHttpAuthenticator, createSyntheticKey, digestSyntheticKey } from './http-auth.js';
export type { CredentialState, HttpAuthenticator, AuthOptions } from './http-auth.js';

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
