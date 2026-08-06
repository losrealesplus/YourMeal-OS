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
| **001** | Bootstrap Architecture (Observe → Design → Freeze) | ▶ This PR |
| **002** | Authentication (stable identity entry) | ⏳ |
| **003** | Bootstrap Orchestrator implementation | ⏳ |
| **004** | Tenant Loading | ⏳ |
| **005** | Session | ⏳ |
| **006** | Navigation + Application Ready | ⏳ |
| **007** | Smoke Test (web + OPPO) | ⏳ |

Until Architecture is accepted, **no implementation** of the orchestrator.

> User plan shorthand: `001 Auth → 002 Bootstrap → …` maps to implementation after this architecture freeze. Architecture is the mandatory first gate (same methodology as Developer Platform).

---

## Architecture freeze

| Artifact | Path |
|----------|------|
| Pipeline contract | [BOOTSTRAP_PIPELINE.md](../05-architecture/BOOTSTRAP_PIPELINE.md) |
| ADR | [0050-bootstrap-pipeline.md](../adr/0050-bootstrap-pipeline.md) |

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
