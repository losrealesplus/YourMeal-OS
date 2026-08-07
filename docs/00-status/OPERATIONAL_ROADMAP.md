# Operational Roadmap

**Permanent · Operational Engine v0.8 frozen · ADR [0077](../adr/0077-operational-engine-v08.md)**  
**Product Direction:** [PRODUCT_DIRECTION](./PRODUCT_DIRECTION.md) · **PRODUCT LAW 001** · ADR [0084](../adr/0084-product-law-001.md) · [Time Savings Backlog](./TENANT_TIME_SAVINGS_BACKLOG.md)  
**Companions:** [OPERATIONAL_ENGINE_V08](./OPERATIONAL_ENGINE_V08.md) · [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md) · [OPERATIONAL_ENGINE_REVIEW](./OPERATIONAL_ENGINE_REVIEW.md) · [OPERATIONAL_VALIDATION_SPRINT](./OPERATIONAL_VALIDATION_SPRINT.md) · [OPERATIONAL_EXPANSION](./OPERATIONAL_EXPANSION.md) · [FIELD_VALIDATION_LOG](../10-validation/FIELD_VALIDATION_LOG.md) · [FIELD_VALIDATION_002_IOS](../10-validation/FIELD_VALIDATION_002_IOS.md)

---

## Era

```text
Construction → Validation → Operational Expansion → Tenant Success
```

From 2026-08-07 the governing product question is:

> **¿Esto ayuda al tenant a trabajar mejor y más rápido?**

Do not reorder Expansion modules for novelty. Architecture reopen only if Foundation broken · Production blocked · or measurable time savings require it.

---

## Immediate roadmap

### Product Direction (active)

```text
PRODUCT LAW 001 ACTIVE
Finish Engine → v1.0 freeze → Tenant Success / Beta usability
```

### Validation / Cross-Platform (parallel)

```text
Android / OPPO Field Validation ✅ PASS
iPhone FIELD-VALIDATION-002 ⏳
Engine FIELD VALIDATED 🔒 until both
Roadmap Review (Engine Review) — continuous with Expansion
```

### Operational Expansion → Engine v1.0

```text
1. OPERATIONAL-006 Delivery · Architecture ✅ · Facade ✅ · Certification ✅
2. FLOW-002 · Architecture ✅ · Harness ✅ · Certification ✅ (ADR 0083)
3. Delivery Capability Demo ◀ remaining for Delivery completeness
4. FLOW-002 Flow Demo ◀ next
5. OPERATIONAL-007 Billing (Architecture → Demo)
6. FLOW-003 · Engine v1.0 Architecture Frozen
7. Tenant Success / Beta 1 usability ([Time Savings Backlog](./TENANT_TIME_SAVINGS_BACKLOG.md))
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

Product Law: [PRODUCT_DIRECTION](./PRODUCT_DIRECTION.md) · ADR [0084](../adr/0084-product-law-001.md).
