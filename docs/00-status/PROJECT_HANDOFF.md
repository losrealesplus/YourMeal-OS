# YourMeal OS · Project Handoff

**Documento:** `PROJECT_HANDOFF.md`  
**Fecha:** 2026-08-02  
**Repositorio:** YourMeal-OS  
**Branch / HEAD de referencia:** `main` · `67a2e66`  
**Estado:** ✅ Congelado como contexto de arranque post–FLOW-03

> Handoff institucional. El siguiente ciclo (FLOW-04+) empieza desde aquí  
> sin reinterpretar metodología ni reabrir flujos certificados.

---

## Current certification status

| Área | Estado | Tag |
|------|--------|-----|
| Foundation | ✅ PASS | — |
| PS-002-C | ✅ CERTIFIED | `ps002c-pass` |
| FLOW-01 Kitchen → Delivery | ✅ CERTIFIED | `flow01-pass` |
| FLOW-02 Delivery Incidents | ✅ CERTIFIED | `flow02-pass` |
| FLOW-03 Billing | ✅ CERTIFIED | `flow03-pass` → `67a2e66` |

Tags en remoto:

```text
ps002c-pass
flow01-pass
flow02-pass
flow03-pass
```

---

## Methodology (FOPEBA · institutionalized)

Cada flujo de negocio sigue **exactamente**:

```text
Definition of Ready
        ↓
Specification
        ↓
Freeze
        ↓
Canonical Runner
        ↓
Implementation
        ↓
Certification
        ↓
Tag
```

**Evidence Before Implementation** es obligatorio.

No hay implementación antes de:

1. DoR completo  
2. Spec congelada  
3. Runner mergeado en `main`  
4. Baseline `BLOCKED` verificado desde `main`

Gobernanza operativa:

| Regla | Significado |
|-------|-------------|
| Una transición / PR | Un objetivo certificable |
| Una pregunta / PR | El runner responde sí/no |
| Sin ampliar alcance | No “ya que estamos” |
| Runner = verdad | Spec = contrato · Impl. certifica |
| Tag cierra el Flow | Sin tag no hay hito |

Ver: [EVIDENCE_BEFORE_IMPLEMENTATION](./EVIDENCE_BEFORE_IMPLEMENTATION.md) · [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md) · [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md)

---

## Certified flows (contracts)

### FLOW-01 · Kitchen → Production → Packaging → Delivery

**FULL PASS**  
Acta: [FLOW01_PASS_ACTA](../10-validation/flow-01/FLOW01_PASS_ACTA.md)

```text
FLOW01_T1_STARTED / FLOW01_T1_COMPLETED
FLOW01_T2_STARTED / FLOW01_T2_COMPLETED
FLOW01_T3_STARTED / FLOW01_T3_COMPLETED
FLOW01_T4_STARTED / FLOW01_T4_COMPLETED
```

### FLOW-02 · Delivery Incidents

**FULL PASS**  
Acta: [FLOW02_PASS_ACTA](../10-validation/flow-02/FLOW02_PASS_ACTA.md)

```text
FLOW02_T1_STARTED / FLOW02_T1_COMPLETED
FLOW02_T2_STARTED / FLOW02_T2_COMPLETED
FLOW02_T3_STARTED / FLOW02_T3_COMPLETED
```

### FLOW-03 · Billing

**FULL PASS**  
Acta: [FLOW03_PASS_ACTA](../10-validation/flow-03/FLOW03_PASS_ACTA.md) · Spec: [FLOW_03_BILLING_SPEC](./FLOW_03_BILLING_SPEC.md)

```text
FLOW03_T1_STARTED / FLOW03_T1_COMPLETED
FLOW03_T2_STARTED / FLOW03_T2_COMPLETED
FLOW03_T3_STARTED / FLOW03_T3_COMPLETED
```

Contrato congelado:

```text
T1  delivered → createInvoiceFromOrders() → invoice.status = pending
T2  reviewInvoice() → reviewed_at = now() · status permanece pending
T3  recordPayment() → invoice.status = paid
```

- **Review = evento, no estado** (nunca inventar `InvoiceStatus=review`)  
- **FLOW03-I7 · Single Active Invoice** — `createInvoiceFromOrders` idempotente; nunca dos facturas activas; return existing **o** `invoice_already_exists`  
- Fuera de v1: reembolsos · pagos parciales · void · notas de crédito  

---

## Current main

```text
HEAD  67a2e66  (Merge #160 · FLOW03-003)

FOUNDATION → PS-002-C → FLOW-01 → FLOW-02 → FLOW-03
     ✅           ✅         ✅        ✅        ✅
```

---

## Open documentation

| PR | Rol |
|----|-----|
| Spec FLOW-04 | ▶ READY FOR FREEZE · [FLOW_04_INVENTORY_CONSUMPTION_SPEC](./FLOW_04_INVENTORY_CONSUMPTION_SPEC.md) · **docs only** |
| #162 | ✅ MERGED · FLOW-04 DoR · `9ce3feb` |
| #161 | ✅ MERGED · handoff · RELEASE-01 · DoRl DRAFT |

---

## Next flow · FLOW-04

**DoR** ✅ · **Spec** ▶ READY FOR FREEZE · [SPEC](./FLOW_04_INVENTORY_CONSUMPTION_SPEC.md)  
Implementation **forbidden** until Spec FROZEN + Runner BLOCKED verified.

Gate:

```text
Definition of Ready  ✅ #162
        ↓
Specification  ▶ READY FOR FREEZE
        ↓
Freeze (merge Spec → main)
        ↓
Canonical Runner (BLOCKED at FLOW04_T1_STARTED)
        ↓
Gate verification from main
        ↓
FLOW04-001 (una transición)
```

### Tras Freeze · Runner only

Sin dominio. Baseline: `BLOCKED at FLOW04_T1_STARTED`.

### Prohibido hasta Gate verde

Repositorios · services · OperationsService · RPC · SQL/migraciones · UI · Supabase · drivers de dominio · tests de dominio.

### Tras Spec FROZEN · Runner only

```bash
npm run test:flow04-canonical
```

```text
FLOW-04
BLOCKED
blocked_at=FLOW04_T1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

Sin dominio. Luego FLOW04-001… → FULL PASS → tag `flow04-pass`.

---

## Long-term objective

Cada dominio operativo representado por:

```text
Specification → Frozen contract → Executable runner
→ Incremental implementation → Evidence → Certification → Git tag
```

Ningún flujo debe saltarse este ciclo.

---

## Product release governance (paralelo)

Dos preguntas distintas:

| Nivel | Pregunta |
|-------|----------|
| Flow | ¿Este flujo cumple su contrato? |
| Release | ¿El producto completo está listo para una beta? |

Dos ejes (no mezclar PRs):

- **Eje A** — Certificar Flows (FOPEBA · DoR → … → `flowNN-pass`)  
- **Eje B** — Completar [RELEASE_01_BETA_STRATEGY](./RELEASE_01_BETA_STRATEGY.md)  

Pieza FOPEBA de producto: [DEFINITION_OF_RELEASE](./DEFINITION_OF_RELEASE.md) (DoRl) —  
checklist de versión completa → futuro tag `release-01-beta`.

DoRl está **DRAFT**. No declara beta. No abre implementación.

---

## End of handoff
