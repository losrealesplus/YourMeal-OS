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
████████░░░░░░░░░░░░
First module: OPERATIONAL-006 Delivery
(Engineering Certified · ADR 0078 · 0079 · 0080)
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
OPERATIONAL-006  Delivery          ← Architecture ✅ · Facade ✅ · Engineering Certified ✅
        ↓
FLOW-002         Operational Fulfillment   ← Engineering Certified ✅ · BH-001
                 Order → … → Confirmation
        ↓
OPERATIONAL-007  Billing
        ↓
FLOW-003         Confirmation → Billing
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

**OPERATIONAL-FLOW-002** — Engineering Certified ✅ · Demo ◀ next  
**BH-001** — Fulfill Weekly Commitment · Certified ✅  
**Scenarios** — RESERVED ([registry](./OPERATIONAL_SCENARIO_REGISTRY.md))

Canonical Flow question:

> ¿Puede un compromiso operativo convertirse en una entrega confirmada sin romper ninguna Foundation Law?

Contract: [OPERATIONAL_FLOW_002](../05-architecture/OPERATIONAL_FLOW_002.md) · Report: [FLOW_002_VALIDATION_REPORT](../10-validation/FLOW_002_VALIDATION_REPORT.md)

---

## Explicitly locked

| Item | Lock |
|------|------|
| Delivery Product UI / DB | Until Demo+ / Flow Demo preferido |
| FLOW-002 Flow Demo | Next (useFlow002 only) |
| Billing Architecture | ✅ ADR 0087 — unlocked by Delivery Demo |
| Billing Facade → Demo | Next structural Engine work |
| OPERATIONAL-ENGINE-001 | RESERVED — after Billing Demo |
| Scenarios | RESERVED |
| Claiming Engine **FIELD VALIDATED** | Until iPhone PASS + Android PASS |
