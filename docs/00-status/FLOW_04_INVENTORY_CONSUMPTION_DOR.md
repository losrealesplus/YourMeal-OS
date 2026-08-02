# FLOW-04 · Inventory Consumption · Definition of Ready

**Documento:** `FLOW_04_INVENTORY_CONSUMPTION_DOR.md`  
**Fecha:** 2026-08-02  
**Estado:** ▶ **DoR DOCUMENT** · checklist Ready aún incompleto (Spec/Runner pendientes)  
**Flow ID:** FLOW-04  
**Handoff (catálogo):** Inventory Consumption  
**Pregunta operacional (borrador):** ¿La producción consume inventario de forma trazable e idempotente?  
**Estándar:** [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md) · [EVIDENCE_BEFORE_IMPLEMENTATION](./EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md) · [FLOW_CATALOG](./FLOW_CATALOG.md)  
**Precondiciones certificadas:** FLOW-01 ✅ · FLOW-02 ✅ · FLOW-03 ✅ · tags `flow01-pass`…`flow03-pass`

> Este PR responde **solo**: ¿queda definido el marco Ready de FLOW-04?  
> **No** es Specification. **No** Freeze. **No** Runner. **No** dominio.

---

## Pregunta de Flow (borrador · Spec la congela)

> Tras un tramo productivo certificado (cadena Kitchen → Production de FLOW-01),  
> ¿el stock de ingredientes refleja el consumo esperado, sin dobles descuentos  
> y con evidencia `FLOW04_*` reproducible?

No: *¿hay UI de inventario?*  
Sí: *¿el consumo de ingredientes es un contrato verificable?*

---

## Scope (permitido en DoR)

| Incluye (propuesto) | Excluye (explícito) |
|---------------------|---------------------|
| Consumo de ingredientes ligado a producción / receta | Purchasing / recepción de mercancía |
| Ajuste de `stock` (o movimiento equivalente) | UI admin inventory (salvo evidencia de dominio) |
| Idempotencia del consumo por fuente | Reorden automático / suppliers |
| Tokens canónicos T1…Tn (propuestos abajo) | FLOW-05 Order Lifecycle · FLOW-06 Kitchen Planning |
| Gate antes de FLOW04-001 | Billing (FLOW-03) · Delivery incidents (FLOW-02) |

**Ancla upstream:** necesita Outcome de producción usable (FLOW-01 T1/T2 como contexto).  
**No reabre** FLOW-01…03 salvo regresión certificada.

---

## Checklist Definition of Ready

Plantilla institucional ([FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md)):

```text
FLOW-04
□ SPEC congelada                          → siguiente PR (no este)
□ Contrato de evidencias definido         ▶ propuesto abajo (no Freeze)
□ Runner creado (test:flow04-canonical)   → tras Spec Freeze
□ Estados permitidos / ciclo de vida      ▶ propuesto abajo (no Freeze)
□ Invariantes                             ▶ propuestos abajo (no Freeze)
□ PASS esperado                           ▶ propuesto
□ BLOCKED esperado                        ▶ propuesto (baseline runner)
□ Acta de certificación (plantilla path)  ▶ docs/10-validation/flow-04/
```

**Estado de este documento:** DoR **iniciado** · marco listo para Spec.  
**Ready completo:** solo cuando Spec FROZEN + Runner en `main` + BLOCKED verificado.

---

## Estados propuestos (no Freeze)

Entidades candidatas (nombres orientativos — Spec nombra los definitivos):

| Concepto | Estados / campos candidatos |
|----------|-----------------------------|
| Ingredient stock | `stock` numérico · `min_stock` (existente en plataforma) |
| Consumption / movement | `pending` → `applied` (o evento único applied) |
| Fuente | referencia a production batch / order line / dish production (Spec elige) |

**Regla DoR:** Spec debe elegir **un** modelo de movimiento y prohibir estados inventados fuera de lista.

---

## Invariantes propuestos (no Freeze)

| ID | Invariante |
|----|------------|
| I1 | Tenant isolation — nunca cruzar `tenant_id` |
| I2 | **Single apply** — un consumo por fuente no aplica dos veces (idempotente) |
| I3 | Stock nunca negativo salvo política explícita en Spec (default: rechazar) |
| I4 | Consumo solo con fuente productiva válida (producción / packaging según Spec) |
| I5 | Cantidades derivadas de receta (`dish_ingredients`) o override auditado — no inventar |
| I6 | Evidence tokens once-only · en orden · sin duplicates |

Spec puede añadir I7+; no eliminar I1–I2 sin acta de renegociación.

---

## Contrato de evidencias propuesto (no Freeze)

Tokens canónicos (skeleton — Spec fija el número exacto de Tₙ):

```text
FLOW04_T1_STARTED
FLOW04_T1_COMPLETED

FLOW04_T2_STARTED
FLOW04_T2_COMPLETED

FLOW04_T3_STARTED
FLOW04_T3_COMPLETED
```

| Transición (borrador) | Intención |
|-----------------------|-----------|
| **T1** | Calcular / registrar necesidad de consumo desde producción |
| **T2** | Aplicar consumo a stock (movimento applied) |
| **T3** | Cerrar invariantes post-consumo (p. ej. alerta min_stock o confirmación) |

Si Spec reduce a T1–T2, los tokens T3 se eliminan **en el Freeze**, no en implementación ad hoc.

---

## PASS / BLOCKED / FAIL (expectativas)

| Estado | Significa para FLOW-04 |
|--------|------------------------|
| **PASS** | Prefijo certificado de tokens en orden · arrays vacíos · evidencia coherente |
| **FAIL** | Contrato implementado roto (duplicate / missing / out_of_order / invariante) |
| **BLOCKED** | Siguiente transición aún no implementada — **no es defecto** |

### Baseline runner (tras Spec + Runner · no este PR)

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

Exit code canónico: **2** (BLOCKED), igual que FLOW-02/03.

### FULL PASS (futuro)

```text
FLOW-04
PASS
… tokens T1…Tn STARTED/COMPLETED …
duplicates=[]
missing=[]
out_of_order=[]
```

Tag: `flow04-pass` — solo tras acta + `--live` PASS.

---

## Evidence contract (ubicación)

| Artefacto | Path / comando |
|-----------|----------------|
| Spec (siguiente) | `docs/00-status/FLOW_04_INVENTORY_CONSUMPTION_SPEC.md` |
| Runner docs | `docs/10-validation/flow-04/FLOW04_CANONICAL_RUNNER.md` |
| Actas Tₙ | `docs/10-validation/flow-04/FLOW04_00N_T*_ACTA.md` |
| PASS acta | `docs/10-validation/flow-04/FLOW04_PASS_ACTA.md` |
| Evidence JSON | `docs/10-validation/flow-04/evidence/` (gitignored / restoreable) |
| npm | `test:flow04-canonical` · `test:flow04-001`… |

---

## Gate · Abrir FLOW04-001

FLOW04-001 (dominio T1) **solo** cuando se cumplen las cuatro:

| # | Condición |
|---|-----------|
| 1 | Spec mergeada en `main` → FLOW-04 **FROZEN** |
| 2 | Runner mergeado en `main` |
| 3 | Desde `main`: `npm run test:flow04-canonical` → BLOCKED at `FLOW04_T1_STARTED` · arrays vacíos · `evidence={}` |
| 4 | Contrato `FLOW04_T*` sin renegociación abierta |

Hasta entonces: **prohibido** repositories · services · OperationsService · RPC · SQL · UI · Supabase domain · drivers de dominio.

---

## Plan de trabajo FLOW-04

| Fase | Trabajo | Estado |
|------|---------|--------|
| 0 | DoR document (este) | ▶ este PR |
| 1 | Spec | ⏳ |
| 2 | Freeze (merge Spec → main) | ⏳ |
| 3 | Runner only · BLOCKED at T1 | ⏳ |
| 4 | Gate FLOW04-001 | ⏳ |
| 5 | FLOW04-001…00n (una transición / PR) | ⏳ |
| 6 | FULL PASS · tag `flow04-pass` | ⏳ |

---

## Fuera de este PR

- Specification prose / Freeze  
- `scripts/flow04-canonical.mjs` · drivers  
- Cualquier cambio en `src/` o migraciones  
- RELEASE-01 Freeze / DoRl PASS  
- FLOW-05 / FLOW-06  

---

## End of FLOW-04 DoR
