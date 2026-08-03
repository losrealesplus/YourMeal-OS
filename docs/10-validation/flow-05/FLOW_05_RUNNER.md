# FLOW-05 · Canonical Runner

**Documento:** `FLOW_05_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **CERTIFIED** · CERTIFIED_THROUGH = **2** (B2) · BLOCKED at B3 · Gate ✅  
**Spec:** [FLOW_05_SPEC](../../00-status/FLOW_05_SPEC.md) **FROZEN**  
**DoR:** [FLOW_05_CUSTOMER_EXPERIENCE_DOR](../../00-status/FLOW_05_CUSTOMER_EXPERIENCE_DOR.md)  
**Gate:** [FLOW_05_GATE](./FLOW_05_GATE.md)  
**Actas:** [001 B1](./FLOW05_001_B1_ACTA.md) · [002 B2](./FLOW05_002_B2_ACTA.md)  
**Principio:** [Evidence before Implementation](../../00-status/EVIDENCE_BEFORE_IMPLEMENTATION.md)

> FLOW-05 certifica el **recorrido completo del cliente** (tenant-agnostic).  
> EatClean será la primera implementación — no el contrato.

---

## Contrato

```text
FLOW-05
FLOW05_B1_STARTED      → Registration          ✅ CERTIFIED (FLOW05-001)
    ↓
FLOW05_B1_COMPLETED
    ↓
FLOW05_B2_STARTED      → Authentication        ✅ CERTIFIED (FLOW05-002)
    ↓
FLOW05_B2_COMPLETED
    ↓
FLOW05_B3_STARTED      → Order Creation        ⏳ next
    ↓
…
FLOW05_B8_COMPLETED
    ↓
PASS → tag flow05-pass (futuro)
```

`CERTIFIED_THROUGH = 2` — B1+B2 PASS · full journey BLOCKED at B3.

---

## Comandos

```bash
npm run test:flow05-002
# → PASS through B2 · blocked_at=FLOW05_B3_STARTED · exit 0

npm run test:flow-05
# → PASS through B2 · blocked_at=FLOW05_B3_STARTED · exit 0

npm run test:flow05-001
# → PASS through B1 · blocked_at=FLOW05_B2_STARTED · exit 0

npm run test:flow-05:runner-only
# → BLOCKED at FLOW05_B1_STARTED · exit 2 · evidence={}

npm run test:flow-05:unit
```

Resultado esperado (`test:flow05-002` / `test:flow-05`):

```text
PASS through B2 · BLOCKED at FLOW05_B3_STARTED for full FLOW-05
certified_through=B2 · blocked_at=FLOW05_B3_STARTED
```

Exit code: **0** (delivery PASS).  
JSON: `docs/10-validation/flow-05/evidence/flow-05-002-canonical-live.json`  
Aggregate: `docs/10-validation/flow-05/evidence/flow-05-canonical-live.json`

Runner-only (contrato vacío, sin drivers):

```text
BLOCKED
blocked_at=FLOW05_B1_STARTED
duplicates=[] missing=[] out_of_order=[] evidence={}
```

Exit code: **2** (BLOCKED).

---

## Fuera de alcance (FLOW05-002)

- B3 Order Creation · pedidos · menú como END de negocio  
- B4…B8 · producción · rutas · entregas · historial  
- Capacitor · App Store · Google Play  
- UX avanzada · negocio EatClean-only  

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| CLI | `scripts/flow-05-canonical.mjs` · `CERTIFIED_THROUGH=2` |
| Pipeline | `scripts/lib/flow-05-canonical-pipeline.mjs` |
| B1 driver | `scripts/lib/flow-05-b1-registration.mjs` |
| B2 driver | `scripts/lib/flow-05-b2-authentication.mjs` |
| Capability driver | `scripts/lib/flow-05-capability-driver.mjs` |
| Live 002 | `docs/10-validation/flow-05/evidence/flow-05-002-canonical-live.json` |
| Live aggregate | `docs/10-validation/flow-05/evidence/flow-05-canonical-live.json` |
| Runner-only | `docs/10-validation/flow-05/evidence/flow-05-canonical.json` |

---

## Land Check (after merge to `main`)

```bash
git restore docs/10-validation/flow-05/evidence/ 2>/dev/null || true
git pull origin main
git fetch --tags --prune
npm run test:flow05-002
# → PASS through B2 · blocked_at=FLOW05_B3_STARTED · exit 0
npm run test:flow-05
# → same
npm run test:flow-05:runner-only
# → BLOCKED at FLOW05_B1_STARTED · exit 2
```

Next after Land Check: **FLOW05-003 · B3 Order Creation** only.

---

## End of FLOW-05 Runner
