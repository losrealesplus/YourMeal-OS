# FLOW-05 · Customer Experience Lifecycle · Definition of Ready

**Documento:** `FLOW_05_CUSTOMER_EXPERIENCE_DOR.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ **DoR DOCUMENT** · Spec ✅ [FROZEN](./FLOW_05_SPEC.md) · Runner ✅ · Gate ✅ [READY](../10-validation/flow-05/FLOW_05_GATE.md)  
**Flow ID:** FLOW-05  
**Handoff (catálogo):** Customer Experience Lifecycle  
**Pregunta operacional (borrador):** ¿Un cliente completa el ciclo Registro → Pedido → Entrega → Historial con evidencia reproducible?  
**Estándar:** [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md) · [EVIDENCE_BEFORE_IMPLEMENTATION](./EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md) · [FLOW_CATALOG](./FLOW_CATALOG.md) · [Spec](./FLOW_05_SPEC.md)  
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

## Contract boundary (referencia para Spec)

Antes de Freeze, Spec debe respetar estos cuatro anclajes.  
Si Spec los cambia, debe ser un acta explícita — no crecimiento implícito.

### 1. Dónde empieza

```text
START = Cliente no autenticado inicia Registro
        (o identidad cliente creada / vinculada al tenant)
```

Primer token del contrato (borrador): `FLOW05_T1_*` · Registro / identidad operable.  
No empieza en Pedido. No empieza en cocina. No empieza en Capacitor.

### 2. Dónde termina

```text
END = Pedido entregado confirmado y visible en Historial del cliente
```

Último token del contrato (borrador): `FLOW05_T5_*` · Confirmación → Historial.  
No termina en “app publicada”. No termina en facturación completa (FLOW-03 ya certificado).  
No termina en incidencia de entrega (FLOW-02 ya certificado).

### 3. Capacidades que deben existir para considerarlo completo

| Capacidad | Rol en FLOW-05 | Origen certificado |
|-----------|----------------|--------------------|
| Registro / identidad cliente | Entrada al ciclo | Platform · P1 Auth / Profiles · Customers (P2) |
| Login / sesión | Autenticación operable | P1 Auth · PS-002-C |
| Pedido confirmado | Intención de compra | P2 Orders |
| Producción | Ejecución de cocina | P3 Production · FLOW-01 |
| Ruta | Asignación logística | P3 Routes · FLOW-01 |
| Entrega | Outcome `delivered` | P3 Deliveries · FLOW-01 |
| Confirmación | Cierre del tramo entrega | FLOW-01 / ops handoff |
| Historial | Lectura del ciclo por el cliente | Orders + sesión autenticada |

FLOW-05 **encadena** estas capacidades; no las re-implementa ni las re-certifica como módulos sueltos.

### 4. Fuera de alcance explícito (no crece el Flow)

| Fuera | Motivo |
|-------|--------|
| Capacitor · App Store · Google Play | Solo tras `flow05-pass` |
| Billing / cobro / factura | FLOW-03 ya CERTIFIED |
| Incidencias de entrega / reintentos | FLOW-02 ya CERTIFIED |
| Consumo de inventario | FLOW-04 ya CERTIFIED |
| Re-certificar RELEASE-01 / P1–P5 | Producto ya `release-01-pass` |
| Smoke · Cross-flow · E2E · Deploy · Rollback | Framework Track B cerrado |
| Marketing · semver `v*` · producción masiva | Fuera de certificación de Flow |
| Nueva lógica de negocio “porque el piloto lo pide” | Solo vía Spec Freeze / nueva entrega |

**Regla anti-crecimiento:** si una capacidad no aparece en la tabla §3 ni en la cadena START→END, **no entra** en FLOW-05 sin renegociar el Freeze.

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
☑ SPEC congelada                          ✅ FROZEN #237 · [FLOW_05_SPEC](./FLOW_05_SPEC.md)
☑ Contrato de evidencias definido         → FLOW_05_SPEC.md · tokens FLOW05_B1…B8
☑ Runner creado (test:flow-05)            ▶ este PR · BLOCKED at B1
☑ Estados permitidos / ciclo de vida      → Spec §3 B1–B8 recibe/transforma/entrega
☑ Invariantes                             → DoR · Spec boundary Freeze
☑ PASS esperado                            → Spec §7
☑ BLOCKED esperado                        → Spec §8 · runner baseline
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
| 0 | DoR document | ✅ #236 |
| 1 | Spec | ✅ FROZEN #237 · [FLOW_05_SPEC](./FLOW_05_SPEC.md) |
| 2 | Freeze (merge Spec → main) | ✅ #237 · `deba9f6` |
| 3 | Runner only · BLOCKED at B1 | ✅ #238 · `7381ff2` |
| 4 | Gate FLOW05-001 | ✅ READY #239 · `eb07a1a` |
| 5 | FLOW05-001 · B1 Registration | ✅ #240 · `07a19b4` |
| 5b | FLOW05-002 · B2 Authentication | ✅ #241 · `5933f96` |
| 5c | FLOW05-003 · B3 Order Creation | ✅ #242 · `ae8764d` |
| 5d | FLOW05-004 · B4 Production | ✅ #243 · `1181c21` |
| 5e | FLOW05-005 · B5 Route Planning | ✅ #244 · `f0e1ebc` |
| 5f | FLOW05-006 · B6 Delivery | ✅ este PR |
| 5g | FLOW05-007…008 (un bloque / PR) | ⏳ next · 007 |
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
