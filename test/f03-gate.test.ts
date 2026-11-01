import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';

const suites = [
  'f03-gate.test.js',
  'http-auth.test.js',
  'http-server.test.js',
  'f03-durability.test.js',
  'f03-backup.test.js',
  'f03-recovery.test.js',
];

test('F03 gate wires every required local synthetic suite', () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> };
  const command = packageJson.scripts['gate:f03'];
  assert.ok(command, 'gate:f03 script exists');
  assert.match(command, /npm run build/);
  for (const suite of suites) {
    assert.ok(existsSync(`dist/test/${suite}`), `compiled suite exists: ${suite}`);
    assert.ok(command.includes(`dist/test/${suite}`), `gate runs suite: ${suite}`);
  }
  const verify = packageJson.scripts.verify ?? '';
  for (const script of ['typecheck', 'build', 'test', 'cli -- --help', 'doctor', 'gate:f02', 'gate:f03']) {
    assert.ok(verify.includes(script), `verify retains ${script}`);
  }
  console.log('F03 synthetic local only; no remote exposure, physical backup independence, guaranteed RTO, or shell isolation established.');
});
