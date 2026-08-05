# Developer Platform Roadmap

**Documento:** `DEVELOPER_PLATFORM_ROADMAP.md`  
**Track:** DEVELOPER-PLATFORM-ROADMAP-001  
**Producto:** YourMeal OS **Developer Platform**  
**Estado:** Foundation Complete · Roadmap frozen 2026-08-05

> El objetivo del Developer Platform no es ayudar a los desarrolladores.  
> El objetivo es **reducir el riesgo operativo del Product Core** para que los tenants trabajen sobre una plataforma estable.

---

## Estado actual — Foundation Complete

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

```text
Portal → Host → Registry → Modules → Doctor Engine → Checks → Evidence
```

A partir de aquí, **ningún módulo nuevo** debería requerir modificar el Host ni el Doctor Engine — solo contratos (`registerModule` · `registerCheck` · `reportIncident`).

---

## Principio permanente

Todo lo que se construya forma parte de una **plataforma de ingeniería**, no de un cajón de utilidades. Mismo rigor de contrato que el Product Core.

**Objetivo de negocio medible**

> Que cada nueva funcionalidad del Product Core llegue a producción con el menor riesgo posible, pueda diagnosticarse en minutos y permita a los equipos de EatClean ahorrar tiempo en lugar de generar nuevas incidencias.

---

## Fase 1 — Incident Platform (v1.2+)

| PR | Entrega | Notas |
|----|---------|-------|
| #299 | Doctor UI (v1.1) | UX: Score · Capabilities · Checks · Recommendations · Evidence · Timeline · Run Again · Copy — **sin nuevos checks** |
| #300 | **Incident Engine** | Evidence → Incident estructurado (este track = DEVELOPER-PLATFORM-005) |
| #301 | Timeline Engine | Historia automática por incidente (puede vivir en Incident Engine v1 y expandirse) |
| #302 | Recommendation Engine | Qué / por qué / cómo / evidencia / confianza |
| #303 | Recovery Engine | `diagnose()` · `recover()` · `verify()` — contrato primero |
| #304 | Export Engine | `diagnostic-*.zip` — idioma común soporte ↔ desarrollo |
| #305 | Knowledge Engine | Patrones · recovery recomendado · confidence |

Cadena oficial:

```text
Doctor → Evidence → Incident → Timeline → Recovery → Export → Knowledge → Product Core → EatClean
```

---

## Fase 2 — Capability modules

Solo **después** de la infraestructura de incidencias:

| PR | Módulo |
|----|--------|
| #306 | Network |
| #307 | Storage |
| #308 | Session |
| #309 | Performance |
| #310 | API |
| #311 | Feature Flags |
| #312 | Branding |
| #313 | Tenant |
| #314 | Experimental Features |

Contrato único: `registerModule()` + `registerCheck()`.  
Sin tocar Host · Portal · Doctor · Incident Engine.

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
Incident Engine
        │
        ▼
Timeline Engine
        │
        ▼
Recovery Engine
        │
        ▼
Export Engine
        │
        ▼
Knowledge Engine
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
- [DOCTOR_ENGINE](./DOCTOR_ENGINE.md) · ADR 0040  
- [INCIDENT_ENGINE](./INCIDENT_ENGINE.md) · ADR 0041  
- [DEVELOPER_PLATFORM_HOST](./DEVELOPER_PLATFORM_HOST.md) · ADR 0039  
- [RUNTIME_CORE](./RUNTIME_CORE.md) · ADR 0038  
