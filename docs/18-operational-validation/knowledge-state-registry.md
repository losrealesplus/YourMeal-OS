# Knowledge State Registry

Registro vivo del **estado del conocimiento** por elemento canónico del Operational Model.

Actualizar al cerrar VR o FOV. Ver [knowledge-state.md](./knowledge-state.md).

**Última actualización:** 2026-07-22 · **Beta** · tren MC-001…006 aplicado

---

## Leyenda

| KS | Estado |
|----|--------|
| H | Hypothesized |
| O | Observed |
| V | Validated |
| R | Refuted |
| G | Generalized |

---

## Core Objects (espina)

| Elemento | KS | Primera observación | VR respaldo | Versión modelo | Notas |
|----------|-----|---------------------|-------------|----------------|-------|
| Weekly Menu | H | FASE 4 | — | Beta | No tensionado en batería |
| Order | **V** | VS-001 mesa | VR-001 | Beta | Confirm/Cancel · **Amend** MC-001 ✅ |
| Production Batch | **V** | VS-001 · VS-002 | VR-001 · VR-002 | Beta | Stock · **Pause/Resume** MC-002 ✅ |
| Production Plan | **V** | VS-001 · VS-002 | VR-001 · VR-002 | Beta | Revise Ready + In execution · Plan expedito MC-006 |
| Packaging | **V** | VS-001 · VS-004 | VR-001 · VR-004 | Beta | **Held** · Hold/Release MC-004 ✅ |
| Delivery Route | **V** | VS-001 · VS-002 | VR-001 · VR-002 | Beta | **Revise Route** MC-001 ✅ |
| Delivery | **V** | VS-001 · VS-003 · VS-006 | VR-001 · VR-003 · VR-006 | Beta | Location · Stop for Safety |
| Payment | **V** | VS-001 | VR-001 | Beta | B2B Not due / fin de mes |

---

## Supporting / órbita

| Elemento | KS | VR | Notas |
|----------|-----|-----|-------|
| Stock | **V** | VR-001 · VR-003 | INV-034 · Lot en Receive/Consume |
| Supplier | **V** | VR-001 | `supplies` · Receive |
| Label | **V** | VR-001 · VR-004 | Void/reapply · mismatch |
| Beneficiary | **V** | VR-001 | alta · perfil base |
| Order Item | **V** | VR-001 · VR-006 | Amend · dieta servicio |
| Kitchen | **V** | VR-002 · VR-005 | Capacidad Checks · **1..n** · Oven≠Core |
| Vehicle | **V** | VR-005 | **1..n** Organization |
| Location | **V** | VR-006 | **Activo** Supporting Spatial MC-006 |
| Lot | **V** | VR-003 | Traceability Supporting MC-003 · no Core |
| Notification | **V** (rechazo) | VR-002 | Capability · no entra en 17 |
| Purchase Order | H | — | Supporting futuro · no promovido |
| Recall Core | **V** (rechazo) | VR-003 | No Core · Supporting/evento |
| Shift / Wave Core | **V** (rechazo) | VR-005 | Ventana + Resource |

---

## Invariants

| ID | KS | VR respaldo | Notas |
|----|-----|-------------|-------|
| INV-031 | **V** | VR-003 | Endurecido: traza Lot→Batch→Packaging→Order Item |
| INV-020 | **V** | VR-001 · VR-002 | Amend + Pause explícitos |
| INV-044 | **V** | VR-002 | Capabilities no definen leyes |
| INV-021 | **V** | VR-001 | Orden causal intacto |
| INV-032 | **V** | VR-001 | Dishes en Menu |
| INV-034 | **V** | VR-001 | Stock no negativo silencioso |
| INV-035 | **V** | VR-001 · VR-004 | Label Complete · identidad |
| INV-040 | **V** | VR-001 | settles Order |
| INV-043 | **V** | VR-001 · Checks 2.0 | MANUAL DECISION alineado |
| INV-050…055 | **V** | VR-001 | Orden operativo |
| INV-042 | **V** | VR-001 | ventana · Revise Route |

---

## Dependencies

| Verbo / vínculo | KS | VR respaldo |
|-----------------|-----|-------------|
| Orders `aggregate into` Plan | **V** | VR-001 · VR-006 (1:1 expedito) |
| Batch `consumes` Stock (+ Lot) | **V** | VR-001 · VR-003 |
| Supplier `supplies` Ingredient | **V** | VR-001 |
| Packaging `assigns to` Route | **V** | VR-001 |
| Payment `settles` Order | **V** | VR-001 |
| Label `identifies` Packaging | **V** | VR-001 · VR-004 |

---

## Contadores (resumen)

| KS | Conteo (aprox. post tren MC · Beta) |
|----|-------------------------------------|
| Hypothesized | resto no tensionado (p.ej. Weekly Menu fino) |
| Observed | 0 (mesa, no FOV campo) |
| Validated | mayoría espina + Supporting clave + INV tocados |
| Refuted | **0** |
| Generalized | 0 (requiere multi-org FOV) |

---

## Relacionado

- [VR-001…006](./05-validation-reports/README.md)  
- [07 certification](./07-certification.md) · nivel **Beta**
