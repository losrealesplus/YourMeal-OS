# Operational Engine

**v0.8:** ✅ **DECLARED** — [OPERATIONAL_ENGINE_V08](./OPERATIONAL_ENGINE_V08.md) · ADR [0077](../adr/0077-operational-engine-v08.md)  
**v1.0 status:** Target milestone — not yet achieved (requires Delivery · Billing + flows)  
**Panel:** [OPERATIONAL_ENGINE_BOARD](./OPERATIONAL_ENGINE_BOARD.md) · [CAPABILITY_REGISTRY](./CAPABILITY_REGISTRY.md) · [OPERATIONAL_FLOW_REGISTRY](./OPERATIONAL_FLOW_REGISTRY.md)

---

## Official declaration (v0.8)

```text
Operational Engine v0.8 is frozen.

The certified operational core exists:
Identity → Customer → Orders → Production → Kitchen
+ FLOW-001

Not complete.
Complete enough to validate on real devices.

Era: Validation — not more architecture.
```

---

## Progress

```text
Identity           ██████████████████████  Engineering Certified
Customers          ██████████████████████  Engineering Certified + Demo
Orders             ██████████████████████  Engineering Certified + Demo
Production         ██████████████████████  Engineering Certified + Demo
Kitchen Execution  ██████████████████████  Engineering Certified + Demo
FLOW-001           ██████████████████████  Engineering Certified
Delivery           ░░░░░░░░░░░░░░░░░░░░░░  GATED
Billing            ░░░░░░░░░░░░░░░░░░░░░░  GATED
```

---

## Engine Completion

```text
Context                 ████████████████
Business Entity         ████████████████
Operational Planning    ████████████████
Operational Execution   ████████████░░░░  (Kitchen · Delivery gated)
Operational Outcome     ░░░░░░░░░░░░░░░░
```

---

## Certification phases

```text
PHASE A · Capability Certification     ████████████████  COMPLETE
PHASE B · Operational Flow Validation  ████████████░░░░  FLOW-001 Certified · Demo next
PHASE C · Real Tenant Validation       ░░░░░░░░░░░░░░░░
```

---

## Immediate roadmap (do not reorder)

```text
FLOW Demo → Engine Review → Android → OPPO → iPhone
→ Real Tenant Validation → Delivery
```

See [OPERATIONAL_ENGINE_REVIEW](./OPERATIONAL_ENGINE_REVIEW.md).

---

## Declaration rules

| Declaration | When |
|-------------|------|
| **Engine exists** | Planning certified (historic) |
| **Engine v0.8** | Identity→Kitchen + FLOW-001 Engineering Certified (✅ now) |
| **Engine v1.0** | Full chain through Billing + flows certified · FAIL = 0 |
