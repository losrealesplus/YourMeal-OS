import { createClient } from '@supabase/supabase-js';

const productionRef = 'nhirlpkuvonggctdzzad';
function prefix(environment) {
  if (!['production', 'staging'].includes(environment)) throw new Error('VERIFICATION_ENVIRONMENT_INVALID');
  return `EATCLEAN_${environment.toUpperCase()}_`;
}

/** Explicit configuration only: never load dotenv, generic credentials or Keychain. */
export function verificationConfig(environment, env = process.env) {
  const scope = prefix(environment);
  const ref = env[`${scope}PROJECT_REF`];
  if (!/^[a-z]{20}$/.test(ref ?? '')) throw new Error('VERIFICATION_PROJECT_REF_REQUIRED');
  if (environment === 'production' ? ref !== productionRef : ref === productionRef)
    throw new Error('VERIFICATION_PROJECT_FORBIDDEN');
  const url = env[`${scope}SUPABASE_URL`];
  if (url !== `https://${ref}.supabase.co`) throw new Error('VERIFICATION_PROJECT_URL_MISMATCH');
  const secretKey = env[`${scope}SUPABASE_SECRET_KEY`];
  if (!/^sb_secret_[A-Za-z0-9_-]+$/.test(secretKey ?? ''))
    throw new Error('VERIFICATION_MODERN_SECRET_REQUIRED');
  return { url, secretKey };
}

export function verificationPublishableKey(environment, env = process.env) {
  const key = env[`${prefix(environment)}SUPABASE_PUBLISHABLE_KEY`];
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key ?? ''))
    throw new Error('VERIFICATION_PUBLISHABLE_KEY_REQUIRED');
  return key;
}

export function createVerificationFetch(url, key, transport = globalThis.fetch) {
  return (input, init) => {
    let destination;
    try { destination = new URL(input instanceof Request ? input.url : input); }
    catch { throw new Error('VERIFICATION_REQUEST_DESTINATION_FORBIDDEN'); }
    if (destination.origin !== url || destination.username || destination.password)
      throw new Error('VERIFICATION_REQUEST_DESTINATION_FORBIDDEN');
    const headers = new Headers(input instanceof Request ? input.headers : undefined);
    new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
    if (headers.get('Authorization') === `Bearer ${key}`) headers.delete('Authorization');
    headers.set('apikey', key);
    return transport(input, { ...init, headers, redirect: 'error' });
  };
}

/** SDK checks the key against the explicit project; redirects cannot change the target. */
export function createVerificationClient(url, key, options = {}) {
  return createClient(url, key, {
    ...options,
    global: { ...options.global, fetch: createVerificationFetch(url, key) },
  });
}
