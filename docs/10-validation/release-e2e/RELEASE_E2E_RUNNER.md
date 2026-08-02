# RELEASE-01 · B-03 · E2E · Canonical Runner

**Documento:** `RELEASE_E2E_RUNNER.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ Runner **CERTIFIED** · live through E1 · runner-only **BLOCKED** at E1  
**Spec:** [RELEASE_E2E_SPEC](../../00-status/RELEASE_E2E_SPEC.md) (FROZEN · #186 · `6d11ae8`)  
**DoR:** [RELEASE_E2E_DOR](../../00-status/RELEASE_E2E_DOR.md)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Nivel:** Release gate — pilot journey · **not** a Flow · **not** Smoke · **not** Cross-flow

> Pregunta que responde este PR:  
> **¿Existe un contrato ejecutable para RELEASE-E2E (RELEASE-01 · B-03)?**  
> No: ¿Playwright? · ¿browser? · ¿dominio E1? · ¿Deploy? · ¿FLOW-05?

---

## Regla de nivel

| Nivel | Certifica |
|-------|-----------|
| **FLOW** | Estados / transiciones de un dominio |
| **RELEASE-SMOKE** | Capacidades de plataforma |
| **RELEASE-CROSSFLOW** | Handoffs encadenados entre Flows |
| **RELEASE-E2E** | Jornada piloto de la plataforma como un todo |

E2E **complementa** Smoke y Cross-flow; **no los sustituye**.

---

## Contrato

```text
RELEASE-E2E
RELEASE_E2E_E1_STARTED      → Platform Entry (Smoke)
    ↓
RELEASE_E2E_E1_COMPLETED
    ↓
RELEASE_E2E_E2_STARTED      → Order → Delivery (FLOW-01 / C1)
    ↓
RELEASE_E2E_E2_COMPLETED
    ↓
RELEASE_E2E_E3_STARTED      → Incident → Billing (FLOW-02…03 / C2…C3)
    ↓
RELEASE_E2E_E3_COMPLETED
    ↓
RELEASE_E2E_E4_STARTED      → Inventory → Close (FLOW-04 / C4)
    ↓
RELEASE_E2E_E4_COMPLETED
    ↓
PASS → tag release-e2e-pass
```

---

## Comandos

```bash
# Default live through max certified (E1)
npm run test:release-e2e
# → PASS through E1 · BLOCKED at E2 · exit 0

# RELEASE-E2E-001 · E1 only
npm run test:release-e2e-001
# → PASS through E1 · BLOCKED at E2 · exit 0

# Historic Gate / Land Check vacío
npm run test:release-e2e:runner-only
# → BLOCKED at RELEASE_E2E_E1_STARTED · exit 2 · evidence={}

# Unit tests (pipeline + E1 · no Playwright suite)
npm run test:release-e2e:unit
```

**BLOCKED (runner-only) no es defecto.**

---

## Fuera de alcance (hasta E1+)

- Driver E2…E4 · Playwright E2E suite  
- Deploy · Rollback · FLOW-05 · `release-01-beta`  

---

## Gate

Ver: [RELEASE_E2E_GATE](./RELEASE_E2E_GATE.md) · Decision: ✅ READY · 001 en curso.

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| CLI | `scripts/release-e2e-canonical.mjs` |
| Pipeline | `scripts/lib/release-e2e-canonical-pipeline.mjs` |
| Default evidence | `docs/10-validation/release-e2e/evidence/release-e2e-canonical.json` |

---

## End of RELEASE E2E Runner
