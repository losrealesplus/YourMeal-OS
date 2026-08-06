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
(Facade · ADR 0078 · 0079)
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

**Language:** [OPERATIONAL_LANGUAGE_DICTIONARY](./OPERATIONAL_LANGUAGE_DICTIONARY.md)

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

---

## Expansion order (dependencies)

```text
OPERATIONAL-006  Delivery          ← Architecture ✅ · Facade ✅
        ↓
FLOW-002         Kitchen → Delivery   (after Delivery Certification)
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

---

## Parallel track (not Expansion code)

```text
IOS-READY-001 / FIELD-VALIDATION-002
  Xcode Team · Preferences SPM · sync · iPhone PASS
```

---

## First mission status

**OPERATIONAL-006 · Delivery**  
Phase 1 Architecture ✅ · Phase 2 Facade ✅ · Phase 3 Certification ◀ next

Canonical question:

> ¿Qué compromisos operativos deben entregarse ahora y cómo confirmamos su ejecución?

Contract: [DELIVERY_CAPABILITY](../05-architecture/DELIVERY_CAPABILITY.md) · Facade: `src/delivery/`

---

## Explicitly locked

| Item | Lock |
|------|------|
| Delivery UI / DB / Demo | Until Phase 3–4 |
| FLOW-002 Harness | Until Delivery Certification |
| Billing Architecture | Prefer after Delivery Demo |
| Claiming Engine **FIELD VALIDATED** | Until iPhone PASS + Android PASS |
