# RELEASE-01-BETA · Acceptance checklist

**Documento:** `RELEASE_01_BETA_ACCEPTANCE.md`  
**Fecha:** 2026-08-03  
**Nivel:** B5 Beta Acceptance · composition only  
**Spec:** [RELEASE_01_BETA_SPEC](../../00-status/RELEASE_01_BETA_SPEC.md)  
**Runner:** [RELEASE_01_BETA_RUNNER](./RELEASE_01_BETA_RUNNER.md)

> Acceptance **compone** outcomes B1–B4 ya certificados.  
> No reabre Foundation · Flows · Platform · Deploy/Rollback.  
> No abre FLOW-05. Tag `release-01-beta` solo tras Land Check desde `main`.

---

## Checklist (mínimo)

```text
☑ B1 Foundation              → RELEASE_01_BETA_001_B1_ACTA · CERTIFIED desde main
☑ B2 Canonical Flows         → RELEASE_01_BETA_002_B2_ACTA · CERTIFIED desde main
☑ B3 Platform Capabilities   → RELEASE_01_BETA_003_B3_ACTA · CERTIFIED desde main
☑ B4 Release Stack           → RELEASE_01_BETA_004_B4_ACTA · CERTIFIED desde main
☑ Gate + Runner documents    → RELEASE_01_BETA_GATE · RELEASE_01_BETA_RUNNER
☐ Tag release-01-beta        → solo tras FULL PASS Land Check desde main
```

Tokens B5:

```text
RELEASE_01_BETA_B5_STARTED
RELEASE_01_BETA_B5_COMPLETED
```

---

## Fuera de alcance

- FLOW-05 · producción · semver `v*` · marketing readiness  
- Re-ejecución Smoke / Cross-flow / E2E / Deploy / Rollback  
- Nuevas capacidades de producto  

---

## End of RELEASE-01-BETA Acceptance checklist
