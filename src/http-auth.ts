import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

const DAY = 24 * 60 * 60 * 1000;
const MAX_AGE = 30 * DAY;
const MAX_GRACE = DAY;
const HASH_BYTES = 32;

export interface CredentialState {
  readonly currentDigest: Uint8Array;
  readonly issuedAt: number;
  readonly previous?: { readonly digest: Uint8Array; readonly rotatedAt: number; readonly graceUntil: number };
}
export interface AuthOptions { readonly state: CredentialState; readonly now?: () => number }
export interface HttpAuthenticator {
  validate(headers: Headers): boolean;
  rotate(): string;
  revoke(): void;
  install(key: string): void;
}

function digest(key: string): Buffer { return createHash('sha256').update(key, 'utf8').digest(); }
function validTime(value: number): boolean { return Number.isFinite(value) && value >= 0; }
function validKey(key: string): boolean { return typeof key === 'string' && Buffer.byteLength(key, 'utf8') >= 32; }

/** Creates an in-memory authenticator. Returned rotation keys are synthetic material; never persist/log them. */
export function createHttpAuthenticator(options: AuthOptions): HttpAuthenticator {
  const now = options.now ?? Date.now;
  const state: { currentDigest: Uint8Array; issuedAt: number; previous?: { digest: Uint8Array; rotatedAt: number; graceUntil: number } } = { currentDigest: Uint8Array.from(options.state.currentDigest), issuedAt: options.state.issuedAt, previous: options.state.previous ? { ...options.state.previous, digest: Uint8Array.from(options.state.previous.digest) } : undefined };
  let revoked = false;
  if (state.currentDigest.length !== HASH_BYTES || !validTime(state.issuedAt) || state.issuedAt > now()) throw new Error('Invalid credential state');
  if (state.previous && (state.previous.digest.length !== HASH_BYTES || !validTime(state.previous.rotatedAt) || !validTime(state.previous.graceUntil) || state.previous.rotatedAt > now() || state.previous.graceUntil < state.previous.rotatedAt || state.previous.graceUntil > state.previous.rotatedAt + MAX_GRACE)) throw new Error('Invalid credential state');
  const matches = (key: string, expected: Uint8Array): boolean => timingSafeEqual(digest(key), expected);
  return {
    validate(headers: Headers): boolean {
      if (revoked || !headers || typeof headers.get !== 'function') return false;
      const auth = headers.get('authorization');
      if (!auth || headers.getSetCookie?.().length) return false;
      // Headers combines duplicate Authorization values; reject anything other than one exact Bearer token.
      const match = /^Bearer ([A-Za-z0-9._~-]+)$/.exec(auth);
      if (!match || !validKey(match[1]!)) return false;
      const t = now();
      if (!validTime(t)) return false;
      if (t < state.issuedAt || t >= state.issuedAt + MAX_AGE) return false;
      if (matches(match[1]!, state.currentDigest)) return true;
      return !!state.previous && t <= state.previous.graceUntil && matches(match[1]!, state.previous.digest);
    },
    rotate(): string {
      const t = now();
      if (revoked || !validTime(t) || t < state.issuedAt) throw new Error('Credential rotation unavailable');
      const key = randomBytes(32).toString('base64url');
      state.previous = { digest: state.currentDigest, rotatedAt: t, graceUntil: Math.min(t + MAX_GRACE, t + MAX_GRACE) };
      state.currentDigest = digest(key); state.issuedAt = t;
      return key;
    },
    revoke(): void { revoked = true; state.currentDigest.fill(0); state.previous?.digest.fill(0); state.previous = undefined; },
    install(key: string): void {
      if (!validKey(key)) throw new Error('Invalid synthetic credential');
      const t = now();
      if (!validTime(t)) throw new Error('Invalid clock');
      state.currentDigest.fill(0); state.previous?.digest.fill(0);
      state.currentDigest = digest(key); state.issuedAt = t; state.previous = undefined; revoked = false;
    },
  };
}

export function createSyntheticKey(): string { return randomBytes(32).toString('base64url'); }
export function digestSyntheticKey(key: string): Uint8Array {
  if (!validKey(key)) throw new Error('Invalid synthetic credential');
  return digest(key);
}
