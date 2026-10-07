#!/usr/bin/env node
// Qualification-only wrapper. Existing advisory validators are intentionally not authority.
import { createHash } from 'node:crypto';
import { readFileSync, lstatSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
export const PRODUCTION_ERROR = 'PRODUCTION_AUTHORITY_BINDING_REQUIRED';
export const productionExecution = 'HARD_DISABLED';
export const QUALIFIED_BINARY_SHA256 = '3bdb268bad8ba9d313c11e61a5cec3307094cce3c40bf1b1f5d90caeb8d7a18e';
const allowed = new Set(['mode','binary','binarySha256','manifest','repo','isolation','step','executeLocal']);
export function validateRequest(request) {
  if (!request || request.mode !== 'isolated-qualification' || Object.keys(request).some(k => !allowed.has(k))) throw new Error(PRODUCTION_ERROR);
  for (const k of ['binary','manifest','repo']) if (typeof request[k] !== 'string' || !path.isAbsolute(request[k])) throw new Error('LOCAL_INPUT_INVALID');
  if (!/^[a-f0-9]{64}$/.test(request.binarySha256 ?? '')) throw new Error('BINARY_DIGEST_REQUIRED');
  if (request.binarySha256 !== QUALIFIED_BINARY_SHA256) throw new Error('BINARY_DIGEST_MISMATCH');
  if (typeof request.executeLocal !== 'boolean') throw new Error('LOCAL_INPUT_INVALID');
  if (request.executeLocal && (!Number.isInteger(request.step) || request.step < 1 || request.step > 3 || typeof request.isolation !== 'string')) throw new Error('LOCAL_INPUT_INVALID');
  return true;
}
export function execute(request, spawn = spawnSync) {
  validateRequest(request);
  const stat = lstatSync(request.binary);
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error('BINARY_INVALID');
  const hash = createHash('sha256').update(readFileSync(request.binary)).digest('hex');
  if (hash !== QUALIFIED_BINARY_SHA256) throw new Error('BINARY_DIGEST_MISMATCH');
  const args = ['--manifest', request.manifest, '--repo', request.repo];
  if (request.executeLocal) args.push('--execute-local', '--step', String(request.step), '--isolation', request.isolation);
  // No PG*, DSN, JWT, PAT, credentials or claimed approval passed to child.
  const result = spawn(request.binary, args, { encoding:'utf8', timeout:100_000, maxBuffer:4_000_000, env:{PATH:process.env.PATH ?? '/usr/bin:/bin',TMPDIR:process.env.TMPDIR ?? '/tmp'} });
  function uncertain() {
    // Never rerun mutation. A fresh child opens a NEW read-only local connection.
    if (!request.executeLocal) throw new Error('OUTCOME_UNCERTAIN');
    const readArgs = ['--manifest',request.manifest,'--repo',request.repo,'--reconcile-local','--step',String(request.step),'--isolation',request.isolation];
    const readback = spawn(request.binary,readArgs,{encoding:'utf8',timeout:15_000,maxBuffer:4_000_000,env:{PATH:process.env.PATH ?? '/usr/bin:/bin',TMPDIR:process.env.TMPDIR ?? '/tmp'}});
    let observed;
    try { observed=JSON.parse(readback.stdout); } catch { observed={reconciled:'RECONCILIATION_UNAVAILABLE'}; }
    throw Object.assign(new Error('OUTCOME_UNCERTAIN'),{result:observed});
  }
  if (result.error) uncertain();
  let parsed;
  try { parsed = JSON.parse(result.stdout); } catch { uncertain(); }
  // Only the adapter's fixed result/error vocabulary; never raw stderr.
  if (result.status !== 0) throw Object.assign(new Error('LOCAL_EXECUTION_STOP'), { result:parsed });
  return parsed;
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    if (process.argv.length !== 3) throw new Error(PRODUCTION_ERROR);
    const result = execute(JSON.parse(readFileSync(process.argv[2], 'utf8')));
    process.stdout.write(JSON.stringify(result)+'\n');
  } catch (e) {
    process.stdout.write(JSON.stringify({state:'STOP',error:['LOCAL_EXECUTION_STOP','OUTCOME_UNCERTAIN','LOCAL_INPUT_INVALID','BINARY_DIGEST_REQUIRED','BINARY_INVALID','BINARY_DIGEST_MISMATCH',PRODUCTION_ERROR].includes(e.message)?e.message:'INPUT_REJECTED',result:e.result})+'\n');
    process.exitCode = 1;
  }
}
