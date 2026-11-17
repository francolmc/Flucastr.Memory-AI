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
  recent(options: { scope: string; limit: number }): StoredMemory[];
  forget(id: string): void;
  close(): void;
}
export interface AuthorizedMemoryStore {
  save(input: MemoryInput): MemoryInput;
  replace(input: MemoryInput, previousId: string): MemoryInput;
  markConflict(ids: string[]): void;
  search(options: { scope: string; query: string }): StoredMemory[];
  recent(options: { scope: string; limit: number }): StoredMemory[];
  forget(id: string): void;
  close(): void;
}

export const MEMORY_FIELDS = ['id', 'type', 'scope', 'text', 'origin', 'date'] as const;
const validTypes = new Set(['decision', 'learning', 'resolved-blocker', 'rule']);

export function validMemoryScope(scope: string): boolean {
  return scope === 'general' || (scope.startsWith('project:') && !!scope.slice(8) && scope.slice(8).trim() === scope.slice(8));
}

export class MemoryIdConflictError extends Error {
  constructor() { super('Memory is unavailable'); }
}

function memoryInputError(input: unknown): string | undefined {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return 'Memory must be an object';
  const value = input as Record<string, unknown>;
  if (Object.keys(value).length !== MEMORY_FIELDS.length || MEMORY_FIELDS.some((field) => !Object.hasOwn(value, field))) return 'Memory must contain exactly id, type, scope, text, origin, date';
  for (const field of MEMORY_FIELDS) if (typeof value[field] !== 'string') return `${field} must be a string`;
  for (const field of ['id', 'text', 'origin'] as const) if (!(value[field] as string).trim()) return `${field} must contain a non-whitespace character`;
  if (!validTypes.has(value.type as string)) return 'Invalid memory type';
  if (!validMemoryScope(value.scope as string)) return 'Invalid memory scope';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.date as string);
  if (!match) return 'date must be YYYY-MM-DD';
  const [year, month, day] = match.slice(1).map(Number);
  const leap = year! % 4 === 0 && (year! % 100 !== 0 || year! % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  if (year! < 1 || month! < 1 || month! > 12 || day! < 1 || day! > days[month! - 1]!) return 'Invalid civil date';
  return undefined;
}

export function validateMemoryInput(input: unknown): input is MemoryInput {
  return memoryInputError(input) === undefined;
}

export function validateMemoryInputForSave(input: unknown, options: SaveOptions): asserts input is MemoryInput {
  const error = memoryInputError(input);
  if (error) throw new Error(error);
  const memory = input as MemoryInput;
  if (memory.type === 'rule' && memory.scope === 'general' && options.confirmGeneralRule !== true) throw new Error('Saving a general rule requires confirmGeneralRule: true');
}
