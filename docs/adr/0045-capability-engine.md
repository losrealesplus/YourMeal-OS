# ADR 0045 — Capability Engine

## Estado

**Accepted** — 2026-08-05  
**Track:** DEVELOPER-PLATFORM-009  
**Producto:** Developer Platform **v1.6**  
**Detalle:** [CAPABILITY_ENGINE](../05-architecture/CAPABILITY_ENGINE.md)

## Contexto

Antes de Recovery Engine, la plataforma necesita un contrato único para Network, Storage, Session, Android, iOS, etc. Si Recovery conoce Assets/Android/Storage directamente, no escala. Cada capability debe exponer el mismo ciclo: **Diagnose → Recover → Verify**.

## Decisión

1. Introducir **Capability Engine** (`RuntimeCapability`, Registry, Runner, Lifecycle).  
2. Migrar foundation (Assets, Branding, Runtime, Android, Supabase) como wrappers de checks existentes — sin cambiar lógica.  
3. Doctor consume `CapabilityRunner` para discovery/ejecución de checks.  
4. `recover` / `verify` opcionales; foundation los omite → Recover Supported = **NO**.  
5. Host categoría **Capabilities**.  
6. Regla permanente: módulos futuros = `RuntimeCapability` únicamente.  
7. **No** implementar Recovery Engine en este ADR.

## Consecuencias

- Recovery Engine futuro = orquestador fino (`capability.recover()` / `verify()`).  
- 25 módulos futuros comparten el mismo contrato.  
- Cadena unidireccional se mantiene; Capability se inserta sobre Checks.
