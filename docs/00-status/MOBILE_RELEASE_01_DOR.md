# MOBILE-RELEASE-01 · Definition of Ready

**Documento:** `MOBILE_RELEASE_01_DOR.md`  
**Fecha:** 2026-08-03  
**Estado:** ▶ **DoR DOCUMENT** (este PR) · Spec 🔒 · Runner 🔒 · Gate 🔒 · builds 🔒 · CI 🔒  
**Dominio:** **Distribution** · operación real (no arquitectura)  
**Nivel:** Mobile Production Readiness · YourMeal OS (tenant-agnostic)  
**Pregunta (única):** ¿Qué debe cumplir el proyecto para poder certificar distribución móvil **privada** (Internal Testing)?  
**Metodología:** FOPEBA · [EVIDENCE_BEFORE_IMPLEMENTATION](./EVIDENCE_BEFORE_IMPLEMENTATION.md) · [FOPEBA_LAND_CHECK](./FOPEBA_LAND_CHECK.md) · [FOUNDATION](../../FOUNDATION.md) (Native Tool Artifacts)  
**Precondiciones:** tag `capacitor-pass` → `400a010` · Capacitor Gate CLOSED · [CAPACITOR_PASS_ACTA](../10-validation/capacitor/CAPACITOR_PASS_ACTA.md) · `flow05-pass` · `release-01-pass`  
**Plan:** [NEXT_EXECUTION_PLAN](./NEXT_EXECUTION_PLAN.md) · [CURRENT_PHASE](./CURRENT_PHASE.md) · [FOPEBA_KNOWLEDGE_EXTRACTION](./FOPEBA_KNOWLEDGE_EXTRACTION.md)

> Este PR responde **solo**: ¿queda definido el marco Ready de MOBILE-RELEASE-01?  
> **No** es Specification. **No** Freeze. **No** Runner. **No** Gate.  
> **No** modifica Capacitor. **No** genera builds. **No** toca Android / iOS.  
> **No** CI/CD. **No** firma. **No** stores. **No** código.

---

## 1. Objetivo del dominio MOBILE-RELEASE-01

Certificar la **preparación de YourMeal OS para distribución privada**.

No certifica publicación.  
No certifica funcionalidades de negocio.  
Certifica únicamente el **pipeline de entrega móvil** hacia Internal Testing.

```text
Hasta capacitor-pass:  El Core puede proyectarse en Web · Android · iOS.
A partir de aquí:      El producto puede entregarse de forma privada
                       (firmado · versionado · reproducible · testeable).
```

Cambio de mentalidad:

| Antes (Fases A–C) | Ahora (Fase D) |
|-------------------|----------------|
| Construir y certificar la plataforma | Consolidar un producto listo para operar |
| Arquitectura / contratos de dominio | Operación real de entrega móvil |
| Capacitor = ¿puede ejecutarse como app? | MOBILE-RELEASE = ¿listo para distribución privada? |

---

## 2. Contract Boundary

### Dónde empieza

```text
START = Distribution Certified
        (tag capacitor-pass · C1–C5 FULL PASS · Gate CLOSED)
```

No empieza reabriendo Capacitor C1–C5.  
No empieza en un módulo de negocio.  
No empieza en Google Play / App Store Production.

### Dónde termina

```text
END = Ready for Internal Testing
      (Android + iOS · distribución privada operativa)
```

No termina en “publicado en Production”.  
No termina en Push / GPS / Cámara / Deep Links.  
No termina en un FLOW de negocio nuevo.

### Qué certifica (más adelante · Spec)

- Pipeline de build Android (APK Debug · APK Release · AAB).  
- Pipeline de archive iOS.  
- Versionado reproducible.  
- Firma (keystore / certificados · sin publicar).  
- CI/CD de builds móviles.  
- Internal Testing (Play Internal Testing · TestFlight) como **canal privado**.  
- Release checklist operativa.

### Qué no certifica

- Experience FLOW-05 (ya `flow05-pass`).  
- Producto RELEASE-01 (ya `release-01-pass`).  
- Capacitor v1 (ya `capacitor-pass`).  
- Publicación Production en stores.  
- Capacidades nativas de dispositivo.

---

## 3. Principios

| Principio | Significado en MOBILE-RELEASE-01 |
|-----------|----------------------------------|
| **Core Integrity** | Builds y firma no alteran el comportamiento del Core SaaS certificado |
| **Distribution First** | Empaquetar / firmar / entregar el mismo Core · no reinventar producto |
| **Evidence before Implementation** | Spec + Runner + evidencias antes de “ya tengo un APK” |
| **Incremental Certification** | Una transición / PR · `CERTIFIED_THROUGH` |
| **No Artificiality** | No simular Internal Testing · no inventar stores · no mockear firma |
| **Native Tool Artifacts** | Gradle / Xcode / SPM locales ≠ producto hasta aceptación explícita |

**Cadena institucional (igual que Capacitor · FLOW-05 · RELEASE-01):**

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
001 … N
  ↓
PASS
  ↓
Land Check
  ↓
Tag (nombre a fijar en Spec · p. ej. mobile-release-01-pass)
```

---

## 4. Alcance (marco DoR · no Freeze)

| Incluye (propuesto) | Significa |
|---------------------|-----------|
| Android APK Debug | Build de desarrollo verificable |
| Android APK Release | Artefacto firmable / instalable privado |
| Android AAB | Formato de entrega Play (Internal · no Production) |
| iOS Archive | `.xcarchive` reproducible |
| Versionado | `versionCode` / `versionName` · `CFBundleVersion` / `CFBundleShortVersionString` |
| Signing | Keystore Android · certificados / perfiles iOS (gestión · no store Production) |
| CI/CD | Automatización de builds (p. ej. GitHub Actions) |
| Internal Testing | Play Internal Testing · TestFlight (privado) |
| Release Checklist | Checklist operativa de entrega privada |

**Bloques candidatos (borrador · Spec congela orden y cortes):**

```text
MR01-001  Android Build Pipeline
MR01-002  Android Signing
MR01-003  Android Internal Testing
MR01-004  iOS Archive
MR01-005  CI/CD + Acceptance
        ↓
PASS · Ready for Internal Testing
```

---

## 5. Fuera de alcance (explícito)

| Fuera | Motivo |
|-------|--------|
| Google Play Production | MOBILE-RELEASE-02 (candidato) |
| App Store Production | MOBILE-RELEASE-02 (candidato) |
| Push Notifications | Capacidad nativa posterior |
| Deep Links | Capacidad nativa posterior |
| Biometría · GPS · Cámara | Capacidad nativa posterior |
| Widgets · Background Tasks | Capacidad nativa posterior |
| OTA Updates | Ciclo posterior / decisión de producto |
| Reabrir Capacitor C1–C5 | Ya `capacitor-pass` · solo regresión |
| Nueva lógica de negocio “porque es móvil” | Business / Experience |
| Spec · Runner · Gate · scripts · CI · código · Android/iOS edits | Fuera de **este** PR (DoR only) |

**Regla anti-crecimiento:** si no es build · firma · versionado · CI · Internal Testing · checklist, **no entra** en MOBILE-RELEASE-01 sin renegociar Spec Freeze.

---

## 6. Dependencias

| Dependencia | Estado | Rol |
|-------------|--------|-----|
| Foundation / Platform | ✅ | Core SaaS operable |
| `release-01-pass` | ✅ | Producto SaaS certificado |
| `flow05-pass` | ✅ | Experiencia cliente certificada |
| `capacitor-pass` → `400a010` | ✅ | Distribution Certified · START de este ciclo |
| Capacitor Gate CLOSED | ✅ | No reabrir C1–C5 |
| Spec MOBILE-RELEASE-01 | 🔒 | Siguiente artefacto tras merge de este DoR |
| Runner / Gate | 🔒 | Tras Spec FROZEN |
| Play Console / App Store Connect (cuentas) | ◐ externo | No sustituyen FOPEBA · se gobiernan por Spec/Runner |

MOBILE-RELEASE-01 **consume** Distribution ya certificada.  
No reimplementa Capacitor ni el Core.

---

## 7. Riesgos

| Riesgo | Mitigación (DoR) |
|--------|------------------|
| Confundir Internal Testing con Production | END = Ready for Internal Testing · Production = ciclo posterior |
| Reabrir Capacitor / Core “para firmar” | Core Integrity · Distribution First |
| Empezar por stores listings | Fuera de alcance hasta PASS |
| Saltar DoR → generar APK en Terminal | FOPEBA obligatorio · Land Check desde `main` |
| Mezclar Cursor / Terminal / Android Studio / Xcode en un solo paso | Ritual **Objetivo · Lugar · Pasos · Resultado · Qué NO** (abajo) |
| Secretos / keystores en git | Spec debe exigir secret management · Native Tool Artifacts |
| Tenant coupling en el contrato | Contrato tenant-agnostic · brand en Tenant |
| Confundir “compila en mi máquina” con CERTIFIED | Runner + evidencias + PASS tag |

---

## 8. Ritual de trabajo (permanente desde MOBILE-RELEASE)

Todas las instrucciones de este dominio (y siguientes) usan:

```text
🎯 Objetivo     → qué se consigue
📍 Lugar        → Cursor | Terminal | Android Studio | Xcode | GitHub
▶️ Pasos        → numerados · una herramienta por bloque
✅ Resultado    → qué debe verse exactamente
🚫 Qué NO       → para no romper la certificación
```

**Regla:** nunca mezclar herramientas en el mismo bloque de pasos.

---

## 9. Criterios para abrir el Spec

Abrir **MOBILE-RELEASE-01 Spec** solo cuando:

```text
1. Este DoR esté mergeado en main
2. La pregunta única no cambie de nivel
   (distribución privada · no negocio · no Production stores)
3. El Spec proponga contrato por bloques
   (MR01-001…005 o equivalente congelado)
   sin incluir Push / Deep Links / Biometría / Cámara / GPS / Production
4. El Spec respete el Contract Boundary:
   capacitor-pass → pipeline móvil → Ready for Internal Testing
5. El Spec declare PASS / BLOCKED esperados y paths de evidencia
   (docs/10-validation/mobile-release-01/ · candidato)
6. No se generen builds ni se editen android/ / ios/
   hasta Gate READY + apertura de MR01-001
```

Cumplido el DoR en `main`:

```text
READY TO OPEN
MOBILE-RELEASE-01 Spec only
No Runner · No Gate · No 001 · No APK · No Archive · No CI · No stores
```

---

## Definition of Ready (checklist de apertura)

```text
MOBILE-RELEASE-01
☑ Precondición capacitor-pass              ✅
☑ Precondiciones release-01-pass · flow05-pass ✅
☑ DoR documental                           ▶ este PR · MOBILE_RELEASE_01_DOR.md
□ Spec congelada                           → siguiente PR
□ Contrato de evidencias definido          → Spec
□ Runner creado                            → tras Spec FROZEN
□ Gate READY                               → tras Runner en main
□ PASS / BLOCKED esperados                 → Spec
□ Acta / evidence paths                    → Spec · docs/10-validation/
```

Sin Spec FROZEN + Runner en `main` + Gate READY → ❌ no abrir `MR01-001` ni generar builds.

---

## Next

```text
Merge este DoR
    ↓
Land Check (documento en main)
    ↓
MOBILE-RELEASE-01 Spec only
    ↓
Freeze → Runner → Gate
    ↓
MR01-001 Android Build Pipeline
    ↓
MR01-002 Android Signing
    ↓
MR01-003 Android Internal Testing
    ↓
MR01-004 iOS Archive
    ↓
MR01-005 CI/CD + Acceptance
    ↓
PASS · Ready for Internal Testing
```

**Después (fuera de este ciclo):** MOBILE-RELEASE-02 (Production stores) · OPS-01 (Deployment / Monitoring / Recovery) · capacidades nativas cuando aporten valor.

---

## End of MOBILE-RELEASE-01 DoR
