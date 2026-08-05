# Capability Engine

**Documento:** `CAPABILITY_ENGINE.md`  
**Track:** DEVELOPER-PLATFORM-009  
**Producto:** YourMeal OS **Developer Platform v1.6**  
**Código:** `src/runtime/capability-engine/`  
**ADR:** [0045 — Capability Engine](../adr/0045-capability-engine.md)  
**Roadmap:** [DEVELOPER_PLATFORM_ROADMAP](./DEVELOPER_PLATFORM_ROADMAP.md)

> Todos los módulos futuros se implementan como `RuntimeCapability`.  
> Recovery **nunca** hablará con Assets/Network — solo con Capabilities.

---

## Arquitectura

```text
Developer Platform
  → Capability
    → Checks
      → Evidence → Incident → Knowledge → Recommendation → Recovery
```

```text
Recovery Engine (futuro)
  → Capability.recover()
  → Capability.verify()
```

---

## Contrato

```ts
type RuntimeCapability = {
  id, name, category,
  supportedPlatforms: web|android|ios[],
  diagnose(ctx): Promise<RuntimeCheckResult[]>,
  recover?(ctx): Promise<RuntimeRecoveryResult>,
  verify?(ctx): Promise<RuntimeVerificationResult>,
}
```

---

## Lifecycle

```text
Idle → Diagnosing → Healthy | Warning | Error
                 ↘ Recovering → Verifying → Healthy   (futuro)
```

Estado **por capability** (no globales).

---

## API

| Método | Rol |
|--------|-----|
| `registerCapability()` | Registro |
| `getCapability()` / `listCapabilities()` | Lectura |
| `runCapability()` / `runAllCapabilities()` | Diagnose + lifecycle |
| `recoverCapability()` / `verifyCapability()` | Orquestación (stub si no implementado) |

---

## Foundation (migradas, misma lógica)

Assets · Branding · Runtime · Android · Supabase  

Wrappers vía `createCapabilityFromChecks()` — **sin cambiar** los Doctor checks.

---

## Doctor

```text
Doctor → CapabilityRunner → Checks → Evidence / Incident
```

Orphan checks en DoctorRegistry (experimentales / tests) siguen ejecutándose si no están cubiertos por una Capability.

---

## Host

Módulo `capabilities` · categoría **Capabilities**:

Capability · Platform · Status · Health · Checks · Recover YES/NO · Verify YES/NO

---

## Regla permanente

No se aceptan módulos de diagnóstico fuera de `RuntimeCapability`.

---

## Non-goals

Recovery Engine · ZIP · Telemetry · AI · Cloud Sync · implementar `recover()` real.
