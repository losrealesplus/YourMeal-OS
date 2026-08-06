# Application Ready Gate

**PRODUCT-CORE-004**  
**ADR:** [0053](../adr/0053-application-ready-gate.md)  
**Code:** `src/bootstrap/ready/`

---

## Purpose

Single lifecycle latch for YourMeal OS Product Core.

```text
App → Bootstrap → Ready → Workspace
```

Not a loading feature. Not a splash redesign. **Infrastructure.**

---

## States

```text
NOT_STARTED
      ↓
BOOTSTRAPPING
      ↓
 AUTH_REQUIRED  |  READY  |  FAILED
```

| State | Meaning | Product Core? |
|-------|---------|---------------|
| `NOT_STARTED` | No bootstrap result yet | No |
| `BOOTSTRAPPING` | Pipeline / identity loading | No |
| `AUTH_REQUIRED` | Anonymous — auth/landing OK | No |
| `READY` | Bootstrap ready **or** identity snapshot ready | **Yes** |
| `FAILED` | Blocking stage failed | No (existing error flows) |

---

## Single decision point

```text
src/bootstrap/ready/deriveApplicationReady.ts
  → isApplicationReady()
  → deriveApplicationReadySnapshot()
```

Every route / workspace / feature must use this answer (via hook or `ensureApplicationReady`).

---

## Wiring

| Surface | Behaviour |
|---------|-----------|
| `ApplicationReadyGate` in `__root` | Context + lifecycle events; children always render (no new UI) |
| `/_authenticated` `beforeLoad` | `requireAuthenticatedUser` then `ensureApplicationReady()` |
| Public `/`, `/auth`, … | Ungated |

---

## Events (Doctor observe-only)

```text
application:not_started
application:bootstrapping
application:auth_required
application:ready
application:failed
```

---

## Lifecycle stack (complete)

```text
PRODUCT-CORE-001  Architecture     ✅
PRODUCT-CORE-002  Orchestrator     ✅
PRODUCT-CORE-003  Ownership        ✅
PRODUCT-CORE-004  Ready Gate       ✅ / in PR
```

Next: doctor → build → APK → OPPO smoke → **Product Core Foundation**.
