import { DatabaseSync, backup } from 'node:sqlite';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export interface BackupStatus { latest: string | null; stale: boolean }
const MANIFEST = 'manifest.json';
const dateOf = (now: Date) => now.toISOString().slice(0, 10);
const monday = (day: string) => { const d = new Date(`${day}T00:00:00.000Z`); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
async function manifest(destination: string): Promise<string[]> {
  try {
    const parsed: unknown = JSON.parse(await fs.readFile(path.join(destination, MANIFEST), 'utf8'));
    if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { files?: unknown }).files) || !(parsed as { files: unknown[] }).files.every(x => typeof x === 'string' && /^daily-\d{4}-\d{2}-\d{2}\.sqlite$/.test(x))) throw new Error('Invalid backup manifest');
    return (parsed as { files: string[] }).files;
  } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return []; throw e; }
}
async function publishManifest(destination: string, files: string[]) {
  const temp = path.join(destination, `.manifest-${process.pid}-${Date.now()}.tmp`);
  await fs.writeFile(temp, JSON.stringify({ version: 1, files }), { flag: 'wx' });
  await fs.rename(temp, path.join(destination, MANIFEST));
}
export async function createSyntheticBackup({ source, destination, now = new Date() }: { source: string; destination: string; now?: Date }): Promise<BackupStatus> {
  const day = dateOf(now);
  await fs.mkdir(destination, { recursive: true });
  const files = await manifest(destination);
  const name = `daily-${day}.sqlite`, target = path.join(destination, name);
  try {
    await fs.access(target);
    return { latest: day, stale: false };
  } catch { /* create today's point */ }
  const partial = path.join(destination, `.backup-${process.pid}-${Date.now()}.tmp`);
  const db = new DatabaseSync(source);
  try {
    await backup(db, partial);
    const check = new DatabaseSync(partial, { readOnly: true });
    try {
      const result = check.prepare('PRAGMA integrity_check').get() as { integrity_check: string };
      if (result.integrity_check !== 'ok') throw new Error('Backup integrity check failed');
    } finally { check.close(); }
    await fs.rename(partial, target);
    const updated = [...new Set([...files, name])].sort();
    await publishManifest(destination, updated);
    return { latest: day, stale: false };
  } catch (error) {
    await fs.rm(partial, { force: true });
    throw error;
  } finally { db.close(); }
}
export async function retainSyntheticBackups({ destination, now = new Date() }: { destination: string; now?: Date }): Promise<string[]> {
  const files = await manifest(destination);
  const valid = files.filter(f => /^daily-\d{4}-\d{2}-\d{2}\.sqlite$/.test(f)).sort();
  const dates = valid.map(f => f.slice(6, 16));
  const daily = new Set(dates.slice(-7));
  const weekly = new Set<string>();
  const seenWeeks = new Set<string>();
  for (const d of [...dates].reverse()) { const week = monday(d); if (!seenWeeks.has(week) && weekly.size < 4) { weekly.add(d); seenWeeks.add(week); } }
  const keep = new Set(valid.filter(f => daily.has(f.slice(6, 16)) || weekly.has(f.slice(6, 16))));
  for (const file of valid) if (!keep.has(file)) await fs.rm(path.join(destination, file), { force: true });
  await publishManifest(destination, [...keep].sort());
  return [...keep].sort();
}
export async function syntheticBackupStatus({ destination, now = new Date() }: { destination: string; now?: Date }): Promise<BackupStatus> {
  const files = await manifest(destination);
  const latest = files.map(f => f.slice(6, 16)).sort().at(-1) ?? null;
  return { latest, stale: latest === null || now.getTime() - new Date(`${latest}T00:00:00.000Z`).getTime() > 24 * 60 * 60 * 1000 };
}
