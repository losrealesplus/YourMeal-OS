# Documentation Findings (DF) · Impossible Findings (IFD)

Evidencia de **IOV-001**. Protocolo: [05](../05-experimental-protocol.md).

---

## Índice

| ID | Título | Tipo | Severidad | Classification | Estado |
|----|--------|------|-----------|----------------|--------|
| DF-001 | Quién places Order B2B | Ambiguity | Medium | Docs | ⏳ |
| DF-002 | Transiciones Payment incompletas | Gap | High | Docs | ⏳ |
| DF-003 | Semana Order → Plan del día | Implicit | Medium | Docs | ⏳ |
| DF-004 | produces vs packages into | Ambiguity | Low | Docs | ⏳ |
| DF-005 | Delivery Pending → Attempted | Gap | Medium | Docs | ⏳ |
| DF-006 | Cross-link finance ↔ Settle | Missing cross-link | Medium | Docs | ⏳ |
| DF-007 | Cardinalidad Plan día/semana | Ambiguity | Low | Docs | ⏳ |
| DF-008 | Navegación Happy Path | Navigation | Medium | Docs | ⏳ |
| DF-009 | Label en Packaging Complete | Implicit | Low | Docs | ⏳ |
| IFD | — | — | — | — | ninguno en IVR-001 |

Origen: [IVR-001](../ivr/IVR-001-iov001-piloto-ia.md).

---

## DF-001 — Quién `places` el Order B2B

| Campo | Valor |
|-------|-------|
| Tipo | Ambiguity |
| Severidad | Medium |
| KCM | KCM-001 |
| Classification | Docs only (por ahora) |

**Observación:** spine: Beneficiary `places` Order; Confirm responsable incluye admin.  
**Fuente citada:** `03-relationships/spine-flow.md` · `04-lifecycles/spine-transitions.md`

---

## DF-002 — Transiciones Payment incompletas

| Campo | Valor |
|-------|-------|
| Tipo | Gap |
| Severidad | High |
| Classification | Docs only |

**Observación:** estados Not due / Captured / Failed listados; solo Settle documentado como transición nombrada en spine-transitions.  
**Seguimiento:** completar máquina Payment en `04-lifecycles/spine-transitions.md`.

---

## DF-003 — Order semanal → Plan del día

| Campo | Valor |
|-------|-------|
| Tipo | Implicit assumption |
| Classification | Docs only |

**Observación:** grano día vive en Order Item; no restated en Plan.  

---

## DF-004 — `produces` vs `packages into`

| Campo | Valor |
|-------|-------|
| Tipo | Ambiguity |
| Classification | Docs only |

---

## DF-005 — Delivery Pending → Attempted

| Campo | Valor |
|-------|-------|
| Tipo | Gap |
| Classification | Docs only |

---

## DF-006 — Cross-link finance ↔ Settle ↔ Invoice

| Campo | Valor |
|-------|-------|
| Tipo | Missing cross-link |
| Classification | Docs only |

---

## DF-007 — Cardinalidad Plan día vs semana

| Campo | Valor |
|-------|-------|
| Tipo | Ambiguity |
| Classification | Docs only |

---

## DF-008 — Navegación Happy Path

| Campo | Valor |
|-------|-------|
| Tipo | Navigation |
| Classification | Docs only — **sin VR** |

**Seguimiento:** índice «recorrido Happy Path B2B» en README 17 o 04.

---

## DF-009 — Label como identidad en Packaging

| Campo | Valor |
|-------|-------|
| Tipo | Implicit assumption |
| Classification | Docs only |

---

## Plantillas

Ver historial del protocolo en [05](../05-experimental-protocol.md) para plantillas DF/IFD nuevas.
