# Knowledge State Registry

Registro vivo del **estado del conocimiento** por elemento canónico del Operational Model.

Actualizar al cerrar VR o FOV. Ver [knowledge-state.md](./knowledge-state.md).

**Última actualización:** 2026-07-22 · **VR-001**

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
| Weekly Menu | H | FASE 4 | — | Alpha | No tensionado en VS-001 |
| Order | **V** parcial | VS-001 mesa | VR-001 | Alpha | Confirm/Cancel ✔ · **Amend** pendiente MC-001 |
| Production Batch | **V** parcial | VS-001 · VS-002 | VR-001 · VR-002 | Alpha | Stock ✔ · **Pause/Blocked** pendiente MC-002 |
| Production Plan | **V** parcial | VS-001 · VS-002 | VR-001 · VR-002 | Alpha | Ready Revise MC-001 · **In execution** MC-002 |
| Packaging | **V** | VS-001 | VR-001 | Alpha | Pending + Label alérgenos |
| Delivery Route | **V** parcial | VS-001 | VR-001 | Alpha | Ready ✔ · **Revise** pendiente MC-001 |
| Delivery | **V** | VS-001 | VR-001 | Alpha | Condicionado a Route revisada |
| Payment | **V** | VS-001 | VR-001 | Alpha | B2B Not due / fin de mes |

---

## Supporting / órbita (tocados en VS-001)

| Elemento | KS | VR | Notas |
|----------|-----|-----|-------|
| Stock | **V** | VR-001 | INV-034 · Check Start |
| Supplier | **V** | VR-001 | `supplies` · Receive |
| Label | **V** | VR-001 | sin gluten / alérgenos |
| Beneficiary | **V** | VR-001 | alta 2 nuevos |
| Order Item | **V** | VR-001 | líneas Amend |
| Kitchen | **V** parcial | VS-002 | VR-002 | Alpha | Ancla OK · capacidad/equipo no Core |
| Notification (rechazo) | **V** | VS-002 | VR-002 | — | Capability · no modelo 17 |

---

## Invariants

| ID | KS | VR respaldo | Notas |
|----|-----|-------------|-------|
| INV-011 | **V** | VR-001 | Batch → un Plan · sin grieta |
| INV-020 | **V** | VR-001 | Exige Amend explícito (MC-001) |
| INV-021 | **V** | VR-001 | Orden causal intacto |
| INV-032 | **V** | VR-001 | Dishes en Menu |
| INV-034 | **V** | VR-001 | Pollo 12&lt;20 bloquea |
| INV-035 | **V** | VR-001 | Label Complete |
| INV-040 | **V** | VR-001 | settles Order · no cobro inmediato |
| INV-043 | **V** | VR-001 | Check no decide compra |
| INV-050…055 | **V** | VR-001 | Orden operativo |
| INV-042 | **V** parcial | VR-001 | ventana · Revise Route MC-001 |

---

## Dependencies

| Verbo / vínculo | KS | VR respaldo |
|-----------------|-----|-------------|
| Orders `aggregate into` Plan | **V** | VR-001 |
| Batch `consumes` Stock | **V** | VR-001 |
| Supplier `supplies` Ingredient | **V** | VR-001 |
| Packaging `assigns to` Route | **V** | VR-001 |
| Payment `settles` Order | **V** | VR-001 |
| Label `identifies` Packaging | **V** | VR-001 |

---

## Contadores (resumen)

| KS | Conteo (aprox. tras VR-001) |
|----|----------------------------|
| Hypothesized | resto no tocado + Amend/Revise propuestas |
| Observed | 0 (mesa, no FOV campo) |
| Validated | ~20 elementos tocados |
| Refuted | **0** |
| Generalized | 0 |

---

## Relacionado

- [VR-001](./05-validation-reports/VR-001-modificacion-tardia-eatclean.md)  
- [validation-coverage](./05-validation-reports/validation-coverage.md)
