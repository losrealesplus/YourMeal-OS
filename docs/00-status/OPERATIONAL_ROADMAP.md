# Operational Roadmap

**Permanent control panel · updated 2026-08-06 with ADR [0076](../adr/0076-operational-flow-001-engineering-certification.md)**  
**Companions:** [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md) · [OPERATIONAL_ENGINE_REVIEW](./OPERATIONAL_ENGINE_REVIEW.md) · [OPERATIONAL_FLOW_REGISTRY](./OPERATIONAL_FLOW_REGISTRY.md)

---

## Certification phases

```text
PHASE A · Capability Certification
████████████████████
COMPLETE

↓

PHASE B · Operational Flow Validation
████████████░░░░░░░
FLOW-001 Certified · Demo next

↓

PHASE C · Real Tenant Validation
░░░░░░░░░░░░░░░░░░░
```

---

## Near-term sequence (frozen)

```text
1. FLOW-001 Flow Demo                         ⏳
2. Roadmap Review / Operational Engine v0.8   ⏳
3. Android Build → APK                        ⏳
4. OPPO Field Validation                      ⏳
5. iPhone Build + Field Validation            ⏳
6. Only then: Delivery / FLOW-002             🔒 GATED
```

**No Delivery until** Demo · Roadmap Review · Android · OPPO · iPhone are complete.

---

## FLOW-001 track

```text
Architecture (ADR 0074)              ✅
Harness (ADR 0075)                   ✅
Engineering Certification (ADR 0076) ✅ 12 PASS · 0 FAIL
Flow Demo                            ← next
```

---

## Phase B · Operational Flows

| Flow | Chain | Status |
|------|-------|--------|
| **FLOW-001** | Orders → Production → Kitchen | **Engineering Certified** |
| **FLOW-002** | Production → Kitchen → Delivery | **GATED** |
| **FLOW-003** | Delivery → Billing | **GATED** |

---

## Success question

> **¿Qué capacidades están certificadas y qué flujos operativos colaboran sin romper las Foundation Laws — y qué experiencia de campo confirma el Engine antes de abrir Delivery?**
