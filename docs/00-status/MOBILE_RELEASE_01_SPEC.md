# MOBILE-RELEASE-01 · Specification

**Documento:** `MOBILE_RELEASE_01_SPEC.md`  
**Fecha:** 2026-08-03  
**Estado:** ✅ **FROZEN** (#260) · DoR ✅ · Runner ✅ · Gate ✅ READY · MR01-001 ✅ · MR01-002 ✅ · MR01-003 ▶ · CERTIFIED_THROUGH=3 · BLOCKED at MR4  
**Dominio:** **Distribution** · operación real (pipeline de entrega móvil)  
**Nivel:** Mobile Production Readiness · YourMeal OS (tenant-agnostic)  
**Pregunta (única):** ¿YourMeal OS puede distribuirse de forma privada (Internal Testing) con builds reproducibles, firmados y versionados, sin modificar el Core SaaS certificado?  
**DoR:** [MOBILE_RELEASE_01_DOR](./MOBILE_RELEASE_01_DOR.md) ✅ (#259)  
**Runner:** 🔒 (siguiente ciclo · tras Freeze en `main`)  
**Gate:** 🔒  
**Estándar:** [Evidence before Implementation](./EVIDENCE_BEFORE_IMPLEMENTATION.md) · [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md) · [FOUNDATION](../../FOUNDATION.md) (Native Tool Artifacts)  
**Precondiciones:** tag `capacitor-pass` → `400a010` · Capacitor Gate CLOSED · `flow05-pass` · `release-01-pass`  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md) · [CURRENT_PHASE](./CURRENT_PHASE.md)

> MOBILE-RELEASE **no** es funcionalidad de negocio.  
> MOBILE-RELEASE **no** reescribe el Core.  
> MOBILE-RELEASE certifica el **pipeline de entrega móvil** hacia Internal Testing.  
> **Core Integrity Rule** · Evidence before Implementation · No Artificiality.

---

## Pregunta de dominio

> ¿YourMeal OS certifica la distribución privada del Core  
> (Preparation → Android Build → Android Signing → iOS Archive → Internal Testing Acceptance)  
> como un contrato `MOBILE_RELEASE_MR*` verificable, sin reabrir Capacitor ni FLOW-05?

No: *¿está publicada en Play / App Store Production?* · *¿hay push / cámara / GPS?*  
Sí: *¿el mismo Core se entrega de forma profesional, repetible y privada a testers?*

Separación de responsabilidades:

```text
Capacitor          → ¿puede ejecutarse como app nativa?
MOBILE-RELEASE-01  → ¿puede distribuirse de forma profesional y repetible (privada)?
```

---

## 1. Contract Boundary (inmutable tras Freeze)

### Principio arquitectónico

```text
Core SaaS
    ↓
Capacitor (Distribution Certified)
    ↓
MOBILE-RELEASE pipeline
    ↓
Internal Testing (Android + iOS)
```

**Nunca al revés.**  
No reabre Capacitor C1–C5. No redefine Business / Experience.

### START

```text
START = Distribution Certified
        (tag capacitor-pass · C1–C5 FULL PASS · Gate CLOSED)
```

Primer token: `MOBILE_RELEASE_MR1_STARTED` / `MOBILE_RELEASE_MR1_COMPLETED`.

### END

```text
END = Ready for Internal Testing
      (Android + iOS · distribución privada operativa)
```

Último token: `MOBILE_RELEASE_MR5_STARTED` / `MOBILE_RELEASE_MR5_COMPLETED`.

### Freeze rule

```text
Toda modificación posterior del recorrido DEBE cambiar este Spec.
NO se amplía durante Runner.
NO se amplía durante implementación.
NO se amplía durante certificación.
```

Si una capacidad no aparece en §2 ni en START→END, **no entra** en MOBILE-RELEASE-01 sin renegociar el Freeze.

### Core Integrity Rule

```text
Todo el pipeline Mobile Release podrá añadir infraestructura de distribución.
Nunca podrá modificar el comportamiento certificado del Core SaaS.

Distribution puede añadir builds · firma · versionado · CI · canales privados.
Distribution no puede alterar FLOW-05 / RELEASE-01 / lógica Business.
```

| Implica | |
|---------|---|
| Sí | Gradle/Xcode release config · signing · versioning · CI artifacts · Internal Testing channels |
| No | Cambiar contratos FLOW / RELEASE · “versión móvil” del Core · features nativas de dispositivo |
| Si un cambio altera el Core | **Deja de pertenecer a MOBILE-RELEASE** — requiere Platform / Business / Experience |

Esta regla es **inmutable** tras Freeze junto con el Contract Boundary.

---

## 2. Mobile Release Journey (secuencia congelada)

```text
MR1 Preparation
    ↓
MR2 Android Build
    ↓
MR3 Android Signing
    ↓
MR4 iOS Archive
    ↓
MR5 Internal Testing Acceptance
```

**No modificar esta secuencia** sin acta de renegociación del Spec.

```text
Distribution Certified
        │
        ▼
MR1 Preparation
        │
        ▼
MR2 Android Build
        │
        ▼
MR3 Android Signing
        │
        ▼
MR4 iOS Archive
        │
        ▼
MR5 Internal Testing Acceptance
        │
        ▼
Ready for Internal Testing
```

---

## 3. Contratos por bloque (entrada → transformación → salida)

Cada bloque responde exactamente: Objetivo · Entrada · Transformación · Salida.  
Spec congela el contrato; Runner e implementación solo evidencian estos handoffs.

### MR1 · Preparation

| | Contrato |
|---|----------|
| **Objetivo** | Preparar el proyecto para un pipeline de entrega móvil privado, sin generar aún artefactos firmados |
| **Entrada** | Distribution Certified (`capacitor-pass`) · DoR MOBILE-RELEASE-01 |
| **Transformación** | Versionado definido · release checklist · secret/signing *policy* (sin secretos en git) · Native Tool Artifacts limpios |
| **Salida** | Ready for Android Build |
| **Tokens** | `MOBILE_RELEASE_MR1_STARTED` · `MOBILE_RELEASE_MR1_COMPLETED` |

### MR2 · Android Build

| | Contrato |
|---|----------|
| **Objetivo** | Producir artefactos Android reproducibles a partir del mismo Core |
| **Entrada** | Ready for Android Build (outcome MR1) |
| **Transformación** | Pipeline de build Android: APK Debug · APK Release · AAB (sin exigir Internal Testing aún) |
| **Salida** | Ready for Android Signing |
| **Tokens** | `MOBILE_RELEASE_MR2_STARTED` · `MOBILE_RELEASE_MR2_COMPLETED` |

### MR3 · Android Signing

| | Contrato |
|---|----------|
| **Objetivo** | Firmar artefactos Android de forma gobernada y repetible |
| **Entrada** | Ready for Android Signing (outcome MR2) |
| **Transformación** | Keystore / signing config · secret management · artefactos Release firmados |
| **Salida** | Ready for iOS Archive |
| **Tokens** | `MOBILE_RELEASE_MR3_STARTED` · `MOBILE_RELEASE_MR3_COMPLETED` |

### MR4 · iOS Archive

| | Contrato |
|---|----------|
| **Objetivo** | Producir archive iOS reproducible a partir del mismo Core |
| **Entrada** | Ready for iOS Archive (outcome MR3) |
| **Transformación** | Xcode Archive (`.xcarchive`) · versionado iOS · signing/provisioning para distribución privada (no Production store) |
| **Salida** | Ready for Internal Testing Acceptance |
| **Tokens** | `MOBILE_RELEASE_MR4_STARTED` · `MOBILE_RELEASE_MR4_COMPLETED` |

### MR5 · Internal Testing Acceptance

| | Contrato |
|---|----------|
| **Objetivo** | Aceptar que Android + iOS están listos para distribución privada operativa |
| **Entrada** | Ready for Internal Testing Acceptance (outcome MR4) · artefactos Android firmados + iOS archive |
| **Transformación** | CI/CD de builds (si aplica al contrato) · canales Internal Testing (Play Internal · TestFlight) · Acceptance operativa · Core Integrity intacta |
| **Salida** | **Ready for Internal Testing** · END del ciclo MOBILE-RELEASE-01 |
| **Tokens** | `MOBILE_RELEASE_MR5_STARTED` · `MOBILE_RELEASE_MR5_COMPLETED` |

---

## 4. Tokens documentales (contrato)

Orden inmutable:

```text
MOBILE_RELEASE_MR1_STARTED
MOBILE_RELEASE_MR1_COMPLETED
MOBILE_RELEASE_MR2_STARTED
MOBILE_RELEASE_MR2_COMPLETED
MOBILE_RELEASE_MR3_STARTED
MOBILE_RELEASE_MR3_COMPLETED
MOBILE_RELEASE_MR4_STARTED
MOBILE_RELEASE_MR4_COMPLETED
MOBILE_RELEASE_MR5_STARTED
MOBILE_RELEASE_MR5_COMPLETED
```

Solo documentación en este PR.  
Once-only · en orden · sin duplicates · sin missing · sin out_of_order (cuando exista Runner).

Entregas incrementales (borrador de IDs · Runner congela numeración):

```text
MR01-001 · MR1 Preparation
MR01-002 · MR2 Android Build
MR01-003 · MR3 Android Signing
MR01-004 · MR4 iOS Archive
MR01-005 · MR5 Internal Testing Acceptance
```

---

## 5. Relación con dominios ya certificados

MOBILE-RELEASE **entrega**; no re-certifica:

| Dominio | Relación |
|---------|----------|
| Platform | Core SaaS operable |
| Business | Módulos intactos |
| Experience | FLOW-05 (`flow05-pass`) intacto |
| Distribution · Capacitor | `capacitor-pass` = START · no reabrir C1–C5 |
| Distribution · MOBILE-RELEASE | Este Spec — pipeline privado |

```text
Platform + Business + Experience
            │
            ▼
       Capacitor (shell)
            │
            ▼
    MOBILE-RELEASE-01 (entrega privada)
```

---

## 6. Fuera de alcance (explícito · MOBILE-RELEASE-01)

| Excluye | Motivo |
|---------|--------|
| Google Play Production | MOBILE-RELEASE-02 (candidato) |
| App Store Production | MOBILE-RELEASE-02 (candidato) |
| Push Notifications | Capacidad nativa posterior |
| Deep Links | Capacidad nativa posterior |
| GPS · Camera · Biometrics | Capacidad nativa posterior |
| Widgets · Background Tasks | Capacidad nativa posterior |
| OTA Updates | Ciclo / decisión posterior |
| Reescritura del Core / segunda app | Viola Core Integrity |
| Nueva lógica de negocio “porque es móvil” | Business / Experience |
| Re-certificar Capacitor / FLOW-05 / RELEASE-01 | Ya cerrados · solo regresión |
| Runner · Gate · scripts · GitHub Actions · código · `package.json` · android/ · ios/ | Fuera de **este** PR |

**Regla anti-crecimiento:** si no es Preparation · Android Build · Android Signing · iOS Archive · Internal Testing Acceptance, **no entra** sin renegociar Freeze.

---

## 7. PASS esperado (futuro · tras Runner + MR1…MR5)

```text
STATUS=PASS
MOBILE_RELEASE_MR1_STARTED … MOBILE_RELEASE_MR5_COMPLETED
duplicates=[]
missing=[]
out_of_order=[]
certified_through=MR5
blocked_at=—
```

Significado: **Ready for Internal Testing** — pipeline de entrega móvil privado certificado sin modificar el Core.

Tag de cierre (nombre a fijar en Runner / PASS acta): p. ej. `mobile-release-01-pass` (no creado en este PR).

---

## 8. BLOCKED esperado (baseline Runner)

Con Runner institucionalizado y sin drivers de bloque:

```text
STATUS=BLOCKED
blocked_at=MOBILE_RELEASE_MR1_STARTED
duplicates=[]
missing=[]
out_of_order=[]
evidence={}
```

Con entregas parciales: PASS through MRn · BLOCKED at MR(n+1)_STARTED.

---

## 9. Invariantes (congelados con el Spec)

| ID | Invariante |
|----|------------|
| I1 | Core SaaS no depende de Mobile Release |
| I2 | Mobile Release no redefine contratos Business / Experience |
| I3 | Tenant isolation intacta en canal nativo (mismo Core) |
| I4 | Un solo Core — no segunda aplicación React |
| I5 | Artefactos Android e iOS parten del mismo artefacto web certificado |
| I6 | Evidence tokens once-only · en orden · sin duplicates |
| I7 | Production stores · push · device APIs fuera de MOBILE-RELEASE-01 |
| I8 | **Core Integrity** — pipeline no altera comportamiento funcional del Core |
| I9 | **No Artificiality** — no simular Internal Testing · no mockear firma |
| I10 | **Native Tool Artifacts** — IDE sync ≠ producto hasta aceptación explícita |

---

## 10. Criterios Freeze → Runner → Gate → 001

Tras merge de este Spec en `main` (Freeze institucional):

```text
1. Spec FROZEN en main
2. Runner (PR aparte) · baseline BLOCKED at MOBILE_RELEASE_MR1_STARTED
3. Gate READY (PR aparte) · autoriza MR01-001
4. MR01-001 · MR1 Preparation only
   (una transición / PR)
```

```text
READY TO OPEN (tras Freeze + Runner + Gate)
MR01-001 · MR1 Preparation only
No MR2+ · No APK prematuro · No stores · No device APIs
```

---

## 11. Paths de evidencia (plantilla · Runner congela)

| Artefacto | Path propuesto |
|-----------|----------------|
| Runner docs | `docs/10-validation/mobile-release-01/` |
| Actas MRn | `docs/10-validation/mobile-release-01/MR01_00N_*_ACTA.md` |
| PASS acta | `docs/10-validation/mobile-release-01/MOBILE_RELEASE_01_PASS_ACTA.md` |
| Evidence JSON | `docs/10-validation/mobile-release-01/evidence/` |

No crear estos paths en este PR.

---

## 12. Ritual de trabajo (permanente)

Toda implementación posterior usa:

```text
🎯 Objetivo
📍 Lugar     → Cursor | Terminal | Android Studio | Xcode | GitHub
▶️ Pasos     → numerados · una herramienta por bloque
✅ Resultado
🚫 Qué NO
```

Nunca mezclar herramientas en el mismo bloque de pasos.

---

## Next

```text
Gate READY · Runner BLOCKED at MR1
    ↓
Land Check from main
    ↓
MR01-001 · MR1 Preparation only
```

---

## End of MOBILE-RELEASE-01 Spec
