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
| **001** | Bootstrap Architecture (Observe → Design → Freeze) | ✅ ADR 0050 |
| **002** | Bootstrap Orchestrator (order only) | ▶ ADR 0051 |
| **003** | Session / Tenant stage ownership (delegate → own) | ⏳ |
| **004** | Branding stage (still NON-BLOCKING) | ⏳ |
| **005** | Navigation + Application Ready UI gate | ⏳ |
| **006** | Smoke Test (web + OPPO) | ⏳ |

---

## Architecture freeze

| Artifact | Path |
|----------|------|
| Pipeline contract | [BOOTSTRAP_PIPELINE.md](../05-architecture/BOOTSTRAP_PIPELINE.md) |
| ADR (contract) | [0050-bootstrap-pipeline.md](../adr/0050-bootstrap-pipeline.md) |
| ADR (orchestrator) | [0051-bootstrap-orchestrator.md](../adr/0051-bootstrap-orchestrator.md) |
| Code | `src/bootstrap/pipeline/` · sequence: `BootstrapPipeline.ts` |

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
