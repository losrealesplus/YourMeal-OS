# Developer Platform v1.0 — Constitución

**Documento:** `DEVELOPER_PLATFORM_v1.md`  
**Estado:** **FROZEN** · DEVELOPER-PLATFORM-011  
**Versión:** **1.0.0**  
**ADR:** [0047 — Developer Platform v1.0 Freeze](../adr/0047-developer-platform-v1-freeze.md)  
**Contratos públicos:** `src/runtime/platform-contracts/`  
**Baseline:** [baselines/developer-platform-v1-performance.json](./baselines/developer-platform-v1-performance.json)

> La Developer Platform existe para **reducir el riesgo operativo del Product Core** y acelerar su desarrollo — no para convertirse en el producto principal.

---

## Visión

```text
YOURMEAL OS
 ├── Product Core          ← foco post-freeze (≈80%)
 └── Developer Platform    ← infraestructura estable (≈20%)
       ├── Developer Portal
       ├── Runtime Host
       ├── Runtime Core
       ├── Capability Engine
       ├── Doctor Engine
       ├── Incident Engine
       ├── Knowledge Engine
       ├── Recommendation Engine
       └── Recovery Engine
```

Esto ya no es un overlay. Es una **plataforma de ingeniería**.

---

## Filosofía

1. **FOPEBA** — evidencia sobre opinión.  
2. **Engines unidireccionales** — nunca dependen hacia arriba.  
3. **Recovery no repara** — orquesta `Capability.recover()` / `verify()`.  
4. **Módulos futuros = `RuntimeCapability`** únicamente.  
5. **Manual first** — sin Automatic Recovery / AI en v1.0.

---

## Arquitectura (cadena oficial)

```text
Capability → Checks → Evidence → Incident → Knowledge → Recommendation → Recovery → Verify
```

| Pieza | Rol | Código |
|-------|-----|--------|
| Developer Portal | Acceso (triple-tap / passphrase / secret gateway) | `runtime-secret-gateway` |
| Runtime Host | Shell dinámico de módulos | `runtime-host` |
| Runtime Core | Registry · Events · Evidence · Permissions | `runtime-core` |
| Capability Engine | Contrato único Diagnose / Recover / Verify | `capability-engine` |
| Doctor Engine | Salud · checks · Health Score · UI glance | `runtime-doctor` |
| Incident Engine | Incidentos estructurados · timeline · export | `incident-engine` |
| Knowledge Engine | Modelo de conocimiento diagnóstico | `knowledge-engine` |
| Recommendation Engine | Decisiones priorizadas vía Knowledge | `recommendation-engine` |
| Recovery Engine | Orquesta recover → verify | `recovery-engine` |

El overlay histórico **YMOS Runtime Inspector** es el *shell* que monta el Host. No es un engine; no se elimina en el freeze.

---

## Contratos públicos (congelados)

Cualquier cambio posterior requiere **ADR versionado**.

| Contrato | Engine |
|----------|--------|
| `RuntimeEvidence` | Core |
| `RuntimeCapability` | Capability |
| `RuntimeIncident` | Incident |
| `RuntimeKnowledge` | Knowledge |
| `RuntimeRecommendation` | Recommendation |
| `RuntimeRecovery` | Recovery |

Barrel estable: `src/runtime/platform-contracts/`.

Marcadores:

```ts
DEVELOPER_PLATFORM_VERSION = "1.0.0"
DEVELOPER_PLATFORM_FREEZE = true
```

---

## Reglas permanentes de dependencia

Automatizadas en **Platform Contract Tests** (`platform-contracts.spec.ts`).

Ejemplos:

| From | To | |
|------|-----|---|
| Doctor | Capability | OK |
| Capability | Recovery / Recommendation / Knowledge / Incident | FAIL |
| Recommendation | Doctor / Recovery / Capability | FAIL |
| Recovery | Doctor / Incident / Knowledge / Assets / Host | FAIL |
| Knowledge | Doctor / Recommendation / Incident / Host (pure) | FAIL |
| Core | cualquier engine | FAIL |

**Excepciones documentadas (bridges):**

- `register-*-module.ts` / `*Panel.tsx` → Host adapters (UI registration).  
- Capability → `runtime-doctor/checks` + `DoctorCheck` (wrappers foundation).  
- Incident → `doctor-bridge` tipado hacia Doctor checks.

---

## Motores — ciclo funcional v1.0

```text
Diagnose → Evidence → Incident → Knowledge → Recommendation → Recovery → Verify
```

Primera capability recuperable: **Runtime** (clear dismiss / verify overlay gate).  
Assets · Branding · Android · Supabase: `recover = undefined` → Recovery Not Supported.

---

## Roadmap post-freeze

| Prioridad | Entrega |
|-----------|---------|
| Product Core | EatClean jornada completa sin bloqueos |
| DP opcional | Capability modules (Network, Storage, …) como `RuntimeCapability` |
| DP diferido | Export ZIP · Telemetry · AI |

No abrir ZIP / Telemetry hasta que el Product Core demuestre valor operacional con la plataforma ya estable.

---

## Documentación canónica

| Doc | Tema |
|-----|------|
| Este documento | Constitución v1.0 |
| [DEVELOPER_PLATFORM.md](./DEVELOPER_PLATFORM.md) | Vocabulario |
| [DEVELOPER_PLATFORM_ROADMAP.md](./DEVELOPER_PLATFORM_ROADMAP.md) | Roadmap |
| [RUNTIME_CORE.md](./RUNTIME_CORE.md) · ADR 0038 | Kernel |
| [DEVELOPER_PLATFORM_HOST.md](./DEVELOPER_PLATFORM_HOST.md) · ADR 0039 | Host |
| [DOCTOR_ENGINE.md](./DOCTOR_ENGINE.md) · ADR 0040 | Doctor |
| [INCIDENT_ENGINE.md](./INCIDENT_ENGINE.md) · ADR 0041 | Incident |
| [DOCTOR_UI.md](./DOCTOR_UI.md) · ADR 0042 | Doctor UI |
| [KNOWLEDGE_ENGINE.md](./KNOWLEDGE_ENGINE.md) · ADR 0043 | Knowledge |
| [RECOMMENDATION_ENGINE.md](./RECOMMENDATION_ENGINE.md) · ADR 0044 | Recommendation |
| [CAPABILITY_ENGINE.md](./CAPABILITY_ENGINE.md) · ADR 0045 | Capability |
| [RECOVERY_ENGINE.md](./RECOVERY_ENGINE.md) · ADR 0046 | Recovery |
| ADR 0047 | Freeze v1.0 |

---

## Definition of Done — Freeze

```text
Developer Platform v1.0
Architecture Stable
Contracts Stable
Engines Stable
Documentation Stable
Ready for Product Core
```
