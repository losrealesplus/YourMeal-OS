# Índice de la Constitución

| ID | Invariante (resumen) | Categoría |
|----|----------------------|-----------|
| INV-001 | Identidad única por Core Object | Identidad |
| INV-002 | Un nombre = un concepto | Identidad |
| INV-003 | Archive ≠ Purge | Identidad |
| INV-004 | Actor explícito en Order | Identidad |
| INV-010 | Pertenencia a Organization | Propiedad |
| INV-011 | Batch → un Plan | Propiedad |
| INV-012 | Order → demanda + Menu | Propiedad |
| INV-013 | Payment → compromiso económico | Propiedad |
| INV-014 | Delivery → Order / destinatario | Propiedad |
| INV-015 | Beneficiary → Company Account | Propiedad |
| INV-020 | Transiciones explícitas | Temporalidad |
| INV-021 | Orden causal espina | Temporalidad |
| INV-022 | Delivery después de Route depart | Temporalidad |
| INV-023 | Plan solo tras Order Confirmed | Temporalidad |
| INV-024 | Settle explícito | Temporalidad |
| INV-030 | Packaging requiere Batch | Consistencia |
| INV-031 | Batch referencia necesidad | Consistencia |
| INV-032 | Order dentro de Menu | Consistencia |
| INV-033 | Producción desde Recipe | Consistencia |
| INV-034 | Stock no negativo silencioso | Consistencia |
| INV-035 | Label / destinatario para Complete | Consistencia |
| INV-040 | Payment liquida Order | Integridad |
| INV-041 | Delivery confirma destinatario | Integridad |
| INV-042 | Route con ventana | Integridad |
| INV-043 | Check no decide | Integridad |
| INV-044 | Capabilities no definen leyes | Integridad |
| INV-050 | Plan antes de Batch | Operación |
| INV-051 | Batch antes de Packaging | Operación |
| INV-052 | Packaging antes de Route | Operación |
| INV-053 | Route antes de Delivery | Operación |
| INV-054 | Checks en transiciones | Operación |
| INV-055 | Invariant > Capability | Operación |

Nuevo Invariant: proponer con categoría + evidencia (Observation) — no por brainstorming de pantalla.
