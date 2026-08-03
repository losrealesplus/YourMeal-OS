# Capacitor · Distribution · Specification

**Documento:** `CAPACITOR_SPEC.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ **FROZEN** (#250) · DoR ✅ · Runner ✅ · Gate ✅ READY · CAPACITOR-001…003 ▶ · CERTIFIED_THROUGH=3 · BLOCKED at C4  
**Dominio:** **Distribution**  
**Nivel:** Infraestructura de distribución · YourMeal OS (tenant-agnostic)  
**Pregunta (única):** ¿YourMeal OS puede distribuirse como shell nativo (Android + iOS) sin modificar el Core SaaS certificado?  
**DoR:** [CAPACITOR_DOR](./CAPACITOR_DOR.md)  
**Runner:** [CAPACITOR_RUNNER](../10-validation/capacitor/CAPACITOR_RUNNER.md)  
**Gate:** [CAPACITOR_GATE](../10-validation/capacitor/CAPACITOR_GATE.md)  
**Estándar:** [Evidence before Implementation](./EVIDENCE_BEFORE_IMPLEMENTATION.md) · [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md)  
**Precondiciones:** tag `flow05-pass` · tag `release-01-pass` · FLOW-05 Gate CLOSED  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md) · [CURRENT_PHASE](./CURRENT_PHASE.md)

> Capacitor **no** es funcionalidad de negocio.  
> Capacitor **no** reescribe el Core.  
> Capacitor certifica **Distribution**: el mismo SaaS web, empaquetado en shell nativo.  
> **Core Integrity Rule** · Evidence before Implementation.

---

## Pregunta de dominio

> ¿YourMeal OS certifica la distribución del Core SaaS  
> (Platform Preparation → Native Shell → Android Build → iOS Build → Acceptance)  
> como un contrato `CAPACITOR_C*` verificable, sin reabrir FLOW-05 ni RELEASE-01?

No: *¿hay app publicada en stores?* · *¿hay push / cámara / GPS?*  
Sí: *¿el mismo Core se empaqueta de forma reproducible en Android e iOS?*

---

## 1. Contract Boundary (inmutable tras Freeze)

### Principio arquitectónico

```text
Core SaaS
    ↓
Capacitor
    ↓
Android / iOS
```

**Nunca al revés.**  
Distribution pertenece al dominio **Distribution**, no a **Business** ni a **Experience**.

### START

```text
START = YourMeal OS Web certificado
        (release-01-pass · flow05-pass · Core operable en canal web)
```

Primer token: `CAPACITOR_C1_STARTED` / `CAPACITOR_C1_COMPLETED`.

### END

```text
END = Android Build reproducible
      + iOS Build reproducible
      + sin modificar el Core SaaS
```

Último token: `CAPACITOR_C5_STARTED` / `CAPACITOR_C5_COMPLETED`.

### Freeze rule

```text
Toda modificación posterior del recorrido DEBE cambiar este Spec.
NO se amplía durante Runner.
NO se amplía durante implementación.
NO se amplía durante certificación.
```

Si una capacidad no aparece en §2 ni en START→END, **no entra** en Capacitor v1 sin renegociar el Freeze.

### Core Integrity Rule

```text
Todo cambio realizado durante Distribution deberá demostrar que el
comportamiento funcional del Core SaaS permanece inalterado.

Distribution puede añadir infraestructura.
Distribution no puede modificar el comportamiento certificado del producto.
```

| Implica | |
|---------|---|
| Sí | Shell · config de empaquetado · bridges mínimos · artefactos de build |
| No | Cambiar contratos FLOW-05 / RELEASE-01 · alterar lógica Business · “versión móvil” del Core |
| Si un cambio altera el Core | **Deja de pertenecer a Distribution** — requiere dominio Platform / Business / Experience |

Esta regla es **inmutable** tras Freeze junto con el Contract Boundary.

---

## 2. Distribution Journey (secuencia a congelar)

```text
C1 Platform Preparation
    ↓
C2 Native Shell
    ↓
C3 Android Build
    ↓
C4 iOS Build
    ↓
C5 Acceptance
```

**No modificar esta secuencia** sin acta de renegociación del Spec.

---

## 3. Contratos por bloque (recibe → transforma → entrega)

Cada bloque responde exactamente tres preguntas.  
Spec congela el contrato; Runner e implementación solo evidencian estos handoffs.

### C1 · Platform Preparation

| | Contrato |
|---|----------|
| **¿Qué recibe?** | React SaaS certificado (Core web · `flow05-pass` · `release-01-pass`) |
| **¿Qué transforma?** | Proyecto preparado para integración Capacitor (sin instalar aún el shell) |
| **¿Qué entrega?** | Ready for Native Shell |
| **Tokens** | `CAPACITOR_C1_STARTED` · `CAPACITOR_C1_COMPLETED` |

### C2 · Native Shell

| | Contrato |
|---|----------|
| **¿Qué recibe?** | Ready for Native Shell (outcome C1) |
| **¿Qué transforma?** | Capacitor integrado como contenedor nativo sobre el Core |
| **¿Qué entrega?** | Ready for Android / iOS |
| **Tokens** | `CAPACITOR_C2_STARTED` · `CAPACITOR_C2_COMPLETED` |

### C3 · Android Build

| | Contrato |
|---|----------|
| **¿Qué recibe?** | Ready for Android (outcome C2 · canal Android) |
| **¿Qué transforma?** | Android build reproducible a partir del mismo Core |
| **¿Qué entrega?** | Ready for iOS |
| **Tokens** | `CAPACITOR_C3_STARTED` · `CAPACITOR_C3_COMPLETED` |

### C4 · iOS Build

| | Contrato |
|---|----------|
| **¿Qué recibe?** | Ready for iOS (outcome C3) |
| **¿Qué transforma?** | iOS build reproducible a partir del mismo Core |
| **¿Qué entrega?** | Ready for Acceptance |
| **Tokens** | `CAPACITOR_C4_STARTED` · `CAPACITOR_C4_COMPLETED` |

### C5 · Acceptance

| | Contrato |
|---|----------|
| **¿Qué recibe?** | Android + iOS builds reproducibles (outcomes C3 · C4) |
| **¿Qué transforma?** | Acceptance de Distribution (shell carga Core · sin regresión de contrato web) |
| **¿Qué entrega?** | Distribution Certified · END del ciclo Capacitor v1 |
| **Tokens** | `CAPACITOR_C5_STARTED` · `CAPACITOR_C5_COMPLETED` |

---

## 4. Tokens documentales (contrato)

Orden inmutable:

```text
CAPACITOR_C1_STARTED
CAPACITOR_C1_COMPLETED
CAPACITOR_C2_STARTED
CAPACITOR_C2_COMPLETED
CAPACITOR_C3_STARTED
CAPACITOR_C3_COMPLETED
CAPACITOR_C4_STARTED
CAPACITOR_C4_COMPLETED
CAPACITOR_C5_STARTED
CAPACITOR_C5_COMPLETED
```

Solo documentación en este PR.  
Once-only · en orden · sin duplicates · sin missing · sin out_of_order (cuando exista Runner).

---

## 5. Relación con dominios ya certificados

Capacitor **empaqueta**; no re-certifica:

| Dominio | Relación |
|---------|----------|
| Platform | Core SaaS ya operable (`release-01-pass`) |
| Business | Módulos intactos — no se reimplementan en el shell |
| Experience | FLOW-05 (`flow05-pass`) sigue siendo el contrato de negocio |
| Distribution | Este Spec — canal nativo sobre el mismo Core |

```text
Platform + Business + Experience
            │
            ▼
       Distribution (Capacitor)
```

---

## 6. Fuera de alcance (explícito · v1)

| Excluye | Motivo |
|---------|--------|
| App Store / Google Play publicación | Dominio Distribution posterior (stores) |
| Push Notifications | Capability nativa posterior |
| Deep Links | Capability nativa posterior |
| Camera · GPS · Biometrics · Background Tasks | Capability nativa posterior |
| Firebase · proveedores de push | Fuera del shell v1 |
| Certificados Apple / keystores Android / perfiles de firma | Entregas posteriores · no contrato Spec v1 |
| Android Studio / Xcode como requisito de Spec | Herramientas de build · no parte del Freeze contractual |
| Reescritura del Core / segunda app React | Viola Core → Capacitor |
| Nueva lógica de negocio “porque es móvil” | Business / Experience |
| Re-certificar FLOW-05 / RELEASE-01 / Track B | Ya cerrados; solo regresión |
| Runner · Gate · install · `package.json` · código | Fuera de **este** PR |

**Regla anti-crecimiento:** si no es preparación · shell · build Android · build iOS · acceptance de Distribution, **no entra** sin renegociar Freeze.

---

## 7. PASS esperado (futuro · tras Runner + C1…C5)

```text
STATUS=PASS
CAPACITOR_C1_STARTED … CAPACITOR_C5_COMPLETED
duplicates=[]
missing=[]
out_of_order=[]
certified_through=C5
blocked_at=—
```

Significado: Distribution Certified — Android + iOS builds reproducibles sin modificar el Core.

Tag de cierre (nombre a fijar en Runner / PASS acta): p. ej. `capacitor-pass` (no creado en este PR).

---

## 8. BLOCKED esperado (baseline Runner)

Con Runner institucionalizado y sin drivers de bloque:

```text
STATUS=BLOCKED
blocked_at=CAPACITOR_C1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

Con entregas parciales: PASS through Cn · BLOCKED at C(n+1)_STARTED.

---

## 9. Invariantes (congelados con el Spec)

| ID | Invariante |
|----|------------|
| I1 | Core SaaS no depende de Capacitor |
| I2 | Capacitor no redefine contratos de Business / Experience |
| I3 | Tenant isolation intacta en canal nativo (mismo Core) |
| I4 | Un solo Core — no segunda aplicación React |
| I5 | Builds Android e iOS parten del mismo artefacto web certificado |
| I6 | Evidence tokens once-only · en orden · sin duplicates |
| I7 | Stores · push · device APIs fuera de v1 |
| I8 | **Core Integrity** — Distribution no altera comportamiento funcional del Core SaaS |

---

## 10. Criterios Freeze → Runner → Gate → 001

Tras merge de este Spec en `main` (Freeze institucional):

```text
1. Spec FROZEN en main
2. Runner (PR aparte) · baseline BLOCKED at CAPACITOR_C1_STARTED
3. Gate READY (PR aparte) · autoriza CAPACITOR-001
4. CAPACITOR-001 · C1 Platform Preparation only
   (una transición / PR)
```

```text
READY TO OPEN (tras Freeze + Runner + Gate)
CAPACITOR-001 · C1 Platform Preparation only
No C2+ · No install prematuro · No stores · No device APIs
```

---

## 11. Paths de evidencia (plantilla · Runner congela)

| Artefacto | Path propuesto |
|-----------|----------------|
| Runner docs | `docs/10-validation/capacitor/` |
| Actas Cn | `docs/10-validation/capacitor/CAPACITOR_00N_C*_ACTA.md` |
| PASS acta | `docs/10-validation/capacitor/CAPACITOR_PASS_ACTA.md` |
| Evidence JSON | `docs/10-validation/capacitor/evidence/` |

No crear estos paths en este PR.

---

## Next

```text
Gate READY · Runner BLOCKED at C1
    ↓
Land Check from main
    ↓
CAPACITOR-001 · C1 Platform Preparation only
```

---

## End of Capacitor Spec
