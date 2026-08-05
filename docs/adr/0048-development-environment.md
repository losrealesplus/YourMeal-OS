# ADR 0048 — Development Environment

## Estado

**Accepted** — 2026-08-05  
**Track:** HOUSEKEEPING-002 · DEVELOPER-PLATFORM-INFRA-001  
**Detalle:** [DEVELOPMENT_ENVIRONMENT](../00-status/DEVELOPMENT_ENVIRONMENT.md)

## Contexto

El toolchain local (JDK, Android SDK, ADB, Gradle, Node) se reconfigura o se pierde entre terminales. Los fallos de `assembleDebug` por OpenJDK 26 no son bugs de producto: son deuda de entorno no detectada. FOPEBA y Developer Platform v1.0 exigen evidencia automática, no memoria humana.

## Decisión

1. Introducir la capa **Development Environment** en `scripts/development/` como Capability Drivers.  
2. Política oficial: **JDK 21** — cualquier major ≥ 22 es **ERROR**.  
3. Drivers emiten Evidence · Recommendation · Recovery Hint; **nunca** auto-recover.  
4. CLI: `npm run doctor:env` (+ integración en `npm run doctor`).  
5. Registrar RuntimeCapability `development-environment` (Host glance → CLI).  
6. Documentar bootstrap guide (`scripts/development/bootstrap.sh`).

## Consecuencias

- Un desarrollador nuevo ejecuta `npm run doctor:env` y sabe en segundos si la máquina está lista.  
- HOUSEKEEPING-003 podrá añadir `.env.development.example` como contrato de variables.  
- No se tocan Product Core ni engines congelados; solo tooling + capability registrable.
