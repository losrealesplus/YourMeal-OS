# CURRENT_PHASE

**Última actualización:** 2026-07-23  
**No sustituye** [MILESTONES](./MILESTONES.md) — tablero de “dónde estamos ahora”.

```text
══════════════════════════════════════════════════
PROJECT STATE
══════════════════════════════════════════════════

Current Phase:     Evidence Gate  (pre-ORR)
Current Branch:    main  (IR-001) · Hardening = PR #23 ⏳
Last Integration:  IR-001 · tag v0.2.0-engineering-baseline
Next Gate:         ORR  (PASSED | BLOCKED)
Current Objective: Evidencias — no más código de producto

══════════════════════════════════════════════════
```

---

## Implementación vs preparación operacional

| Estado | Resultado |
|--------|-----------|
| Ready for CAP-006 | ✅ |
| CAP-006 Implemented | ✅ (código en `main` vía IR-001) |
| Hardening P1 (código) | ✅ (PR #23) |
| Hardening en `main` | ⏳ PR #23 merge |
| Migración `program_draft_order` | ⏳ aplicar + verificar |
| HP-001 Smoke (datos reales) | ⏳ pendiente |
| HP-001 Operational | ⏳ pendiente de smoke |
| ORR | ⏳ pendiente |
| Ready for FOV | ⏳ **solo tras ORR PASSED** |

> CAP-006 **no** necesita más desarrollo. Necesita **demostración** (smoke) y **autorización** (ORR).

---

## Operational Confidence

| Dimensión | Estado | Nota |
|-----------|:------:|------|
| Knowledge Confidence | 🟢 | FOPEBA Frozen · OM · Methodology Closed |
| Engineering Confidence | 🟢 | Baseline + Hardening código · tests 59/59 · tsc limpio |
| Operational Confidence | ⚪ | Solo tras smoke HP-001 + ORR PASSED + FOV |

---

## Ciclo obligatorio (sin código nuevo)

```text
PR #23 → main
        ↓
Aplicar migración 20260723120000_program_draft_order_atomic.sql
        ↓
Smoke HP-001 (datos reales, sin mocks live)
        ↓
ORR  →  PASSED | BLOCKED
        ↓
Si PASSED: HP-001 Operational · Ready for FOV
        ↓
FOV · Knowledge Update · Gate
```

Checklist de evidencias ORR: [ORR](../22-implementation/ORR.md) · plantilla [HP-001_EVIDENCE_LOG](../22-implementation/HP-001_EVIDENCE_LOG.md).

---

## Hardening P1 (código)

| ID | Grupo | Código |
|----|-------|:------:|
| INC-01…07 | Integrity + Completeness | ✅ en PR #23 |

Detalle: [ENGINEERING_REVIEW_SPRINT0](./ENGINEERING_REVIEW_SPRINT0.md).
