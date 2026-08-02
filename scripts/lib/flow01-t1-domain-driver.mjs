/**
 * Back-compat shim — FLOW01-001 driver now lives in flow01-domain-driver.mjs
 * (T1 + subsequent certified transitions).
 */
export {
  runFlow01DomainDriver,
  runFlow01T1DomainDriver,
} from "./flow01-domain-driver.mjs";
