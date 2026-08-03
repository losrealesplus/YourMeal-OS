# FLOW-05 · Customer Experience Lifecycle · Definition of Ready

**Documento:** `FLOW_05_CUSTOMER_EXPERIENCE_DOR.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ **DoR DOCUMENT** · Spec ⏳ NOT STARTED · Runner ⏳  
**Flow ID:** FLOW-05  
**Handoff (catálogo):** Customer Experience Lifecycle  
**Pregunta operacional (borrador):** ¿Un cliente completa el ciclo Registro → Pedido → Entrega → Historial con evidencia reproducible?  
**Estándar:** [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md) · [EVIDENCE_BEFORE_IMPLEMENTATION](./EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md) · [FLOW_CATALOG](./FLOW_CATALOG.md)  
**Precondiciones certificadas:** FLOW-01…04 ✅ · RELEASE-01 ✅ · tags `flow01-pass`…`flow04-pass` · `release-01-pass` → `8e91a49`

> Este PR responde **solo**: ¿queda definido el marco Ready de FLOW-05?  
> **No** es Specification. **No** Freeze. **No** Runner. **No** dominio.  
> **No** Capacitor. **No** App Store. **No** Google Play.

---

## Pregunta de Flow (borrador · Spec la congela)

> ¿YourMeal OS certifica la **experiencia completa de negocio** del cliente  
> (Registro → Login → Pedido → Producción → Ruta → Entrega → Confirmación → Historial)  
> como un contrato `FLOW05_*` verificable, sin reabrir RELEASE-01?

No: *¿hay UI de pedido?*  
Sí: *¿el ciclo cliente es un flujo transversal certificable?*

---

## Scope (permitido en DoR)

| Incluye (propuesto) | Excluye (explícito) |
|---------------------|---------------------|
| Ciclo cliente extremo a extremo (borrador abajo) | Capacitor · App Store · Google Play |
| Encadenar contratos ya certificados (Auth · Order · Production · Delivery) | Re-certificar FLOW-01…04 / RELEASE-01 |
| Tokens canónicos T1…Tn (propuestos abajo) | Nueva lógica de negocio en este PR |
| Gate antes de FLOW05-001 | Deploy · Rollback · Smoke · Cross-flow · E2E re-run |
| Evidence before Implementation | Semver `v*` · marketing |

**Cadena propuesta (borrador · Spec congela nombres y cortes):**

```text
Cliente
  ↓
Registro
  ↓
Login
  ↓
Pedido
  ↓
Producción
  ↓
Ruta
  ↓
Entrega
  ↓
Confirmación
  ↓
Historial
```

**Ancla upstream:** producto SaaS certificado (`release-01-pass`) + Flows 01–04.  
**No reabre** RELEASE-01 ni FLOW-01…04 salvo regresión certificada.

---

## Checklist Definition of Ready

Plantilla institucional ([FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md)):

```text
FLOW-05
□ SPEC congelada                          → siguiente PR (READY FOR FREEZE)
☑ Contrato de evidencias definido         → este DoR (skeleton) · Spec fija Tn
□ Runner creado (test:flow05-canonical)   → tras Spec Freeze
☑ Estados permitidos / ciclo de vida      → borrador abajo · Spec congela
☑ Invariantes                             → borrador abajo · Spec congela
☑ PASS esperado                            → Spec § PASS
☑ BLOCKED esperado                        → baseline runner (tras Spec + Runner)
☑ Acta de certificación (plantilla path)  → docs/10-validation/flow-05/
```

**Ready completo:** solo cuando Spec FROZEN + Runner en `main` + BLOCKED verificado.

---

## Estados propuestos (no Freeze)

| Concepto | Estados / campos candidatos |
|----------|-----------------------------|
| Customer identity | registered → authenticated (sesión) |
| Order | draft → confirmed → in_production → out_for_delivery → delivered |
| Production batch | (reuse FLOW-01 outcomes) |
| Route / delivery | (reuse FLOW-01/02 outcomes) |
| Confirmation | delivered confirmed (cliente / ops) |
| History | order visible en historial del cliente |

**Regla DoR:** Spec debe elegir **un** modelo de estados y prohibir estados inventados fuera de lista.  
Puede reutilizar estados certificados de FLOW-01…04; no inventar un segundo dominio paralelo.

---

## Invariantes propuestos (no Freeze)

| ID | Invariante |
|----|------------|
| I1 | Tenant isolation — nunca cruzar `tenant_id` |
| I2 | Cliente autenticado antes de pedido confirmado |
| I3 | Pedido confirmado antes de producción / ruta |
| I4 | Entrega solo desde pedido en estado operable |
| I5 | Confirmación no inventa entrega (requiere `delivered` o equivalente certificado) |
| I6 | Historial refleja solo pedidos del cliente autenticado (mismo tenant) |
| I7 | Evidence tokens once-only · en orden · sin duplicates |

Spec puede añadir I8+; no eliminar I1–I2 sin acta de renegociación.

---

## Contrato de evidencias propuesto (no Freeze)

Tokens canónicos (skeleton — Spec fija el número exacto de Tₙ):

```text
FLOW05_T1_STARTED
FLOW05_T1_COMPLETED

FLOW05_T2_STARTED
FLOW05_T2_COMPLETED

FLOW05_T3_STARTED
FLOW05_T3_COMPLETED

FLOW05_T4_STARTED
FLOW05_T4_COMPLETED

FLOW05_T5_STARTED
FLOW05_T5_COMPLETED
```

| Transición (borrador) | Intención |
|-----------------------|-----------|
| **T1** | Registro / identidad cliente operable |
| **T2** | Login / sesión autenticada |
| **T3** | Pedido confirmado |
| **T4** | Producción → Ruta → Entrega (cadena operativa) |
| **T5** | Confirmación → Historial |

Si Spec reduce o parte T4, los tokens se ajustan **en el Freeze**, no en implementación ad hoc.

---

## PASS / BLOCKED / FAIL (expectativas)

| Estado | Significa para FLOW-05 |
|--------|------------------------|
| **PASS** | Prefijo certificado de tokens en orden · arrays vacíos · evidencia coherente |
| **FAIL** | Contrato implementado roto (duplicate / missing / out_of_order / invariante) |
| **BLOCKED** | Siguiente transición aún no implementada — **no es defecto** |

### Baseline runner (tras Spec + Runner · no este PR)

```bash
npm run test:flow05-canonical
```

```text
FLOW-05
BLOCKED
blocked_at=FLOW05_T1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

Exit code canónico: **2** (BLOCKED), igual que FLOW-01…04.

### FULL PASS (futuro)

```text
FLOW-05
PASS
… tokens T1…Tn STARTED/COMPLETED …
duplicates=[]
missing=[]
out_of_order=[]
```

Tag: `flow05-pass` — solo tras acta + `--live` PASS.  
**Después** de `flow05-pass`: Capacitor / primera build móvil EatClean (no antes).

---

## Evidence contract (ubicación)

| Artefacto | Path / comando |
|-----------|----------------|
| Spec (siguiente) | `docs/00-status/FLOW_05_CUSTOMER_EXPERIENCE_SPEC.md` |
| Runner docs | `docs/10-validation/flow-05/FLOW05_CANONICAL_RUNNER.md` |
| Actas Tₙ | `docs/10-validation/flow-05/FLOW05_00N_T*_ACTA.md` |
| PASS acta | `docs/10-validation/flow-05/FLOW05_PASS_ACTA.md` |
| Evidence JSON | `docs/10-validation/flow-05/evidence/` (gitignored / restoreable) |
| npm | `test:flow05-canonical` · `test:flow05-001`… (tras Runner) |

---

## Gate · Abrir FLOW05-001

FLOW05-001 (dominio T1) **solo** cuando se cumplen las cuatro:

| # | Condición |
|---|-----------|
| 1 | Spec mergeada en `main` → FLOW-05 **FROZEN** |
| 2 | Runner mergeado en `main` |
| 3 | Desde `main`: `npm run test:flow05-canonical` → BLOCKED at `FLOW05_T1_STARTED` · arrays vacíos · `evidence={}` |
| 4 | Contrato `FLOW05_T*` sin renegociación abierta |

Hasta entonces: **prohibido** repositories · services · OperationsService · RPC · SQL · UI · Supabase domain · drivers de dominio · Capacitor.

---

## Plan de trabajo FLOW-05

| Fase | Trabajo | Estado |
|------|---------|--------|
| 0 | DoR document | ▶ este PR |
| 1 | Spec | ⏳ READY FOR FREEZE (siguiente) |
| 2 | Freeze (merge Spec → main) | ⏳ |
| 3 | Runner only · BLOCKED at T1 | ⏳ |
| 4 | Gate FLOW05-001 | ⏳ |
| 5 | FLOW05-001…00n (una transición / PR) | ⏳ |
| 6 | FULL PASS · tag `flow05-pass` | ⏳ |
| 7 | Capacitor / build móvil EatClean | ⏳ **solo tras** `flow05-pass` |

---

## Fuera de este PR

- Specification prose / Freeze  
- `scripts/flow05-canonical.mjs` · drivers  
- Cualquier cambio en `src/` o migraciones  
- Capacitor · App Store · Google Play  
- Reabrir RELEASE-01 · Smoke · Cross-flow · E2E · Deploy · Rollback  

---

## End of FLOW-05 DoR
