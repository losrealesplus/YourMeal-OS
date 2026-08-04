# STORE-RELEASE-01 · Specification

**Documento:** `STORE_RELEASE_01_SPEC.md`  
**Fecha:** 2026-08-04  
**Estado:** ✅ **FROZEN** (este PR) · DoR ✅ (#269) · Runner 🔒 · Gate 🔒 · SR1…SR5 🔒 · stores uploads 🔒  
**Dominio:** **Store Distribution** · operación real de plataformas (no producto · no binarios)  
**Nivel:** Store Distribution Readiness · YourMeal OS (tenant-agnostic)  
**Pregunta (única):** ¿Cómo se distribuye oficialmente YourMeal OS en los ecosistemas Google Play y Apple App Store?  
**DoR:** [STORE_RELEASE_01_DOR](./STORE_RELEASE_01_DOR.md) ✅ (#269)  
**Runner:** 🔒 (siguiente ciclo · tras Freeze en `main`)  
**Gate:** 🔒  
**Estándar:** [Evidence before Implementation](./EVIDENCE_BEFORE_IMPLEMENTATION.md) · [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md) · [FOUNDATION](../../FOUNDATION.md)  
**Precondiciones:** tag `mobile-release-01-pass` → `ca3e823` · MOBILE-RELEASE-01 Gate CLOSED · `capacitor-pass` · `flow05-pass` · `release-01-pass`  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md) · [CURRENT_PHASE](./CURRENT_PHASE.md)

> STORE-RELEASE **no** es funcionalidad de negocio.  
> STORE-RELEASE **no** reescribe el Core.  
> STORE-RELEASE **no** reabre Capacitor ni MOBILE-RELEASE.  
> STORE-RELEASE certifica la **operación de distribución en plataformas oficiales**.  
> **Core Integrity Rule** · Binary Boundary · Evidence before Implementation · No Artificiality.

---

## Pregunta de dominio

> ¿YourMeal OS certifica la distribución oficial del Core  
> (Preparation → Play Internal → Play Closed → TestFlight → Production Readiness)  
> como un contrato `STORE_RELEASE_SR*` verificable, sin reabrir MOBILE-RELEASE ni Capacitor?

No: *¿hay push / cámara / GPS / compras in-app?*  
No: *¿hay que recompilar el pipeline de binarios?*  
Sí: *¿el mismo Core se opera en Play Console y App Store Connect de forma profesional y repetible?*

Separación de responsabilidades:

```text
Capacitor          → ¿puede ejecutarse como app nativa?
MOBILE-RELEASE-01  → ¿puede generar binarios listos (privados)?
STORE-RELEASE-01   → ¿puede operarse en las plataformas de distribución?
```

---

## 1. Contract Boundary (inmutable tras Freeze)

### Principio arquitectónico

```text
Core SaaS
    ↓
Capacitor (Distribution Certified)
    ↓
MOBILE-RELEASE (Ready for Internal Testing)
    ↓
STORE-RELEASE pipeline
    ↓
Production Ready
```

**Nunca al revés.**  
No reabre Capacitor C1–C5.  
No reabre MOBILE-RELEASE MR1–MR5.  
No redefine Business / Experience.

### START

```text
START = Ready for Internal Testing
        (tag mobile-release-01-pass · MR1–MR5 FULL PASS · Gate CLOSED)
```

Primer token: `STORE_RELEASE_SR1_STARTED` / `STORE_RELEASE_SR1_COMPLETED`.

### END

```text
END = Production Ready
      (Play + App Store Connect gobernados · Production Readiness certificada)
```

Último token: `STORE_RELEASE_SR5_STARTED` / `STORE_RELEASE_SR5_COMPLETED`.

> **Production Ready** ≠ “publicado a todo el mundo automáticamente”.  
> Significa: el contrato de producción (cuentas · versionado · canales · checklist · retiro/rollout) está certificado y listo para operar.

### Freeze rule

```text
Toda modificación posterior del recorrido DEBE cambiar este Spec.
NO se amplía durante Runner.
NO se amplía durante implementación.
NO se amplía durante certificación.
```

Si una capacidad no aparece en §2 ni en START→END, **no entra** en STORE-RELEASE-01 sin renegociar el Freeze.

### Core Integrity Rule

```text
Todo el pipeline Store Release podrá añadir infraestructura de distribución en stores.
Nunca podrá modificar el comportamiento certificado del Core SaaS.

Store Distribution puede añadir consolas · canales · listings · rollouts · CI de upload.
Store Distribution no puede alterar FLOW-05 / RELEASE-01 / lógica Business /
ni reabrir Capacitor / MOBILE-RELEASE.
```

### Binary Boundary Rule

```text
STORE-RELEASE consume artefactos de MOBILE-RELEASE.
NO reabre MR1–MR5.
NO sustituye runners de build por “subí un APK a mano sin evidencia”.
```

| Implica | |
|---------|---|
| Sí | Play Console · App Store Connect · Internal/Closed · TestFlight · Production Readiness · secretos de store · versionado de store · rollouts |
| No | Cambiar contratos FLOW / RELEASE · features nativas · recompilar “porque el store lo pide” sin FOPEBA |

---

## 2. Journey congelado (SR1…SR5)

```text
mobile-release-01-pass
        │
        ▼
SR1 · Preparation
        │
        ▼
SR2 · Google Play Internal Testing
        │
        ▼
SR3 · Google Play Closed Testing
        │
        ▼
SR4 · Apple TestFlight
        │
        ▼
SR5 · Production Readiness
        │
        ▼
Production Ready · STORE-RELEASE-01 PASS
```

### SR1 · Preparation

| | Contrato |
|---|----------|
| **Objetivo** | Preparar el proyecto para operar consolas y secretos de store sin publicar aún |
| **Entrada** | Ready for Internal Testing (`mobile-release-01-pass`) · DoR STORE-RELEASE-01 |
| **Transformación** | Política de cuentas · secretos fuera de Git · versionado de store · checklist de preparación · gobernanza multitenant (contrato) |
| **Salida** | Ready for Google Play Internal Testing |
| **Tokens** | `STORE_RELEASE_SR1_STARTED` · `STORE_RELEASE_SR1_COMPLETED` |

### SR2 · Google Play Internal Testing

| | Contrato |
|---|----------|
| **Objetivo** | Certificar el canal privado Internal Testing de Google Play |
| **Entrada** | Ready for Google Play Internal Testing (outcome SR1) |
| **Transformación** | Track Internal · upload de artefacto AAB/APK proveniente de MOBILE-RELEASE · testers privados · evidencia de canal |
| **Salida** | Ready for Google Play Closed Testing |
| **Tokens** | `STORE_RELEASE_SR2_STARTED` · `STORE_RELEASE_SR2_COMPLETED` |

### SR3 · Google Play Closed Testing

| | Contrato |
|---|----------|
| **Objetivo** | Certificar el canal Closed Testing de Google Play |
| **Entrada** | Ready for Google Play Closed Testing (outcome SR2) |
| **Transformación** | Track Closed · cohortes · evidencia de distribución cerrada (no Production abierta) |
| **Salida** | Ready for Apple TestFlight |
| **Tokens** | `STORE_RELEASE_SR3_STARTED` · `STORE_RELEASE_SR3_COMPLETED` |

### SR4 · Apple TestFlight

| | Contrato |
|---|----------|
| **Objetivo** | Certificar distribución privada iOS vía TestFlight |
| **Entrada** | Ready for Apple TestFlight (outcome SR3) |
| **Transformación** | App Store Connect · build desde Archive MOBILE-RELEASE · TestFlight interno/externo según contrato · evidencia |
| **Salida** | Ready for Production Readiness |
| **Tokens** | `STORE_RELEASE_SR4_STARTED` · `STORE_RELEASE_SR4_COMPLETED` |

### SR5 · Production Readiness

| | Contrato |
|---|----------|
| **Objetivo** | Aceptar que Play + App Store Connect están listos para operar Production de forma gobernada |
| **Entrada** | Ready for Production Readiness (outcome SR4) · canales privados certificados |
| **Transformación** | Checklist Production · versionado/rollout/retiro · App Signing / store secrets policy · Acceptance operativa · Core Integrity intacta |
| **Salida** | **Production Ready** · END del ciclo STORE-RELEASE-01 |
| **Tokens** | `STORE_RELEASE_SR5_STARTED` · `STORE_RELEASE_SR5_COMPLETED` |

---

## 3. Tokens documentales (contrato)

Orden inmutable:

```text
STORE_RELEASE_SR1_STARTED
STORE_RELEASE_SR1_COMPLETED
STORE_RELEASE_SR2_STARTED
STORE_RELEASE_SR2_COMPLETED
STORE_RELEASE_SR3_STARTED
STORE_RELEASE_SR3_COMPLETED
STORE_RELEASE_SR4_STARTED
STORE_RELEASE_SR4_COMPLETED
STORE_RELEASE_SR5_STARTED
STORE_RELEASE_SR5_COMPLETED
```

Solo documentación en este PR.  
Once-only · en orden · sin duplicates · sin missing · sin out_of_order (cuando exista Runner).

Entregas incrementales (IDs · Runner congela numeración):

```text
SR01-001 · SR1 Preparation
SR01-002 · SR2 Google Play Internal Testing
SR01-003 · SR3 Google Play Closed Testing
SR01-004 · SR4 Apple TestFlight
SR01-005 · SR5 Production Readiness
```

---

## 4. Relación con dominios ya certificados

STORE-RELEASE **distribuye**; no re-certifica:

| Dominio | Relación |
|---------|----------|
| Platform | Core SaaS operable |
| Business | Módulos intactos |
| Experience | FLOW-05 (`flow05-pass`) intacto |
| Distribution · Capacitor | `capacitor-pass` · shell |
| Distribution · MOBILE-RELEASE | `mobile-release-01-pass` = START · no reabrir MR1–MR5 |
| Distribution · STORE-RELEASE | Este Spec — operación en stores |

```text
Platform + Business + Experience
            │
            ▼
       Capacitor (shell)
            │
            ▼
    MOBILE-RELEASE-01 (binarios)
            │
            ▼
    STORE-RELEASE-01 (plataformas)
```

---

## 5. Fuera de alcance (explícito · STORE-RELEASE-01)

| Excluye | Motivo |
|---------|--------|
| Push Notifications | `MOBILE-CAPABILITIES-*` (candidato) |
| Deep Links | Capacidad nativa posterior |
| GPS · Camera · Biometría · NFC | Capacidad nativa posterior |
| Widgets · Live Activities · Wear OS · Apple Watch | Capacidad nativa posterior |
| Sign in with Apple · Google Sign-In | Capacidad / auth nativa posterior |
| In-App Purchases · Subscriptions | Ciclo comercial posterior |
| Reabrir Capacitor C1–C5 | Ya `capacitor-pass` |
| Reabrir MOBILE-RELEASE MR1–MR5 | Ya `mobile-release-01-pass` |
| Nueva lógica de negocio “porque hay store” | Business / Experience |
| Runner · Gate · scripts · package.json · uploads | Fuera de **este** PR (Spec only) |

**Regla anti-crecimiento:** si no es Preparation · Play Internal · Play Closed · TestFlight · Production Readiness, **no entra** sin renegociar Freeze.

---

## 6. Evidencia (contrato)

Paths candidatos (Runner institucionaliza):

| Artefacto | Path candidato |
|-----------|----------------|
| Runner docs | `docs/10-validation/store-release/` |
| Actas SRn | `docs/10-validation/store-release/SR01_00N_*_ACTA.md` |
| PASS acta | `docs/10-validation/store-release/STORE_RELEASE_01_PASS_ACTA.md` |
| Evidence JSON | `docs/10-validation/store-release/evidence/` |

Cada bloque SR1…SR5 produce evidencia verificable (consola · build ID · track · testers · checklist).  
No Artificiality: no simular review aprobada · no inventar TestFlight · no mockear Play tracks.

Tag de cierre (nombre a fijar en Runner / PASS acta): `store-release-01-pass` (no creado en este PR).

---

## 7. PASS / BLOCKED esperados (cuando exista Runner)

```text
# runner-only / baseline
BLOCKED
blocked_at=STORE_RELEASE_SR1_STARTED
exit 2

# --live through CERTIFIED_THROUGH (progresivo)
PASS through SRn · blocked_at=STORE_RELEASE_SR{n+1}_STARTED
exit 0

# FULL PASS
PASS through SR5 · STORE-RELEASE FULL PASS · Production Ready
certified_through=SR5 · blocked_at=—
exit 0
```

---

## 8. Criterios para abrir Runner

Abrir Runner solo cuando:

```text
1. Este Spec esté mergeado en main (FROZEN)
2. DoR permanezca válido (pregunta única intacta)
3. Tokens STORE_RELEASE_SR1…SR5 estén congelados
4. Paths de evidencia estén declarados
5. No se suban builds a consolas hasta Gate READY + SR01-001
```

```text
READY TO OPEN
STORE-RELEASE-01 Runner only
No Gate · No SR01-001 · No Play upload · No TestFlight · No CI
```

---

## 9. Secuencia FOPEBA (post-Spec)

```text
1. Este Spec FROZEN (este PR)
2. Runner (PR aparte) · baseline BLOCKED at STORE_RELEASE_SR1_STARTED
3. Gate READY (PR aparte) · autoriza SR01-001
4. SR01-001 · SR1 Preparation only
5. … SR01-005
6. PASS · tag store-release-01-pass
```

---

## Next

```text
Merge este Spec
    ↓
Land Check (contrato FROZEN en main)
    ↓
STORE-RELEASE-01 Runner only
    ↓
Gate READY
    ↓
SR01-001 · SR1 Preparation only
```

**Prohibido prematuro:** uploads a Play/App Store · CI de store · reabrir MOBILE-RELEASE · capacidades nativas · In-App Purchases.

---

## End of STORE-RELEASE-01 Spec
