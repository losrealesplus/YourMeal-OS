# Developer Platform Roadmap

**Documento:** `DEVELOPER_PLATFORM_ROADMAP.md`  
**Track:** DEVELOPER-PLATFORM-ROADMAP-001  
**Producto:** YourMeal OS **Developer Platform**  
**Estado:** Foundation Complete · Roadmap frozen 2026-08-05

> El objetivo del Developer Platform no es ayudar a los desarrolladores.  
> El objetivo es **reducir el riesgo operativo del Product Core** para que los tenants trabajen sobre una plataforma estable.

---

## Estado actual — Foundation + Incident + Doctor UI

| PR | Entrega | Estado |
|----|---------|--------|
| #291 | Developer Platform Foundation | ✅ |
| #292 | Secret Gateway | ✅ |
| #293 | Runtime Suite | ✅ |
| #294 | Runtime Lifecycle | ✅ |
| #295 | Developer Portal | ✅ |
| #296 | Runtime Core | ✅ |
| #297 | Runtime Host | ✅ |
| #298 | Doctor Engine | ✅ |
| #299 | Incident Engine | ✅ |
| #300 | Doctor UI | ✅ |
| #301 | Knowledge Engine | ✅ |
| #302 | Recommendation Engine | ✅ |

```text
Portal → Host → Registry → Modules → Doctor → Evidence → Incident → Timeline
```

A partir de aquí, módulos nuevos = contratos (`registerModule` · `registerCheck` · `reportIncident` · `registerKnowledge`).

---

## Principio permanente

Todo lo que se construya forma parte de una **plataforma de ingeniería**, no de un cajón de utilidades. Mismo rigor de contrato que el Product Core.

**Objetivo de negocio medible**

> Que cada nueva funcionalidad del Product Core llegue a producción con el menor riesgo posible, pueda diagnosticarse en minutos y permita a los equipos de EatClean ahorrar tiempo en lugar de generar nuevas incidencias.

---

## Fase 1c — Capability before Recovery

| PR | Entrega | Notas |
|----|---------|-------|
| #301 | Knowledge Engine | ✅ v1.4 |
| #302 | Recommendation Engine | ✅ v1.5 |
| ✅ **Capability Engine** | **DEVELOPER-PLATFORM-009 · v1.6** | Contrato único Diagnose/Recover/Verify |
| ✅ **#304 Recovery Engine** | **DEVELOPER-PLATFORM-010 · v1.7** | Orquesta `Capability.recover/verify` |
| — | Diagnostic Export ZIP | siguiente |
| — | Telemetry Engine | |

```text
Capability → Checks → Evidence → Incident → Knowledge → Recommendation → Recovery
```

**Por qué Capability antes que Recovery:** Recovery no debe conocer Assets/Android/Storage. Cada capability declara `diagnose/recover/verify`; Recovery solo orquesta.

### Principio permanente — dependencia unidireccional

> Un Engine nunca depende de otro Engine situado *más arriba* en la cadena.  
> Cada Engine solo consume contratos de los niveles anteriores.

---

## Fase 2 — Capability modules

| PR | Módulo |
|----|--------|
| #306 | Network |
| #307 | Storage |
| #308 | Session |
| #309 | API |
| #310 | Performance |
| #311 | Feature Flags |
| #312 | Tenant Diagnostics |
| #313 | Remote Support |
| #314 | AI Assistant |

Contrato obligatorio: **`RuntimeCapability`** (+ `registerKnowledge` cuando aplique).  
Sin lógica de recovery fuera del contrato.

---

## Fase 3 — Support scale

| Pieza | Rol |
|-------|-----|
| Issue Engine | Ciclo de vida de incidencias de producto |
| Knowledge Base | Memoria operativa acumulada |
| Replay Engine | Reproducción controlada |
| Support Mode | Modo soporte / diagnóstico asistido |
| Remote Diagnostics | Remoto **con consentimiento** |

---

## Visión congelada

```text
Developer Portal
        │
        ▼
Runtime Host
        │
        ▼
Registry
        │
        ▼
Modules
        │
        ▼
Doctor Engine
        │
        ▼
Capability Engine
        │
        ▼
Incident Engine
        │
        ▼
Knowledge Engine
        │
        ▼
Recommendation Engine
        │
        ▼
Recovery Engine
        │
        ▼
Export Engine
        │
        ▼
Product Core
        │
        ▼
EatClean
```

---

## Documentos

- [DEVELOPER_PLATFORM](./DEVELOPER_PLATFORM.md) — vocabulario  
- [DEVELOPER_PLATFORM_HOST](./DEVELOPER_PLATFORM_HOST.md) · ADR 0039  
- [RUNTIME_CORE](./RUNTIME_CORE.md) · ADR 0038  
- [DOCTOR_ENGINE](./DOCTOR_ENGINE.md) · ADR 0040  
- [INCIDENT_ENGINE](./INCIDENT_ENGINE.md) · ADR 0041  
- [DOCTOR_UI](./DOCTOR_UI.md) · ADR 0042  
- [KNOWLEDGE_ENGINE](./KNOWLEDGE_ENGINE.md) · ADR 0043  
- [RECOMMENDATION_ENGINE](./RECOMMENDATION_ENGINE.md) · ADR 0044  
- [CAPABILITY_ENGINE](./CAPABILITY_ENGINE.md) · ADR 0045  
- [RECOVERY_ENGINE](./RECOVERY_ENGINE.md) · ADR 0046  
