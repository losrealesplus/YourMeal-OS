# Operational Roadmap

**Permanent · Operational Engine v0.8 frozen · ADR [0077](../adr/0077-operational-engine-v08.md)**  
**Companions:** [OPERATIONAL_ENGINE_V08](./OPERATIONAL_ENGINE_V08.md) · [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md) · [OPERATIONAL_ENGINE_REVIEW](./OPERATIONAL_ENGINE_REVIEW.md) · [OPERATIONAL_VALIDATION_SPRINT](./OPERATIONAL_VALIDATION_SPRINT.md) · [OPERATIONAL_EXPANSION](./OPERATIONAL_EXPANSION.md) · [FIELD_VALIDATION_LOG](../10-validation/FIELD_VALIDATION_LOG.md) · [FIELD_VALIDATION_002_IOS](../10-validation/FIELD_VALIDATION_002_IOS.md)

---

## Era

```text
Construction → Validation → Operational Expansion
```

Do not reorder Expansion modules. Architecture Freeze may precede iPhone PASS; Facade+ stays disciplined.

---

## Immediate roadmap

### Validation / Cross-Platform (parallel)

```text
Android / OPPO Field Validation ✅ PASS
iPhone FIELD-VALIDATION-002 ⏳
Engine FIELD VALIDATED 🔒 until both
Roadmap Review (Engine Review) — continuous with Expansion
```

### Operational Expansion

```text
1. OPERATIONAL-006 Delivery · Architecture ✅ (ADR 0078)
2. Delivery Facade (Phase 2) ✅ (ADR 0079)
3. Delivery Engineering Certification (Phase 3) ✅ (ADR 0080)
4. FLOW-002 Architecture ✅ (ADR 0081)
5. FLOW-002 Harness ✅ (ADR 0082) · BH-001
6. FLOW-002 Engineering Certification ✅ (ADR 0083) · 15 PASS · 0 FAIL
7. FLOW-002 Flow Demo ◀ next
8. OPERATIONAL-007 Billing … (after FLOW-002 Demo preferido)
9. FLOW-003 · Scenarios (reserved) …
```

### Method (permanent)

```text
Observe → Design → Freeze → Facade/Harness → Engineering Certification
→ Demo → Field Validation → Cross-Platform Validation → Production
```

---

## Certification phases

```text
PHASE A · Capability Certification     ████████████████ COMPLETE
PHASE B · Operational Flow Validation  ████████████████ FLOW-001 + FLOW-002 Certified
ERA 4  · Operational Behaviours        ████████░░░░░░░░ BH-001 Certified
PHASE C · Real Tenant Validation       ░░░░░░░░░░░░░░░░
```

---

## FLOW-001 track

```text
Architecture (ADR 0074)              ✅
Harness (ADR 0075)                   ✅
Engineering Certification (ADR 0076) ✅
Flow Demo                            ← parallel prefer
```

---

## FLOW-002 track · Operational Fulfillment Flow

```text
Architecture (ADR 0081)              ✅
Harness (ADR 0082)                   ✅
Engineering Certification (ADR 0083) ✅
Flow Demo                            ← next
Behaviour: BH-001 Fulfill Weekly Commitment ✅
Ends at: Delivery Confirmation (not Billing)
```

---

## Success question (field)

> **¿Una persona de EatClean puede recorrer un flujo completo en Android y en iPhone y decir: “Esto me ahorra tiempo y entiendo perfectamente qué tengo que hacer”?**
