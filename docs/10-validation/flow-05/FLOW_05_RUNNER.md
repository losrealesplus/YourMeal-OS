# FLOW-05 · Canonical Runner

**Documento:** `FLOW_05_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **ACTIVE** · CERTIFIED_THROUGH = 0 · BLOCKED at B1 · Spec ✅ FROZEN  
**Spec:** [FLOW_05_SPEC](../../00-status/FLOW_05_SPEC.md) **FROZEN**  
**DoR:** [FLOW_05_CUSTOMER_EXPERIENCE_DOR](../../00-status/FLOW_05_CUSTOMER_EXPERIENCE_DOR.md)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)

> Pregunta que responde este PR:  
> **¿Existe un contrato ejecutable para FLOW-05?**  
> No: ¿Registro? · ¿Pedido? · ¿Capacitor? · ¿EatClean-only?

FLOW-05 certifica el **recorrido completo del cliente** (tenant-agnostic).  
EatClean será la primera implementación — no el contrato.

---

## Contrato

```text
FLOW-05
FLOW05_B1_STARTED      → Registration
    ↓
FLOW05_B1_COMPLETED
    ↓
FLOW05_B2_STARTED      → Authentication
    ↓
FLOW05_B2_COMPLETED
    ↓
FLOW05_B3_STARTED      → Order Creation
    ↓
FLOW05_B3_COMPLETED
    ↓
FLOW05_B4_STARTED      → Production
    ↓
FLOW05_B4_COMPLETED
    ↓
FLOW05_B5_STARTED      → Route Planning
    ↓
FLOW05_B5_COMPLETED
    ↓
FLOW05_B6_STARTED      → Delivery
    ↓
FLOW05_B6_COMPLETED
    ↓
FLOW05_B7_STARTED      → Delivery Confirmation
    ↓
FLOW05_B7_COMPLETED
    ↓
FLOW05_B8_STARTED      → History
    ↓
FLOW05_B8_COMPLETED
    ↓
PASS → tag flow05-pass (futuro)
```

`CERTIFIED_THROUGH = 0` — ningún bloque ejecutado. Solo institucionaliza el contrato.

---

## Comandos

```bash
npm run test:flow-05
# → BLOCKED at FLOW05_B1_STARTED · exit 2

npm run test:flow-05:runner-only
# → BLOCKED at FLOW05_B1_STARTED · exit 2 · evidence={}

npm run test:flow-05:unit
```

Resultado esperado (ambos):

```text
FLOW-05

BLOCKED

blocked_at=FLOW05_B1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

Exit code: **2** (BLOCKED).  
JSON: `docs/10-validation/flow-05/evidence/flow-05-canonical.json`

**BLOCKED ≠ FAIL** — todavía no hay drivers B1–B8.

---

## Fuera de alcance (este PR)

- Gate · FLOW05-001…008  
- Drivers B1–B8 · lógica de negocio  
- Capacitor · App Store · Google Play  
- Billing · Inventory · Incidents (Flows 02–04)  
- Acoplar el contrato a EatClean  

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| CLI | `scripts/flow-05-canonical.mjs` |
| Pipeline | `scripts/lib/flow-05-canonical-pipeline.mjs` |
| Capability driver | `scripts/lib/flow-05-capability-driver.mjs` (stub · CERTIFIED_THROUGH=0) |
| Unit | `scripts/lib/flow-05-canonical-pipeline.spec.mjs` |
| Runner-only evidence | `docs/10-validation/flow-05/evidence/flow-05-canonical.json` |

---

## Land Check (from this PR / after merge)

```bash
git restore docs/10-validation/flow-05/evidence/ 2>/dev/null || true
git pull origin main
git fetch --tags --prune
npm run test:flow-05
# → BLOCKED at FLOW05_B1_STARTED · exit 2
npm run test:flow-05:runner-only
# → same
```

Next after Runner Land Check: **FLOW-05 Gate** (NOT READY hasta BLOCKED verificado desde `main`) → luego FLOW05-001 (B1 only).

---

## End of FLOW-05 Runner
