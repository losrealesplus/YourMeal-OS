import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verificationConfig, verificationPublishableKey, createVerificationFetch, createVerificationClient } from './verification-supabase.mjs';

const prod = 'nhirlpkuvonggctdzzad';
const stage = 'abcdefghijklmnopqrst';
const envFor = (kind, ref) => ({
  [`EATCLEAN_${kind.toUpperCase()}_PROJECT_REF`]: ref,
  [`EATCLEAN_${kind.toUpperCase()}_SUPABASE_URL`]: `https://${ref}.supabase.co`,
  [`EATCLEAN_${kind.toUpperCase()}_SUPABASE_SECRET_KEY`]: 'sb_secret_synthetic_not_real',
});
test('explicit staging and production configurations accepted independently', () => {
  assert.equal(verificationConfig('staging', envFor('staging', stage)).url, `https://${stage}.supabase.co`);
  assert.equal(verificationConfig('production', envFor('production', prod)).url, `https://${prod}.supabase.co`);
});
for (const [name, environment, env] of [
  ['missing configuration', 'staging', {}],
  ['generic legacy environment ignored', 'staging', { SUPABASE_SERVICE_ROLE_KEY: 'invented.legacy.jwt', SUPABASE_URL: `https://${prod}.supabase.co` }],
  ['production explicitly labelled staging', 'staging', envFor('staging', prod)],
  ['other project labelled EatClean production', 'production', envFor('production', stage)],
  ['wrong URL', 'staging', { ...envFor('staging', stage), EATCLEAN_STAGING_SUPABASE_URL: `https://${prod}.supabase.co` }],
  ['HTTP destination', 'staging', { ...envFor('staging', stage), EATCLEAN_STAGING_SUPABASE_URL: `http://${stage}.supabase.co` }],
  ['URL credentials', 'staging', { ...envFor('staging', stage), EATCLEAN_STAGING_SUPABASE_URL: `https://user:synthetic@${stage}.supabase.co` }],
  ['legacy scoped key', 'staging', { ...envFor('staging', stage), EATCLEAN_STAGING_SUPABASE_SECRET_KEY: 'invented.legacy.jwt' }],
  ['publishable as privileged key', 'staging', { ...envFor('staging', stage), EATCLEAN_STAGING_SUPABASE_SECRET_KEY: 'sb_publishable_synthetic' }],
  ['unknown environment', 'preview', {}],
]) test(`rejects ${name} without exposing inputs`, () => {
  assert.throws(() => verificationConfig(environment, env), /^Error: VERIFICATION_[A-Z_]+$/);
});
test('public key is explicit and modern, without legacy fallback', () => {
  assert.throws(() => verificationPublishableKey('production', { VITE_SUPABASE_ANON_KEY: 'invented' }));
  assert.equal(verificationPublishableKey('production', { EATCLEAN_PRODUCTION_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_synthetic' }), 'sb_publishable_synthetic');
});
test('transport rejects production, relative URLs and credentials before fetch', () => {
  let calls = 0;
  const send = createVerificationFetch(`https://${stage}.supabase.co`, 'sb_secret_synthetic', () => { calls++; });
  for (const url of [`https://${prod}.supabase.co/rest/v1/orders`, '/rest/v1/orders', `https://u:p@${stage}.supabase.co/rest/v1/orders`]) assert.throws(() => send(url));
  assert.equal(calls, 0);
});
test('opaque Bearer removed; user JWT retained; redirects forbidden', async () => {
  const calls = [];
  const key = 'sb_secret_synthetic';
  const url = `https://${stage}.supabase.co`;
  const send = createVerificationFetch(url, key, async (_, options) => { calls.push(options); return new Response('{}'); });
  await send(`${url}/rest/v1/tenants`, { headers: { Authorization: `Bearer ${key}` }, redirect: 'follow' });
  await send(new Request(`${url}/rest/v1/tenants`, { headers: { Authorization: 'Bearer synthetic.user.jwt' } }));
  assert.equal(calls[0].headers.get('apikey'), key);
  assert.equal(calls[0].headers.has('Authorization'), false);
  assert.equal(calls[0].redirect, 'error');
  assert.equal(calls[1].headers.get('Authorization'), 'Bearer synthetic.user.jwt');
});
test('SDK read uses the guarded transport with an opaque key', async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return new Response('[]', { headers: { 'content-type': 'application/json' } }); };
  try {
    const client = createVerificationClient(`https://${stage}.supabase.co`, 'sb_secret_synthetic', { auth: { persistSession: false, autoRefreshToken: false } });
    const result = await client.from('tenants').select('id');
    assert.equal(result.error, null);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].options.headers.get('apikey'), 'sb_secret_synthetic');
    assert.equal(calls[0].options.headers.has('Authorization'), false);
    assert.equal(calls[0].options.redirect, 'error');
  } finally { globalThis.fetch = original; }
});
const scripts = ['verify-cr-ops-05-live.mjs', 'verify-cr-ops-06-gate-5-staging.mjs', 'verify-cr-ops-06-gate-8-live.mjs', 'verify-cr-ops-diet-01-live.mjs', 'verify-cr-ux-menu-01-visual.mjs', 'verify-eatclean-cust-01-hf01-live.mjs', 'verify-eatclean-cust-01-live.mjs', 'verify-eatclean-track-c-live.mjs'];
for (const name of scripts) test(`${name} uses guarded explicit configuration`, () => {
  const source = readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
  assert.match(source, /createVerificationClient as createClient/);
  assert.match(source, new RegExp(`verificationConfig\\('${name.includes('gate-5-staging') ? 'staging' : 'production'}'\\)`));
  assert.doesNotMatch(source, /eatcleanbackend|find-generic-password|getServiceKey|process\.env\.(?:EATCLEAN_SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SERVICE_ROLE_KEY)/);
});

test('production write opt-in binds script and project; credentials alone never authorize', async () => {
  const { verificationInvocation } = await import('./verification-supabase.mjs');
  const env = envFor('production', prod);
  for (const args of [[], ['--environment=production'], ['--environment=production', '--authorize-production-writes=other:'+prod], ['--environment=production', '--authorize-production-writes=seed-day0:'+stage]]) {
    assert.throws(() => verificationInvocation('seed-day0', true, args, env));
  }
  assert.equal(verificationInvocation('seed-day0', true, ['--environment=production', '--authorize-production-writes=seed-day0:'+prod], env).environment, 'production');
});
test('staging writers require isolated explicit configuration without production authorization', async () => {
  const { verificationInvocation } = await import('./verification-supabase.mjs');
  assert.equal(verificationInvocation('seed-day0', true, ['--environment=staging'], envFor('staging', stage)).environment, 'staging');
  assert.throws(() => verificationInvocation('seed-day0', true, ['--environment=staging'], envFor('staging', prod)));
});
test('read-only transport blocks POST RPC, PUT, PATCH and DELETE before any request', async () => {
  let calls = 0;
  const send = createVerificationFetch(`https://${stage}.supabase.co`, 'sb_secret_synthetic', async () => { calls++; return new Response('{}'); }, { readOnly: true });
  for (const method of ['POST','PUT','PATCH','DELETE']) assert.throws(() => send(`https://${stage}.supabase.co/rest/v1/rpc/example`, { method }), /VERIFICATION_READ_ONLY_REQUIRED/);
  await send(`https://${stage}.supabase.co/rest/v1/tenants`, { method: 'GET' });
  await send(new Request(`https://${stage}.supabase.co/rest/v1/tenants`, { method: 'HEAD' }));
  assert.equal(calls, 2);
});
for (const name of ['verify-eatclean-prod-live.mjs','bootstrap-verify.mjs','seed-day0.mjs','seed-platform-owners.mjs']) test(`${name} has no legacy fallback or dotenv and uses invocation guard`, () => {
  const source = readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
  assert.match(source, /verificationInvocation/);
  assert.doesNotMatch(source, /dotenv\/config|process\.env\.(?:SUPABASE_SERVICE_ROLE_KEY|EATCLEAN_SUPABASE_SERVICE_ROLE_KEY|VITE_SUPABASE_ANON_KEY)|requireEnv\("SUPABASE/);
  if (name === 'bootstrap-verify.mjs') {
    assert.match(source, /createReadOnlyVerificationClient as createClient/);
    assert.match(source, /const live = args.includes\("--live"\);/);
  } else assert.match(source, /verificationInvocation\(['"][^'"]+['"], true\)/);
});
