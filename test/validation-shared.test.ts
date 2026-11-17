import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { openMemory, validateMemoryInput, type MemoryInput } from '../src/memory.js';

const valid: MemoryInput = {
  id: 'valid', type: 'decision', scope: 'project:Example', text: 'A useful decision', origin: 'test', date: '2000-02-29',
};
const { date: _omittedDate, ...missingDate } = valid;

test('HTTP validation and storage validation agree while storage keeps precise errors', () => {
  const directory = mkdtempSync(join(tmpdir(), 'memory-validation-'));
  const store = openMemory(join(directory, 'memory.sqlite'));
  const invalidCases: Array<[string, unknown, string]> = [
    ['non-object', null, 'Memory must be an object'],
    ['missing field', missingDate, 'Memory must contain exactly id, type, scope, text, origin, date'],
    ['extra field', { ...valid, unexpected: true }, 'Memory must contain exactly id, type, scope, text, origin, date'],
    ['wrong field type', { ...valid, text: 42 }, 'text must be a string'],
    ['blank identifier', { ...valid, id: '  ' }, 'id must contain a non-whitespace character'],
    ['invalid type', { ...valid, type: 'other' }, 'Invalid memory type'],
    ['invalid scope', { ...valid, scope: 'project: Example' }, 'Invalid memory scope'],
    ['invalid date format', { ...valid, date: '2000/02/29' }, 'date must be YYYY-MM-DD'],
    ['invalid leap day', { ...valid, date: '1900-02-29' }, 'Invalid civil date'],
  ];

  try {
    assert.equal(validateMemoryInput(valid), true);
    assert.equal(store.save(valid).id, valid.id);
    for (const [label, input, error] of invalidCases) {
      assert.equal(validateMemoryInput(input), false, `${label}: HTTP validator`);
      assert.throws(() => store.save(input as MemoryInput), { message: error }, `${label}: storage validator`);
    }
    assert.equal(validateMemoryInput({ ...valid, date: '2000-02-29' }), true, 'leap year is accepted');
    assert.equal(validateMemoryInput({ ...valid, date: '1900-02-29' }), false, 'non-leap century is rejected');
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('general rules require explicit confirmation without changing validation results', () => {
  const directory = mkdtempSync(join(tmpdir(), 'memory-rule-validation-'));
  const store = openMemory(join(directory, 'memory.sqlite'));
  const rule: MemoryInput = { ...valid, id: 'general-rule', type: 'rule', scope: 'general' };
  try {
    assert.equal(validateMemoryInput(rule), true);
    assert.throws(() => store.save(rule), { message: 'Saving a general rule requires confirmGeneralRule: true' });
    assert.deepEqual(store.save(rule, { confirmGeneralRule: true }), rule);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
