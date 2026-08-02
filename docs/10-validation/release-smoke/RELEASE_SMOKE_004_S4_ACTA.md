# RELEASE-SMOKE · 004 · S4 Dashboard · ACTA

**Documento:** `RELEASE_SMOKE_004_S4_ACTA.md`  
**Fecha:** 2026-08-02  
**Estado:** ✅ **PASS through S4** · RELEASE-SMOKE **FULL PASS** · `blocked_at=—`  
**Precondición:** RELEASE-SMOKE-003 certificado desde `main` (#176 · `2c821c0`)  
**Gate:** [RELEASE_SMOKE_GATE](./RELEASE_SMOKE_GATE.md)  
**Spec:** [RELEASE_SMOKE_SPEC](../../00-status/RELEASE_SMOKE_SPEC.md)  
**Comando:** `npm run test:release-smoke-004`  
**Principio:** [FOPEBA_LAND_CHECK](../../00-status/FOPEBA_LAND_CHECK.md)

---

## Pregunta

> ¿La superficie operativa canónica renderiza sin error duro?

Capacidad: **dashboard** (plataforma).  
Handoff desde S3: `ROLE_READY` → Dashboard bootstrap.  
Mapeo PS-002-C / FCR-008:

```text
HOME_PATH_RESOLVED → NAVIGATE → DASHBOARD_RENDERED
```

(`DASHBOARD_RENDERED` = dashboard ready en el contrato Spec.)

Sin Cross-flow · sin Playwright E2E completo · sin Deploy · sin Rollback · sin `release-01-beta`.

---

## Resultado

```text
RELEASE-SMOKE-004
PASS through S4
certified_through=S4
blocked_at=—
duplicates=[]
missing=[]
out_of_order=[]
exit 0
```

Canonical:

```text
npm run test:release-smoke
RELEASE-SMOKE
FULL PASS
certified_through=S4
blocked_at=—
exit 0
```

### Tokens emitidos

```text
RELEASE_SMOKE_S1_STARTED
RELEASE_SMOKE_S1_COMPLETED
RELEASE_SMOKE_S2_STARTED
RELEASE_SMOKE_S2_COMPLETED
RELEASE_SMOKE_S3_STARTED
RELEASE_SMOKE_S3_COMPLETED
RELEASE_SMOKE_S4_STARTED
RELEASE_SMOKE_S4_COMPLETED
```

### Checks S4

- Script `test:ps002-canonical-auth` presente  
- `ROLE_READY` precede al segmento Dashboard  
- Segmento FCR-008 dashboard intacto (`HOME_PATH_RESOLVED` → `DASHBOARD_RENDERED`)  
- Tag `ps002c-pass` presente  
- `src/auth/post-login-pipeline.ts` emite tokens dashboard  
- Superficie home path (`src/lib/resolve-home-path.ts`)  
- Superficie dashboard / navigate en routes  

Fuente: `ps002c-pass + FCR-008 dashboard segment (no Cross-flow / no full Playwright E2E)`.

### Fuera de alcance

- Cross-flow · E2E · Deploy · Rollback  
- Tag `release-01-beta`  
- FLOW-05  

---

## Evidencia

`docs/10-validation/release-smoke/evidence/release-smoke-004-canonical-live.json`

---

## Next

```text
B-01 Smoke FULL PASS → preparar tag release-smoke-pass (tras Land Check)
luego Track B · B-02 Cross-flow (DoR → Spec → Freeze → Runner → Gate → …)
```

---

## End of RELEASE-SMOKE-004 Acta
