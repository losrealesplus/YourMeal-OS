# FLOW-05 · Customer Experience Lifecycle · Specification

**Documento:** `FLOW_05_SPEC.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ **FROZEN** (merge #237 · `deba9f6`) · Runner ✅ · Gate ✅ · 001…006 ✅ · FLOW05-007 ▶ B7 CERTIFIED · CERTIFIED_THROUGH=7  
**DoR:** [FLOW_05_CUSTOMER_EXPERIENCE_DOR](./FLOW_05_CUSTOMER_EXPERIENCE_DOR.md)  
**Runner:** [FLOW_05_RUNNER](../10-validation/flow-05/FLOW_05_RUNNER.md)  
**Gate:** [FLOW_05_GATE](../10-validation/flow-05/FLOW_05_GATE.md)  
**Estándar:** [FLOW_DEFINITION_OF_READY](./FLOW_DEFINITION_OF_READY.md) · [Evidence before Implementation](./EVIDENCE_BEFORE_IMPLEMENTATION.md)  
**Gobernanza:** [FLOW_GOVERNANCE](./FLOW_GOVERNANCE.md) Regla 7–9  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md) · [FLOW_CATALOG](./FLOW_CATALOG.md)  
**Precondiciones:** FLOW-01…04 ✅ · RELEASE-01 ✅ · tags `flow01-pass`…`flow04-pass` · `release-01-pass` → `8e91a49`

> FLOW-05 **no** certifica ingeniería ni módulos sueltos.  
> Certifica el **recorrido completo del cliente** desde START hasta END.  
> Este documento es **contrato únicamente** — sin Runner · sin drivers · sin tests · sin lógica.

---

## Pregunta de Flow

> ¿YourMeal OS certifica la experiencia de negocio del cliente  
> (Registro → Autenticación → Pedido → Producción → Ruta → Entrega → Confirmación → Historial)  
> como un contrato `FLOW05_B*` verificable, sin reabrir RELEASE-01?

No: *¿hay pantallas?* · *¿hay app móvil?*  
Sí: *¿el ciclo cliente es un contrato de estados certificable?*

---

## 1. Contract Boundary (inmutable tras Freeze)

### START

```text
START = Cliente NO autenticado inicia Registro
```

Primer token: `FLOW05_B1_STARTED` / `FLOW05_B1_COMPLETED`.

### END

```text
END = Pedido entregado
      + entrega confirmada
      + pedido visible en Historial del cliente
```

Último token: `FLOW05_B8_STARTED` / `FLOW05_B8_COMPLETED`.

### Freeze rule

```text
Toda modificación posterior del recorrido DEBE cambiar este Spec.
NO se amplía durante Runner.
NO se amplía durante implementación.
NO se amplía durante certificación.
```

Si una capacidad no aparece en §2 ni en START→END, **no entra** en FLOW-05 sin renegociar el Freeze.

---

## 2. Customer Journey (secuencia congelada)

```text
B1 Registration
    ↓
B2 Authentication
    ↓
B3 Order Creation
    ↓
B4 Production
    ↓
B5 Route Planning
    ↓
B6 Delivery
    ↓
B7 Delivery Confirmation
    ↓
B8 History
```

**No modificar esta secuencia** sin acta de renegociación del Spec.

---

## 3. Contratos por bloque (recibe → transforma → entrega)

Cada bloque responde exactamente tres preguntas.  
Spec congela el contrato; Runner e implementación solo evidencian estos handoffs.

### B1 · Registration

| | Contrato |
|---|----------|
| **¿Qué recibe?** | Cliente no autenticado · tenant operable (RELEASE-01 P1) |
| **¿Qué transforma?** | Identidad de cliente registrada / vinculada al tenant |
| **¿Qué entrega?** | Cliente registrado, listo para autenticación (B2) |
| **Tokens** | `FLOW05_B1_STARTED` · `FLOW05_B1_COMPLETED` |

### B2 · Authentication

| | Contrato |
|---|----------|
| **¿Qué recibe?** | Cliente registrado (outcome B1) |
| **¿Qué transforma?** | Sesión autenticada operable |
| **¿Qué entrega?** | Usuario autenticado, listo para crear pedido (B3) |
| **Tokens** | `FLOW05_B2_STARTED` · `FLOW05_B2_COMPLETED` |

### B3 · Order Creation

| | Contrato |
|---|----------|
| **¿Qué recibe?** | Usuario autenticado (outcome B2) |
| **¿Qué transforma?** | Pedido válido creado y confirmado |
| **¿Qué entrega?** | Pedido disponible para Producción (B4) |
| **Tokens** | `FLOW05_B3_STARTED` · `FLOW05_B3_COMPLETED` |

### B4 · Production

| | Contrato |
|---|----------|
| **¿Qué recibe?** | Pedido confirmado (outcome B3) |
| **¿Qué transforma?** | Pedido en ejecución productiva (cocina / batch) |
| **¿Qué entrega?** | Outcome productivo listo para planificación de ruta (B5) |
| **Tokens** | `FLOW05_B4_STARTED` · `FLOW05_B4_COMPLETED` |

### B5 · Route Planning

| | Contrato |
|---|----------|
| **¿Qué recibe?** | Outcome productivo (outcome B4) |
| **¿Qué transforma?** | Pedido / entrega asignado a ruta operable |
| **¿Qué entrega?** | Ruta lista para ejecución de entrega (B6) |
| **Tokens** | `FLOW05_B5_STARTED` · `FLOW05_B5_COMPLETED` |

### B6 · Delivery

| | Contrato |
|---|----------|
| **¿Qué recibe?** | Ruta asignada (outcome B5) |
| **¿Qué transforma?** | Entrega ejecutada hasta estado `delivered` (o equivalente certificado) |
| **¿Qué entrega?** | Pedido entregado, listo para confirmación (B7) |
| **Tokens** | `FLOW05_B6_STARTED` · `FLOW05_B6_COMPLETED` |

### B7 · Delivery Confirmation

| | Contrato |
|---|----------|
| **¿Qué recibe?** | Pedido entregado (outcome B6) |
| **¿Qué transforma?** | Confirmación de entrega registrada (cliente / ops) |
| **¿Qué entrega?** | Entrega confirmada, lista para historial (B8) |
| **Tokens** | `FLOW05_B7_STARTED` · `FLOW05_B7_COMPLETED` |

### B8 · History

| | Contrato |
|---|----------|
| **¿Qué recibe?** | Entrega confirmada (outcome B7) · sesión del cliente autenticado |
| **¿Qué transforma?** | Pedido visible y legible en Historial del cliente |
| **¿Qué entrega?** | Ciclo cerrado — **END** del Flow |
| **Tokens** | `FLOW05_B8_STARTED` · `FLOW05_B8_COMPLETED` |

---

## 4. Tokens documentales (contrato)

Orden inmutable:

```text
FLOW05_B1_STARTED
FLOW05_B1_COMPLETED
FLOW05_B2_STARTED
FLOW05_B2_COMPLETED
FLOW05_B3_STARTED
FLOW05_B3_COMPLETED
FLOW05_B4_STARTED
FLOW05_B4_COMPLETED
FLOW05_B5_STARTED
FLOW05_B5_COMPLETED
FLOW05_B6_STARTED
FLOW05_B6_COMPLETED
FLOW05_B7_STARTED
FLOW05_B7_COMPLETED
FLOW05_B8_STARTED
FLOW05_B8_COMPLETED
```

Solo documentación en este PR.  
Once-only · en orden · sin duplicates · sin missing · sin out_of_order (cuando exista Runner).

---

## 5. Relación con capacidades ya certificadas

FLOW-05 **encadena**; no re-certifica módulos:

| Bloque | Capacidad ancla (ya certificada) |
|--------|----------------------------------|
| B1–B2 | P1 Auth / Profiles · P2 Customers · PS-002-C |
| B3 | P2 Orders |
| B4 | P3 Production · FLOW-01 |
| B5–B6 | P3 Routes / Deliveries · FLOW-01 |
| B7 | Handoff delivery confirmado (FLOW-01 context) |
| B8 | Orders + sesión autenticada |

FLOW-02 (incidencias), FLOW-03 (billing), FLOW-04 (inventario) **no** forman parte del happy path FLOW-05.

---

## 6. Fuera de alcance (explícito)

| Excluye | Motivo |
|---------|--------|
| Capacitor | Solo tras `flow05-pass` |
| Billing / facturación / cobro | FLOW-03 CERTIFIED |
| Inventory / consumo de stock | FLOW-04 CERTIFIED |
| Incident Management / reintentos | FLOW-02 CERTIFIED |
| Notifications fuera del flujo | No es handoff B1–B8 |
| Store deployment · App Store · Play Store | Post `flow05-pass` |
| Re-certificar RELEASE-01 / P1–P5 | Producto ya `release-01-pass` |
| Infraestructura · Observabilidad · Analytics | Fuera de Flow |
| Nuevos módulos / lógica de negocio | Solo vía renegociación Freeze |
| Runner · drivers · tests · `src/` | Entregas posteriores |

---

## 7. PASS / BLOCKED / FAIL (expectativas)

| Estado | Significa |
|--------|-----------|
| **PASS** | Prefijo certificado de tokens B1…Bn en orden · arrays vacíos |
| **FAIL** | Contrato implementado roto (duplicate / missing / out_of_order / invariante) |
| **BLOCKED** | Siguiente bloque aún no implementado — **no es defecto** |

### FULL PASS (futuro · tras Runner + B1…B8)

```text
FLOW-05
PASS
FLOW05_B1_STARTED … FLOW05_B8_COMPLETED
duplicates=[]
missing=[]
out_of_order=[]
```

Tag futuro: `flow05-pass` — solo tras acta + evidencia live.

---

## 8. Futuro Runner (documental · no implementar)

Tras Spec Freeze + Runner en `main`, el baseline esperado será:

```bash
npm run test:flow05-canonical
```

```text
FLOW-05
BLOCKED
blocked_at=FLOW05_B1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

Exit code canónico: **2** (BLOCKED).

**Este PR no crea** `scripts/flow05-canonical.mjs` · drivers · tests · entradas en `package.json`.

---

## 9. Evidence contract (ubicación futura)

| Artefacto | Path |
|-----------|------|
| DoR | `docs/00-status/FLOW_05_CUSTOMER_EXPERIENCE_DOR.md` |
| Spec (este) | `docs/00-status/FLOW_05_SPEC.md` |
| Runner docs | `docs/10-validation/flow-05/FLOW_05_RUNNER.md` |
| Actas Bₙ | `docs/10-validation/flow-05/FLOW05_00N_B*_ACTA.md` · [001](../10-validation/flow-05/FLOW05_001_B1_ACTA.md) · [002](../10-validation/flow-05/FLOW05_002_B2_ACTA.md) · [003](../10-validation/flow-05/FLOW05_003_B3_ACTA.md) · [004](../10-validation/flow-05/FLOW05_004_B4_ACTA.md) · [005](../10-validation/flow-05/FLOW05_005_B5_ACTA.md) · [006](../10-validation/flow-05/FLOW05_006_B6_ACTA.md) · [007](../10-validation/flow-05/FLOW05_007_B7_ACTA.md) |
| PASS acta | `docs/10-validation/flow-05/FLOW05_PASS_ACTA.md` |
| Evidence JSON | `docs/10-validation/flow-05/evidence/` |

---

## 10. Gate · Abrir FLOW05-001

FLOW05-001 (B1 Registration) **solo** cuando:

| # | Condición |
|---|-----------|
| 1 | Spec mergeada en `main` → FLOW-05 **FROZEN** |
| 2 | Runner mergeado en `main` |
| 3 | Desde `main`: runner → BLOCKED at `FLOW05_B1_STARTED` · arrays vacíos · `evidence={}` |
| 4 | Contrato `FLOW05_B*` sin renegociación abierta |

Hasta entonces: **prohibido** implementación de dominio · Capacitor · Gate de 001.

---

## 11. Plan de trabajo

| Fase | Trabajo | Estado |
|------|---------|--------|
| 0 | DoR | ✅ #236 |
| 1 | Spec (contract only) | ✅ FROZEN #237 |
| 2 | Freeze (merge Spec → main) | ✅ #237 · `deba9f6` |
| 3 | Runner only · BLOCKED at B1 | ✅ #238 · `7381ff2` |
| 4 | Gate FLOW05-001 | ✅ READY #239 · `eb07a1a` |
| 5 | FLOW05-001 · B1 Registration | ✅ #240 · `07a19b4` |
| 5b | FLOW05-002 · B2 Authentication | ✅ #241 · `5933f96` |
| 5c | FLOW05-003 · B3 Order Creation | ✅ #242 · `ae8764d` |
| 5d | FLOW05-004 · B4 Production | ✅ #243 · `1181c21` |
| 5e | FLOW05-005 · B5 Route Planning | ✅ #244 · `f0e1ebc` |
| 5f | FLOW05-006 · B6 Delivery | ✅ #245 · `7c17569` |
| 5g | FLOW05-007 · B7 Delivery Confirmation | ✅ este PR · CERTIFIED_THROUGH=7 |
| 5h | FLOW05-008 · B8 History | ⏳ next · 008 |
| 6 | FULL PASS · tag `flow05-pass` | ⏳ |
| 7 | Capacitor / build móvil EatClean | ⏳ **solo tras** `flow05-pass` |

---

## 12. Fuera de este PR

- Runner · Gate · scripts · tests · `package.json`  
- Cualquier cambio en `src/` o migraciones  
- Capacitor · stores · reabrir RELEASE-01  
- Ampliar B1–B8  

---

## 13. Next

```text
Spec FROZEN ✅
Runner ✅
Gate ✅ READY
    ↓
READY TO OPEN
FLOW05-001 · B1 Registration only
```

---

## End of FLOW-05 Spec
