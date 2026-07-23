# Implementation Backlog — materialización de capacidades

**No es un backlog Scrum de «pantallas».**  
Mide el **nivel de materialización** de cada capacidad.

```text
Scaffold → Connected → Operational → Validated
```

| Nivel | Significado |
|-------|------------|
| **Scaffold** | UI / ruta existe (Lovable); sin datos reales o mock local |
| **Connected** | Lee/escribe vía repository/service + Supabase; sin mocks en Happy Path |
| **Operational** | Usable en operación EatClean del día a día (flujo estable) |
| **Validated** | Evidencia FOV / Field-Validated o cierre explícito post-G-01 |

---

## Leyenda de estado

| Símbolo | Nivel |
|---------|-------|
| ░░░░ | No iniciado |
| ▓░░░ | Scaffold |
| ▓▓░░ | Connected |
| ▓▓▓░ | Operational |
| ▓▓▓▓ | Validated |

---

## Capacidad → progreso

| Capacidad | Nivel | Notas |
|-----------|-------|-------|
| Authentication | ▓░░░ | Auth existe; completar contexto cliente |
| Dish Catalog | ▓░░░ | Module 01 / admin dishes; conectar Customer |
| Weekly Menu | ▓░░░ | UI menu; conectar oferta real |
| Orders | ▓░░░ | Prioridad Happy Path E2E |
| Planning | ▓░░░ | UI production; sin motor inventado |
| Batch | ▓░░░ | UI; conectar cuando OM lo justifique |
| Packaging | ▓░░░ | UI |
| Delivery | ▓░░░ | driver/routes UI |
| Invoices | ░░░░ | Consulta Account/Payment |
| Notifications | ░░░░ | Capability; no Core |
| Audit | ▓▓░░ | `audit_log` + AuditService |
| Feature Flags | ▓▓░░ | `feature_flags` + service |
| Localization | ▓▓░░ | i18n 6 idiomas |
| Analytics | ░░░░ | Post Happy Path |

Actualizar esta tabla en cada sprint de conexión.

---

## Orden de sprints Cursor (conexión)

| Sprint | Foco | Instrucción tipo |
|--------|------|------------------|
| **I-2.1** | Infra de conexión | Query · loaders · adapters · sin tocar UX |
| **I-2.2** | Auth + contexto cliente | Solo conectar sesión / perfil / tenant |
| **I-2.3** | DishRepository / catálogo | No cambiar pantallas · no añadir campos |
| **I-2.4** | Weekly Menu | Solo conectar |
| **I-2.5** | Order Summary + confirmación | Persistencia + audit_log · ver [Happy Path](./HAPPY_PATH_E2E.md) |

Detalle del objetivo E2E: [HAPPY_PATH_E2E](./HAPPY_PATH_E2E.md).  
Reglas: [IMPLEMENTATION_RULES](./IMPLEMENTATION_RULES.md).

---

## Anti-métrica

**No** medir progreso por «pantallas hechas» (ya están).  
**Sí** medir por columnas Scaffold → … → Validated.
