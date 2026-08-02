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
| **Release** | `release-*` o `v*` semver | `release-01-beta` · `release-v0.2.0` · `v0.2.0` | Producto como conjunto (beta / semver) |

No cambia la metodología FOPEBA / Evidence before Implementation.  
Hace legible el historial: **técnica** vs **dominio** vs **producto**.

Gate de producto (aún DRAFT): [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md) · [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md) (DoRl) → tag `release-01-beta` solo tras **DoRl PASS**.

---

## Tags actuales (canónicos)

| Tag | Tipo | Commit / significado |
|-----|------|----------------------|
| `ps002c-pass` | Platform | PS-002-C PASS · FCR-008 · Platform Stabilization Flow-ready |
| `flow01-pass` | Flow | FLOW-01 Kitchen → Delivery FULL PASS |
| `flow02-pass` | Flow | FLOW-02 Delivery Incidents FULL PASS → `a1e8d1e` (#153) |
| `flow03-pass` | Flow | FLOW-03 Billing FULL PASS → `67a2e66` (#160) |
| `flow04-pass` | Flow | FLOW-04 Inventory Consumption FULL PASS (FLOW04-003) |

---

## Cuándo crear un tag

| Evento | Tag |
|--------|-----|
| Gate de plataforma cerrado con evidencia (PS / FCR) | `platform-*` o hito nombrado (`ps002c-pass`) |
| Flow runner `--live` = PASS completo + acta | `flowNN-pass` |
| RELEASE-01 beta gate PASS (flows críticos + E2E) | `release-01-beta` (ver [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md)) |
| Release desplegable / semver de producto | `release-vX.Y.Z` o `vX.Y.Z` |

Reglas:

- Preferir **annotated tags** con mensaje que apunte al acta.  
- No force-push / no reescribir tags ya publicados (Lovable / historial compartido).  
- Un Flow parcial (PASS through Tn · BLOCKED) **no** genera tag `flowNN-pass`.

---

## Relación con Definition of Ready

El tag `flowNN-pass` solo existe **después** de:

```text
DoR → Spec freeze → Runner → Impl. T1…Tn → PASS completo → Acta
```

Ver: [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md).
