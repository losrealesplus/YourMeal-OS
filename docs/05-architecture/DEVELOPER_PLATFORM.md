# YourMeal OS Developer Platform

**Documento:** `DEVELOPER_PLATFORM.md`  
**Producto de ingeniería** (no UX cliente)  
**Versión foundation:** v1.0 · **Doctor:** v1.1  

---

## Tres piezas

```text
YourMeal OS
 │
 ├── User Experience          (producto cliente · tenant-branded)
 │
 └── Developer Platform       (producto ingeniería)
       │
       ├── Developer Portal   → puerta de entrada del equipo técnico
       │
       ├── Runtime Host       → shell dinámico (módulos del Registry)
       │
       └── Runtime Engine     → Registry · Evidence · Events · Modules
             │
             └── Doctor Engine → Capabilities · Checks · FOPEBA
```

| Nombre | Qué es |
|--------|--------|
| **Developer Portal** | Acceso (triple-tap / passphrase / secret gateway) |
| **Developer Platform** | El producto: diagnóstico, soporte, evidencia |
| **Runtime Engine** | Kernel (`runtime-core`) + Host + módulos registrados |
| **Doctor Engine** | Motor de salud de la aplicación (`runtime-doctor`) |

“Runtime Suite” es el overlay histórico; el nombre de producto es **Developer Platform**.

---

## Versiones

| Versión | Entrega |
|---------|---------|
| **v1.0** | Portal · Suite · Core · Host · Assets · DOM · Consistency |
| **v1.1** | **Doctor Engine** (+ foundation checks + panel mínimo) |
| **v1.2+** | Checks Session/Storage · Network · Performance · Export ZIP · Knowledge |

### Roadmap de PRs (secuencia)

| PR | Entrega |
|----|---------|
| ✅ #297 | Host · Registry · Modules |
| ⭐ #298 | **Doctor Engine** (este track) |
| #299 | Doctor UI (experiencia Host enriquecida) |
| #300 | Assets Checks (ampliación) |
| #301 | Branding Checks (ampliación) |
| #302 | Network Checks |
| #303 | Storage Checks |
| #304 | Session Checks |
| #305 | Performance Checks |
| #306 | Export Diagnostic ZIP |
| #307 | Knowledge Engine |
| #308 | Issue Timeline |
| #309 | Auto Recovery Suggestions |

A partir de #298, cada capability nueva = `registerCheck()` — sin tocar el Engine.

---

## Documentos

- [RUNTIME_CORE](./RUNTIME_CORE.md) · ADR 0038  
- [DEVELOPER_PLATFORM_HOST](./DEVELOPER_PLATFORM_HOST.md) · ADR 0039  
- [DOCTOR_ENGINE](./DOCTOR_ENGINE.md) · ADR 0040  
- [RUNTIME_SUITE](./RUNTIME_SUITE.md) · Lifecycle ADR 0036  
