# Operational Expansion

**Status:** ▶ **DECLARED** — 2026-08-06 · ADR [0078](../adr/0078-delivery-capability.md)  
**Prerequisite core:** Operational Engine **v0.8** · [OPERATIONAL_ENGINE_V08](./OPERATIONAL_ENGINE_V08.md)  
**Field:** Android PASS · iPhone audit NOT READY · [FIELD_VALIDATION_002_IOS](../10-validation/FIELD_VALIDATION_002_IOS.md)

```text
══════════════════════════════════════════════
ERA CHANGE

Operational Engine v0.8
████████████████████
Core frozen · Android field PASS

↓

Operational Expansion
████░░░░░░░░░░░░░░░░
First module: OPERATIONAL-006 Delivery
(Architecture Freeze only)
══════════════════════════════════════════════
```

---

## Meaning

We are **no longer building the base**.  
We are **expanding a motor** that already has engineering certification and Android field evidence.

| Until v0.8 | From Expansion |
|------------|----------------|
| Prove the Engine exists | Add Execution / Outcome modules |
| Identity → Kitchen + FLOW-001 | Delivery → FLOW-002 → Billing → … |
| “Operational Modules” (loose) | **Operational Expansion** (named era) |

---

## Permanent method (updated)

```text
Observe
  → Design
  → Freeze
  → Facade / Harness
  → Engineering Certification
  → Capability / Flow Demo
  → Field Validation
  → Cross-Platform Validation
  → Production
```

Cross-Platform Validation stays mandatory for claiming a module is **device-independent**.  
Architecture Freeze may precede iPhone PASS; **Facade+ implementation** should not outrun field discipline without cause.

---

## Expansion order (dependencies)

```text
OPERATIONAL-006  Delivery          ← Architecture NOW (ADR 0078)
        ↓
FLOW-002         Kitchen → Delivery   (after Delivery Facade)
        ↓
OPERATIONAL-007  Billing
        ↓
FLOW-003         Delivery → Billing
        ↓
OPERATIONAL-008  Inventory
        ↓
OPERATIONAL-009  Procurement
        ↓
OPERATIONAL-010  Analytics
```

Do not reorder. Delivery before Billing. Confirmation before settlement.

---

## Parallel track (not Expansion code)

```text
IOS-READY-001 / FIELD-VALIDATION-002
  Xcode Team · Preferences SPM · sync · iPhone PASS
```

Operator path for iOS remains open in parallel.  
It does **not** authorize skipping LAW 001–007 on Delivery.

---

## First mission

**OPERATIONAL-006 · Delivery Capability · Phase 1**  
Canonical question:

> ¿Qué compromisos operativos deben entregarse ahora y cómo confirmamos su ejecución?

Contract: [DELIVERY_CAPABILITY](../05-architecture/DELIVERY_CAPABILITY.md)

---

## Explicitly locked

| Item | Lock |
|------|------|
| Delivery Facade / UI / DB | Until Phase 2 intentionally opened |
| FLOW-002 Harness | Until Delivery Facade |
| Billing Architecture | Until Delivery Architecture cycle complete (prefer Facade+) |
| Claiming Engine **FIELD VALIDATED** | Until iPhone PASS + Android PASS |
