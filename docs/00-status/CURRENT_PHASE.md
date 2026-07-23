# CURRENT_PHASE

**Última actualización:** 2026-07-23  
**No sustituye** [MILESTONES](./MILESTONES.md) — es el tablero de “dónde estamos ahora”.

---

## Project Phase

```text
Engineering Fix Sprint
```

*(Fase A — merge de pila a `main` — en curso vía este PR si aún no está en trunk.)*

---

## Status

| Puerta | Resultado |
|--------|-----------|
| Ready for CAP-006 | ✅ (implementado en pila CAP-002…006; Confirm en código) |
| Ready for ORR | ❌ |

---

## Current Objective

Resolve **P1 Engineering Findings** — sin nuevas Capabilities, sin UX, sin OM.

### Engineering Integrity

| ID | Tema |
|----|------|
| INC-01 | No confiar `total` / `dishIds` del cliente |
| INC-03 | Ownership order → customer en Confirm |
| INC-05 | Atomicidad draft + audit consistente |

### Engineering Completeness

| ID | Tema |
|----|------|
| INC-02 | Soft-delete (`deleted_at`) + types |
| INC-04 | N+1 en Order Summary |
| INC-06 | Eliminar `MOCK_ORDERS` (home / lista) |
| INC-07 | Cablear `featureFlagService` |

Detalle: [ENGINEERING_REVIEW_SPRINT0](./ENGINEERING_REVIEW_SPRINT0.md).

---

## Next Gate

```text
ORR  (PASSED | BLOCKED)  — sin features
```

*(Tras cerrar P1. CAP-006 ya materializado; el Fix Sprint consolida confianza antes de ORR.)*

---

## Next Milestone

```text
HP-001 · Operational · ORR PASSED · Ready for FOV
```

---

## Roadmap (post–construcción)

```text
Fase A  Merge pila → main
Fase B  Engineering Fix Sprint (P1)
Fase C  Verificar CAP-006 / HP-001 estable
Fase D  ORR
Fase E  FOV (EatClean)
```

Gobernanza: **no** abrir documentos metodológicos nuevos hasta terminar la primera FOV.
