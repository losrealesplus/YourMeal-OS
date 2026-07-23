# Happy Paths operativos (HP)

El progreso de Etapa 2 se mide también por **recorridos**, no solo por CAPs.

---

## HP-001 — Primer pedido cliente (Customer)

```text
Login → Catálogo → Menú semanal → Programar pedido → Resumen → Confirmar
→ Persistencia → Audit Log
```

| CAP | Rol en HP-001 |
|-----|---------------|
| CAP-001 | Login / tenant |
| CAP-002 | Catálogo (lectura) |
| CAP-003 | Menú semanal (lectura) |
| CAP-004 | Programar pedido (mutación) |
| CAP-005 | Resumen |
| CAP-006 | Confirmación + audit |

**Candidato FOV** cuando esté sin mocks.

---

## HP-002 — Producción

```text
Producción → Batch → Packaging
```

Posterior a HP-001 · Carril B producción.

---

## HP-003 — Entrega

```text
Ruta → Entrega → Confirmación
```

Posterior a HP-001 · Delivery.

---

## Relacionado

- [HAPPY_PATH_E2E](./HAPPY_PATH_E2E.md)  
- [ORR](./ORR.md) — pausa tras completar HP-001  
- [FOV Mission Brief](../00-status/FOV_MISSION_BRIEF.md)
