# STORE-RELEASE-01 · Definition of Ready

**Documento:** `STORE_RELEASE_01_DOR.md`  
**Fecha:** 2026-08-04  
**Estado:** ✅ **DoR** (#269) · Spec ▶ FROZEN (siguiente) · Runner 🔒 · Gate 🔒 · stores 🔒 · CI 🔒  
**Dominio:** **Store Distribution** · operación real de plataformas (no producto · no binarios)  
**Nivel:** Store Distribution Readiness · YourMeal OS (tenant-agnostic)  
**Pregunta (única):** ¿Qué debe cumplir el proyecto para certificar **publicación y rollouts** en Google Play y App Store Connect (Internal → Closed → Production readiness)?  
**Metodología:** FOPEBA · [EVIDENCE_BEFORE_IMPLEMENTATION](./EVIDENCE_BEFORE_IMPLEMENTATION.md) · [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md) · [FOUNDATION](../../FOUNDATION.md)  
**Precondiciones:** tag `mobile-release-01-pass` → `ca3e823` · MOBILE-RELEASE-01 Gate CLOSED · [MOBILE_RELEASE_01_PASS_ACTA](../10-validation/mobile-release/MOBILE_RELEASE_01_PASS_ACTA.md) · `capacitor-pass` · `flow05-pass` · `release-01-pass`  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md) · [CURRENT_PHASE](./CURRENT_PHASE.md)

> Este PR responde **solo**: ¿queda definido el marco Ready de STORE-RELEASE-01?  
> **No** es Specification. **No** Freeze. **No** Runner. **No** Gate.  
> **No** reabre Capacitor. **No** reabre MOBILE-RELEASE MR1–MR5.  
> **No** genera builds. **No** sube a stores. **No** CI/CD. **No** código.

---

## 1. Objetivo del dominio STORE-RELEASE-01

Certificar la **operación de distribución en plataformas oficiales**.

No desarrolla el producto.  
No recompila el pipeline de binarios.  
Certifica únicamente **cómo publicar, versionar, hacer rollouts y gestionar cuentas/certificados de store**.

```text
Hasta mobile-release-01-pass:  Los binarios existen · Ready for Internal Testing.
A partir de aquí:              El producto puede operar en Play / App Store Connect
                               (subida · canales · revisión · readiness de Production).
```

Cambio de mentalidad:

| Antes (MOBILE-RELEASE-01) | Ahora (STORE-RELEASE-01) |
|---------------------------|--------------------------|
| ¿Compila · firma · archiva? | ¿Cómo se publica y opera en stores? |
| Artefactos APK / AAB / Archive | Consolas · canales · rollouts · revisión |
| Pipeline de **compilación** | Pipeline de **distribución** |

**Separación institucional (inmutable):**

```text
MOBILE-RELEASE  = binarios listos (compilación · firma · archive)
STORE-RELEASE   = distribución en plataformas (Play · App Store Connect)
```

Cambiar de estrategia de store **no** reabre Capacitor ni MOBILE-RELEASE.

---

## 2. Contract Boundary

### Dónde empieza

```text
START = Ready for Internal Testing
        (tag mobile-release-01-pass · MR1–MR5 FULL PASS · Gate CLOSED)
```

No empieza reabriendo MR1–MR5.  
No empieza reabriendo Capacitor C1–C5.  
No empieza en un módulo de negocio.  
No empieza inventando capacidades nativas (Push / GPS / …).

### Dónde termina

```text
END = Production Readiness
      (Play + App Store Connect gobernados · listos para Production
       según contrato Spec — no implica “ya publicado a todo el mundo”)
```

No termina en Push / Deep Links / Sign-in / Purchases / Wearables.  
No termina reescribiendo el Core.  
No termina en un FLOW de negocio nuevo.

### Qué certifica (más adelante · Spec)

- Preparación de cuentas / consolas / política de secretos de store.  
- Google Play Internal Testing.  
- Google Play Closed Testing.  
- Apple TestFlight.  
- Production Readiness (checklist · versionado de store · rollouts · retiro).  
- Gestión de certificados / claves / App Signing **en contexto store** (sin reabrir MR3).  
- Automatización CI/CD de **despliegue a stores** (candidato Spec · no este DoR).  
- Gobernanza multitenant de publicación (mismo pipeline · N tenants).

### Qué no certifica

- Capacitor v1 (ya `capacitor-pass`).  
- MOBILE-RELEASE-01 (ya `mobile-release-01-pass`).  
- Experience FLOW-05 / RELEASE-01 producto.  
- Capacidades nativas de dispositivo.  
- Recompilar APK/AAB/Archive “porque el store lo pide” sin regresión FOPEBA.

---

## 3. Principios

| Principio | Significado en STORE-RELEASE-01 |
|-----------|----------------------------------|
| **Core Integrity** | Subir / versionar / publicar no altera el comportamiento del Core SaaS |
| **Binary Boundary** | Consume artefactos de MOBILE-RELEASE · no reabre MR1–MR5 |
| **Store ≠ Compile** | Consolas y canales no sustituyen runners de build |
| **Evidence before Implementation** | Spec + Runner + evidencias antes de “ya lo subí a Play” |
| **Incremental Certification** | Una transición / PR · `CERTIFIED_THROUGH` |
| **No Artificiality** | No simular consola · no inventar review aprobada · no mockear TestFlight |
| **Tenant-agnostic contract** | Pipeline común · brand / listing / bundle por tenant |
| **Secrets out of Git** | Keystores · API keys · AuthKey · service accounts fuera del repo |

**Cadena institucional:**

```text
DoR          ← este documento
  ↓
Spec
  ↓
Freeze
  ↓
Runner
  ↓
Gate
  ↓
SR1 … SR5 (IDs congelados en Spec)
  ↓
PASS
  ↓
Land Check
  ↓
Tag (nombre a fijar en Spec · p. ej. store-release-01-pass)
```

---

## 4. Alcance (marco DoR · no Freeze)

| Incluye (propuesto) | Significa |
|---------------------|-----------|
| Preparation | Cuentas · políticas · versionado store · secretos · checklist |
| Google Play Internal Testing | Canal privado Play |
| Google Play Closed Testing | Canal cerrado Play |
| Apple TestFlight | Canal privado iOS |
| Production Readiness | Listo para Production según contrato (rollout / retiro / review gates) |

**Bloques candidatos (borrador · Spec congela orden y cortes):**

```text
SR1  Preparation
SR2  Google Play Internal Testing
SR3  Google Play Closed Testing
SR4  Apple TestFlight
SR5  Production Readiness
        ↓
PASS · store-release-01-pass (nombre a fijar)
```

---

## 5. Fuera de alcance (explícito)

| Fuera | Motivo |
|-------|--------|
| Push Notifications | `MOBILE-CAPABILITIES-*` (candidato) |
| Deep Links | Capacidad nativa posterior |
| Sign in with Apple · Google Sign-In | Capacidad / auth nativa posterior |
| In-App Purchases / Suscripciones store | Ciclo comercial posterior |
| Cámara · GPS · NFC | Capacidad nativa posterior |
| Widgets · Live Activities · Wear OS · Apple Watch | Capacidad nativa posterior |
| Reabrir Capacitor C1–C5 | Ya `capacitor-pass` |
| Reabrir MOBILE-RELEASE MR1–MR5 | Ya `mobile-release-01-pass` |
| Nueva lógica de negocio “porque hay store” | Business / Experience |
| Spec · Runner · Gate · scripts · uploads · código | Fuera de **este** PR (DoR only) |

**Regla anti-crecimiento:** si no es preparación de store · Internal/Closed Play · TestFlight · Production Readiness · gobernanza de versión/rollout/secretos de store, **no entra** en STORE-RELEASE-01 sin renegociar Spec Freeze.

---

## 6. Dependencias

| Dependencia | Estado | Rol |
|-------------|--------|-----|
| Foundation / Platform | ✅ | Core SaaS operable |
| `release-01-pass` | ✅ | Producto SaaS certificado |
| `flow05-pass` | ✅ | Experiencia cliente certificada |
| `capacitor-pass` | ✅ | Shell nativo certificado |
| `mobile-release-01-pass` → `ca3e823` | ✅ | Binarios / pipeline privado · **START** |
| MOBILE-RELEASE-01 Gate CLOSED | ✅ | No reabrir MR1–MR5 |
| Spec STORE-RELEASE-01 | 🔒 | Siguiente artefacto tras merge de este DoR |
| Runner / Gate | 🔒 | Tras Spec FROZEN |
| Google Play Console · Apple Developer (cuentas) | ◐ externo | Requisito operativo · gobernado por Spec/Runner · no sustituye FOPEBA |

STORE-RELEASE-01 **consume** MOBILE-RELEASE ya certificado.  
No reimplementa Capacitor ni el pipeline de compilación.

---

## 7. Riesgos

| Riesgo | Mitigación (DoR) |
|--------|------------------|
| Confundir “tengo APK” con “puedo publicar” | Binary Boundary · START = mobile-release-01-pass |
| Reabrir MR3/MR4 “para el store” | Secrets/store signing se gobiernan aquí sin reabrir MOBILE-RELEASE |
| Empezar por Production listings | Orden SR1→SR5 · Production = SR5 |
| Saltar DoR → subir build en Terminal | FOPEBA obligatorio · Land Check desde `main` |
| Mezclar Cursor / Terminal / Play Console / App Store Connect en un bloque | Ritual Objetivo · Lugar · Pasos · Resultado · Qué NO |
| Secretos de consola en git | Spec exige secret management |
| Un listing por tenant acoplado al Core | Contrato tenant-agnostic · assets de store fuera del Core |
| Confundir “subí un build” con CERTIFIED | Runner + evidencias + PASS tag |

---

## 8. Ritual de trabajo

```text
🎯 Objetivo     → qué se consigue
📍 Lugar        → Cursor | Terminal | Play Console | App Store Connect | GitHub
▶️ Pasos        → numerados · una herramienta por bloque
✅ Resultado    → qué debe verse exactamente
🚫 Qué NO       → para no romper la certificación
```

**Regla:** nunca mezclar herramientas en el mismo bloque de pasos.

---

## 9. Criterios para abrir el Spec

Abrir **STORE-RELEASE-01 Spec** solo cuando:

```text
1. Este DoR esté mergeado en main
2. La pregunta única no cambie de nivel
   (distribución en stores · no negocio · no capacidades nativas · no recompilar)
3. El Spec proponga contrato por bloques
   (SR1…SR5 o equivalente congelado)
   sin incluir Push / Deep Links / Sign-in / Purchases / Wearables
4. El Spec respete el Contract Boundary:
   mobile-release-01-pass → store pipeline → Production Readiness
5. El Spec declare PASS / BLOCKED esperados y paths de evidencia
   (docs/10-validation/store-release/ · candidato)
6. No se suban builds a consolas
   hasta Gate READY + apertura de SR1 / 001
```

Cumplido el DoR en `main`:

```text
READY TO OPEN
STORE-RELEASE-01 Spec only
No Runner · No Gate · No SR1 · No uploads · No CI · No Production
```

---

## Definition of Ready (checklist de apertura)

```text
STORE-RELEASE-01
☑ Precondición mobile-release-01-pass       ✅
☑ Precondiciones capacitor-pass · release-01 · flow05 ✅
☑ DoR documental                           ✅ (#269) · STORE_RELEASE_01_DOR.md
☑ Spec congelada                           ▶ este PR · STORE_RELEASE_01_SPEC.md
□ Contrato de evidencias definido          → Spec (declarado) · Runner institucionaliza
□ Runner creado                            → tras Spec FROZEN en main
□ Gate READY                               → tras Runner en main
□ PASS / BLOCKED esperados                 → Spec (declarado)
□ Acta / evidence paths                    → Spec · docs/10-validation/store-release/
```

Sin Spec FROZEN + Runner en `main` + Gate READY → ❌ no abrir `SR1` ni subir a consolas.

---

## Next

```text
Merge este DoR
    ↓
Land Check (documento en main)
    ↓
STORE-RELEASE-01 Spec only
    ↓
Freeze → Runner → Gate
    ↓
SR1 Preparation
```

*(Actualizado tras Spec: Next operativo = Runner only.)*

```text
Spec FROZEN en main
    ↓
STORE-RELEASE-01 Runner only
    ↓
Gate READY
    ↓
SR01-001 · SR1 Preparation only
    ↓
SR01-002 Google Play Internal Testing
    ↓
SR01-003 Google Play Closed Testing
    ↓
SR01-004 Apple TestFlight
    ↓
SR01-005 Production Readiness
    ↓
PASS · store-release-01-pass
```

**Después (fuera de este ciclo):** capacidades nativas (`MOBILE-CAPABILITIES-*`) · OPS de monitoring/recovery · tenants adicionales reutilizando el mismo pipeline.

---

## End of STORE-RELEASE-01 DoR
