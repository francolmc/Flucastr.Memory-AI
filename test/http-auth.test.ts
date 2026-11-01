import test from 'node:test';
import assert from 'node:assert/strict';
import { createHttpAuthenticator, createSyntheticKey, digestSyntheticKey } from '../src/http-auth.js';

const DAY = 86_400_000;
function fixture(time = 0, issued = 0) {
  let clock = time;
  const key = createSyntheticKey();
  const auth = createHttpAuthenticator({ state: { currentDigest: digestSyntheticKey(key), issuedAt: issued }, now: () => clock });
  const headers = (value: string) => new Headers({ authorization: value });
  return { key, auth, headers, set: (n: number) => { clock = n; } };
}

test('current credential expires exactly at 30 days; malformed schemes rejected without echoing input', () => {
  const f = fixture();
  assert.equal(f.auth.validate(f.headers(`Bearer ${f.key}`)), true);
  f.set(30 * DAY - 1); assert.equal(f.auth.validate(f.headers(`Bearer ${f.key}`)), true);
  f.set(30 * DAY); assert.equal(f.auth.validate(f.headers(`Bearer ${f.key}`)), false);
  for (const input of [`bearer ${f.key}`, `Basic ${f.key}`, `Bearer ${f.key} extra`, `${f.key}`, `Bearer ${f.key}, Bearer ${f.key}`]) assert.equal(f.auth.validate(f.headers(input)), false);
});

test('rotation remains available at the exact 30-day expiry and accepts old key through exact grace only', () => {
  const f = fixture(30 * DAY);
  const next = f.auth.rotate();
  assert.equal(f.auth.validate(f.headers(`Bearer ${next}`)), true);
  assert.equal(f.auth.validate(f.headers(`Bearer ${f.key}`)), true);
  f.set(31 * DAY - 1); assert.equal(f.auth.validate(f.headers(`Bearer ${f.key}`)), true);
  f.set(31 * DAY + 1); assert.equal(f.auth.validate(f.headers(`Bearer ${f.key}`)), false);
  assert.equal(f.auth.validate(f.headers(`Bearer ${next}`)), true);
});

test('revocation immediately invalidates both credentials; explicit installation restores identity', () => {
  const f = fixture(); const next = f.auth.rotate();
  f.auth.revoke();
  assert.equal(f.auth.validate(f.headers(`Bearer ${f.key}`)), false);
  assert.equal(f.auth.validate(f.headers(`Bearer ${next}`)), false);
  f.auth.install(createSyntheticKey());
  assert.equal(f.auth.validate(f.headers(`Bearer ${next}`)), false);
});

test('invalid state rejected; failed credential operations expose no submitted secret', () => {
  assert.throws(() => createHttpAuthenticator({ state: { currentDigest: new Uint8Array(3), issuedAt: 0 }, now: () => 0 }), /Invalid credential state/);
  const f = fixture();
  const submitted = `Bearer ${f.key}`;
  const error = (() => { try { f.auth.install('short'); } catch (e) { return String(e); } return ''; })();
  assert(!error.includes(f.key)); assert(!error.includes(submitted));
  assert.equal(f.auth.validate(new Headers({ authorization: submitted, cookie: f.key })), true);
});
