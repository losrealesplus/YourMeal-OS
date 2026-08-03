# FLOW-05 · Canonical Runner

**Documento:** `FLOW_05_RUNNER.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ Runner **CERTIFIED** · CERTIFIED_THROUGH = **1** (B1) · BLOCKED at B2 · Gate ✅  
**Spec:** [FLOW_05_SPEC](../../00-status/FLOW_05_SPEC.md) **FROZEN**  
**DoR:** [FLOW_05_CUSTOMER_EXPERIENCE_DOR](../../00-status/FLOW_05_CUSTOMER_EXPERIENCE_DOR.md)  
**Gate:** [FLOW_05_GATE](./FLOW_05_GATE.md)  
**Acta:** [FLOW05_001_B1_ACTA](./FLOW05_001_B1_ACTA.md)  
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
FLOW05_B2_STARTED      → Authentication        ⏳ next
    ↓
…
FLOW05_B8_COMPLETED
    ↓
PASS → tag flow05-pass (futuro)
```

`CERTIFIED_THROUGH = 1` — B1 Registration PASS · full journey BLOCKED at B2.

---

## Comandos

```bash
npm run test:flow05-001
# → PASS through B1 · blocked_at=FLOW05_B2_STARTED · exit 0

npm run test:flow-05
# → PASS through B1 · blocked_at=FLOW05_B2_STARTED · exit 0

npm run test:flow-05:runner-only
# → BLOCKED at FLOW05_B1_STARTED · exit 2 · evidence={}

npm run test:flow-05:unit
```

Resultado esperado (`test:flow05-001` / `test:flow-05`):

```text
PASS through B1 · BLOCKED at FLOW05_B2_STARTED for full FLOW-05
certified_through=B1 · blocked_at=FLOW05_B2_STARTED
```

Exit code: **0** (delivery PASS).  
JSON: `docs/10-validation/flow-05/evidence/flow-05-001-canonical-live.json`  
Aggregate: `docs/10-validation/flow-05/evidence/flow-05-canonical-live.json`

Runner-only (contrato vacío, sin drivers):

```text
BLOCKED
blocked_at=FLOW05_B1_STARTED
duplicates=[] missing=[] out_of_order=[] evidence={}
```

Exit code: **2** (BLOCKED).

---

## Fuera de alcance (FLOW05-001)

- B2 Login · JWT · sesión · dashboard  
- B3…B8 · pedidos · producción · rutas · entregas · historial  
- Capacitor · App Store · Google Play  
- UX avanzada · negocio EatClean-only  

---

## Evidencia

| Artefacto | Path |
|-----------|------|
| CLI | `scripts/flow-05-canonical.mjs` · `CERTIFIED_THROUGH=1` |
| Pipeline | `scripts/lib/flow-05-canonical-pipeline.mjs` |
| B1 driver | `scripts/lib/flow-05-b1-registration.mjs` |
| Capability driver | `scripts/lib/flow-05-capability-driver.mjs` |
| Unit | `scripts/lib/flow-05-*-*.spec.mjs` |
| Live 001 | `docs/10-validation/flow-05/evidence/flow-05-001-canonical-live.json` |
| Live aggregate | `docs/10-validation/flow-05/evidence/flow-05-canonical-live.json` |
| Runner-only | `docs/10-validation/flow-05/evidence/flow-05-canonical.json` |

---

## Land Check (after merge to `main`)

```bash
git restore docs/10-validation/flow-05/evidence/ 2>/dev/null || true
git pull origin main
git fetch --tags --prune
npm run test:flow05-001
# → PASS through B1 · blocked_at=FLOW05_B2_STARTED · exit 0
npm run test:flow-05
# → same
npm run test:flow-05:runner-only
# → BLOCKED at FLOW05_B1_STARTED · exit 2
```

Next after Land Check: **FLOW05-002 · B2 Authentication** only.

---

## End of FLOW-05 Runner
