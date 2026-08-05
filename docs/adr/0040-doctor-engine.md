# ADR 0040 — Doctor Engine

## Estado

**Accepted** — 2026-08-05  
**Track:** DEVELOPER-PLATFORM-004  
**Producto:** Developer Platform **v1.1**  
**Detalle:** [DOCTOR_ENGINE](../05-architecture/DOCTOR_ENGINE.md)

## Contexto

Con Host + Registry (#297 / ADR 0039), añadir herramientas sueltas volvería a acoplar el Shell. El siguiente salto de valor es un **Doctor** que diagnostique la aplicación completa mediante comprobaciones independientes, generando evidencia FOPEBA — no un script monolítico de cuatro asserts.

## Decisión

1. Introducir **Doctor Engine** (`src/runtime/runtime-doctor/`) con `registerCheck()` / Runner / Health Score / Evidence.  
2. Doctor **no conoce** checks concretos (simétrico al Host vs módulos).  
3. Registrar Doctor como Runtime Module `Health` + renderer Host mínimo.  
4. Entregar checks foundation (Runtime, Assets, Branding, Android probe, Supabase env).  
5. Mantener CLI `npm run doctor` como doctor de toolchain, separado del Doctor de runtime.

## Consecuencias

- Network / Storage / Session / Performance = PRs de `registerCheck` únicamente.  
- Export ZIP y Knowledge se apoyan en `RuntimeEvidence` ya emitido.  
- Vocabulario oficial: Developer Portal · Developer Platform · Runtime Engine · Doctor Engine.
