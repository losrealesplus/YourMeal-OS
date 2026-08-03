# Git milestone tags

**Documento:** `GIT_MILESTONE_TAGS.md`  
**Fecha:** 2026-08-02  
**Status:** ACTIVE  
**Propósito:** Distinguir en el historial certificaciones de plataforma, flujos de dominio y releases de producto.

---

## Taxonomía

| Tipo | Prefijo | Ejemplo | Propósito |
|------|---------|---------|-----------|
| **Platform** | `platform-*` o hitos Auth/PS | `ps002c-pass` · futuro `platform-stable` | Infraestructura, Auth, bootstrap, estabilización |
| **Flow** | `flow*` / `flowNN-pass` | `flow01-pass` · `flow02-pass` | Flujos de negocio completamente certificados (PASS completo del runner) |
| **Release gate** | `release-<gate>-pass` | `release-smoke-pass` · `release-crossflow-pass` | Gates DoRl de RELEASE-01 (mismo patrón `-pass` que Flows) |
| **Release** | `release-01-beta` / `release-01-pass` / `v*` | `release-01-beta` · `release-01-pass` · `release-v0.2.0` | Framework beta · producto SaaS · semver |
| **Distribution** | `capacitor-pass` | `capacitor-pass` | Shell nativo Web→Android/iOS · Distribution Certified |

No cambia la metodología FOPEBA / Evidence before Implementation.  
Hace legible el historial: **técnica** vs **dominio** vs **gates de producto** vs **release** vs **distribution**.

Cadena RELEASE-01 (certificada):

```text
release-smoke-pass
release-crossflow-pass
release-e2e-pass
release-deploy-pass
release-rollback-pass
        ↓
release-01-beta          (framework de validación)
        ↓
release-01-pass          (producto SaaS certificado)
```

Gate de producto: [RELEASE_01_STRATEGY](./RELEASE_01_STRATEGY.md) · [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md) (DoRl).  
Tag `release-01-beta` = pipeline Track B cerrado.  
Tag `release-01-pass` = bloques P1–P5 CERTIFIED · Gate CLOSED.

---

## Tags actuales (canónicos)

| Tag | Tipo | Commit / significado |
|-----|------|----------------------|
| `ps002c-pass` | Platform | PS-002-C PASS · FCR-008 · Platform Stabilization Flow-ready |
| `flow01-pass` | Flow | FLOW-01 Kitchen → Delivery FULL PASS |
| `flow02-pass` | Flow | FLOW-02 Delivery Incidents FULL PASS → `a1e8d1e` (#153) |
| `flow03-pass` | Flow | FLOW-03 Billing FULL PASS → `67a2e66` (#160) |
| `flow04-pass` | Flow | FLOW-04 Inventory Consumption FULL PASS → `8be1c26` (#167) |
| `flow05-pass` | Flow | FLOW-05 Customer Experience Lifecycle FULL PASS (B1–B8) · [PASS](../10-validation/flow-05/FLOW_05_PASS_ACTA.md) |
| `release-smoke-pass` | Release gate | RELEASE-SMOKE FULL PASS (S1–S4) → `370628a` (#177) |
| `release-crossflow-pass` | Release gate | RELEASE-CROSSFLOW FULL PASS (C1–C4) → `0a0c51b` (#184) |
| `release-e2e-pass` | Release gate | RELEASE-E2E FULL PASS (E1–E4) → `73623ae` (#196) · [PASS](../10-validation/release-e2e/RELEASE_E2E_PASS_ACTA.md) |
| `release-deploy-pass` | Release gate | RELEASE-DEPLOY FULL PASS (D1–D3) → `7896a2a` (#206) · [PASS](../10-validation/release-deploy/RELEASE_DEPLOY_PASS_ACTA.md) |
| `release-rollback-pass` | Release gate | ✅ → `0ba856e` · [PASS](../10-validation/release-rollback/RELEASE_ROLLBACK_PASS_ACTA.md) |
| `release-01-beta` | Release | ✅ → `facb917` · [PASS](../10-validation/release-01-beta/RELEASE_01_BETA_PASS_ACTA.md) |
| `release-01-pass` | Release | ✅ → `8e91a49` · [PASS](../10-validation/release-01/RELEASE_01_PASS_ACTA.md) |
| `capacitor-pass` | Distribution | ✅ → `400a010` (#256) · C1–C5 FULL PASS · [PASS](../10-validation/capacitor/CAPACITOR_PASS_ACTA.md) |

---

## Cuándo crear un tag

| Evento | Tag |
|--------|-----|
| Gate de plataforma cerrado con evidencia (PS / FCR) | `platform-*` o hito nombrado (`ps002c-pass`) |
| Flow runner `--live` = PASS completo + acta | `flowNN-pass` |
| Gate DoRl RELEASE-01 PASS (Smoke / Cross-flow / …) | `release-<gate>-pass` (p. ej. `release-smoke-pass`) |
| RELEASE-01 DoRl PASS (todos los gates aplicables) | ✅ `release-01-beta` → `facb917` · Gate CLOSED · B1–B5 CERTIFIED |
| RELEASE-01 Product PASS (P1–P5) | ✅ `release-01-pass` → `8e91a49` · Gate CLOSED · P1–P5 CERTIFIED |
| Capacitor Distribution PASS (C1–C5) | ✅ `capacitor-pass` → `400a010` · Gate CLOSED · Distribution Certified |
| Release desplegable / semver de producto | `release-vX.Y.Z` o `vX.Y.Z` |

Reglas:

- Preferir **annotated tags** con mensaje que apunte al acta.  
- No force-push / no reescribir tags ya publicados (Lovable / historial compartido), salvo corrección inmediata de un tag mal apuntado tras Land Check (p. ej. `capacitor-pass` retarget a merge C5).  
- Un Flow parcial (PASS through Tn · BLOCKED) **no** genera tag `flowNN-pass`.
- **Native Tool Artifacts** pendientes → no tag / no Land Check (FOUNDATION.md).

---

## Relación con Definition of Ready

El tag `flowNN-pass` solo existe **después** de:

```text
DoR → Spec freeze → Runner → Impl. T1…Tn → PASS completo → Acta
```

Ver: [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md).
