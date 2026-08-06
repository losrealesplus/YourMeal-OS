# PRODUCT-CORE-001

**Track:** Product Core Stabilization  
**Started:** 2026-08-06  
**Priority:** EatClean daily confidence — Developer Platform observes, Product Core stabilizes.

```text
Developer Platform v1.0      ✅ Frozen
Infrastructure               ✅ Complete (HOUSEKEEPING-001…003)
──────────────────────────────────────
PRODUCT-CORE-001             ▶ ACTIVE
```

---

## Goal (Sprint 1)

> Que la aplicación pueda arrancar correctamente, identificar al usuario, cargar el tenant y dejarlo listo para trabajar.

Un solo Happy Path. No veinte pantallas.

---

## Blocks

| Block | Focus | Status |
|-------|--------|--------|
| **001** | Bootstrap Architecture (Observe → Design → Freeze) | ✅ ADR 0050 · on `main` |
| **002** | Bootstrap Orchestrator (order only) | ✅ ADR 0051 · on `main` |
| **003** | Stage Ownership Migration | ✅ ADR 0052 · on `main` |
| **004** | Application Ready Gate | ✅ ADR 0053 · on `main` |
| **FOUNDATION-001** | Validation (Doctor → APK) | ▶ [PRODUCT_CORE_FOUNDATION_001](./PRODUCT_CORE_FOUNDATION_001.md) · ADR 0054 |

---

## Architecture freeze

| Artifact | Path |
|----------|------|
| Pipeline contract | [BOOTSTRAP_PIPELINE.md](../05-architecture/BOOTSTRAP_PIPELINE.md) |
| ADR (contract) | [0050-bootstrap-pipeline.md](../adr/0050-bootstrap-pipeline.md) |
| ADR (orchestrator) | [0051-bootstrap-orchestrator.md](../adr/0051-bootstrap-orchestrator.md) |
| ADR (ownership) | [0052-stage-ownership.md](../adr/0052-stage-ownership.md) |
| Ownership matrix | [BOOTSTRAP_OWNERSHIP.md](../05-architecture/BOOTSTRAP_OWNERSHIP.md) |
| Ready Gate | [APPLICATION_READY_GATE.md](../05-architecture/APPLICATION_READY_GATE.md) · ADR 0053 |
| Code | `src/bootstrap/pipeline/` · `src/bootstrap/ready/` |

Canonical flow:

```text
App Launch → Environment → Services → Authentication
→ Session → Tenant → Branding → Navigation → Ready
```

---

## Rules

1. One objective per block.  
2. No skipping.  
3. Document before code.  
4. Do not modify frozen Developer Platform engines.  
5. Each PR must leave the project better than before.

---

## After Architecture lands

```text
pull main
→ npm run doctor / doctor:env
→ implement Orchestrator (next block)
→ build:mobile → APK → OPPO smoke
→ continue Auth/Session/Tenant/Navigation until Ready is deterministic
```
