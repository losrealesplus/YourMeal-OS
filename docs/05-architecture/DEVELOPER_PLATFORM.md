# YourMeal OS Developer Platform

**Documento:** `DEVELOPER_PLATFORM.md`  
**Producto de ingeniería** (no UX cliente)  
**Versión foundation:** v1.0 · **Doctor:** v1.1 · **Incidents:** v1.2  
**Roadmap congelado:** [DEVELOPER_PLATFORM_ROADMAP](./DEVELOPER_PLATFORM_ROADMAP.md)

> El objetivo del Developer Platform no es ayudar a los desarrolladores.  
> El objetivo es **reducir el riesgo operativo del Product Core**.

---

## Tres piezas

```text
YourMeal OS
 │
 ├── User Experience          (producto cliente · tenant-branded)
 │
 └── Developer Platform       (plataforma de ingeniería)
       │
       ├── Developer Portal   → puerta de entrada del equipo técnico
       │
       ├── Runtime Host       → shell dinámico (módulos del Registry)
       │
       └── Runtime Engine     → Registry · Evidence · Events · Modules
             │
             ├── Doctor Engine    → Capabilities · Checks · FOPEBA
             │
             └── Incident Engine  → Incident · Timeline · Export JSON
```

| Nombre | Qué es |
|--------|--------|
| **Developer Portal** | Acceso (triple-tap / passphrase / secret gateway) |
| **Developer Platform** | Producto de diagnóstico, incidencias y soporte |
| **Runtime Engine** | Kernel (`runtime-core`) + Host + módulos |
| **Doctor Engine** | Salud de la aplicación (`runtime-doctor`) |
| **Incident Engine** | Incidencias estructuradas (`incident-engine`) |

“Runtime Suite” es el overlay histórico; el nombre de producto es **Developer Platform**.

---

## Versiones

| Versión | Entrega |
|---------|---------|
| **v1.0** | Portal · Suite · Core · Host · Assets · DOM · Consistency |
| **v1.1** | Doctor Engine (+ foundation checks + panel mínimo) |
| **v1.2** | **Incident Engine** (+ timeline · panel · export JSON) |
| **v1.3+** | Doctor UI · Recommendation · Recovery · Export ZIP · Knowledge · modules |

Ver secuencia completa de PRs en [DEVELOPER_PLATFORM_ROADMAP](./DEVELOPER_PLATFORM_ROADMAP.md).

---

## Documentos

- [DEVELOPER_PLATFORM_ROADMAP](./DEVELOPER_PLATFORM_ROADMAP.md) · freeze ROUTEMAP-001  
- [RUNTIME_CORE](./RUNTIME_CORE.md) · ADR 0038  
- [DEVELOPER_PLATFORM_HOST](./DEVELOPER_PLATFORM_HOST.md) · ADR 0039  
- [DOCTOR_ENGINE](./DOCTOR_ENGINE.md) · ADR 0040  
- [INCIDENT_ENGINE](./INCIDENT_ENGINE.md) · ADR 0041  
- [RUNTIME_SUITE](./RUNTIME_SUITE.md) · Lifecycle ADR 0036  
