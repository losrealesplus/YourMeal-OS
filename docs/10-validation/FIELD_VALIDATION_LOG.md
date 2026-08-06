# Field Validation Log

**Purpose:** Capture evidence from **real devices** during the Operational Validation Sprint.  
**Era:** Operational Engine v0.8 → Validation  
**Companions:** [FIELD_VALIDATION_MILESTONE](./FIELD_VALIDATION_MILESTONE.md) · [ANDROID_FIELD_VALIDATION_REPORT](./ANDROID_FIELD_VALIDATION_REPORT.md) · [OPERATIONAL_VALIDATION_SPRINT](../00-status/OPERATIONAL_VALIDATION_SPRINT.md)

From this phase onward, the most valuable evidence is **experience on device**, not additional architecture ADRs.

---

## How to use

1. Build APK / iOS from `main` after Engine v0.8 has landed.
2. Run the flow on a real device (OPPO first, then iPhone).
3. Add one row per session — even partial sessions.
4. Prefer UX and clarity notes over purely technical bugs.

**Result values:** `PASS` · `FAIL` · `PARTIAL` · `BLOCKED`

---

## Log

| Fecha | Dispositivo | Flujo | Resultado | Observaciones |
| ----- | ----------- | ----- | --------- | ------------- |
| 2026-08-06 | OPPO | Login → Post Login → authenticated surface (Ops) | PASS | After #340 (`return { user }`). Pre-fix: Missing auth context → "This page didn't load". Report: [ANDROID_FIELD_VALIDATION_REPORT](./ANDROID_FIELD_VALIDATION_REPORT.md) |
| — | iPhone | — | — | *FIELD-VALIDATION-002 pending* |

---

## Suggested flows (Validation Sprint)

| Flujo | Scope |
| ----- | ----- |
| Login → Identity | Auth / tenant context |
| Customer Workspace | Customer Capability Demo |
| Order Workspace | Order Capability Demo |
| Production Workspace | Production Capability Demo |
| Kitchen Workspace | Kitchen Capability Demo |
| FLOW-001 path | Login → Customer → Order → Production → Kitchen |

---

## Field questions (preferred over bug lists)

- ¿Entiendo qué hacer?
- ¿Los botones tienen sentido?
- ¿La navegación es natural?
- ¿El tiempo de carga molesta?
- ¿La identidad visual transmite confianza?
- ¿Hay clics innecesarios?

---

## Definition of valuable row

A useful entry answers: **what a real EatClean operator felt** while using the app — not only whether a test suite passed.
