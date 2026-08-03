# MR01-001 · MR1 Preparation · Acta

**Documento:** `MR01_001_MR1_ACTA.md`  
**Fecha:** 2026-08-03  
**Entrega:** MR01-001  
**Spec:** [MOBILE_RELEASE_01_SPEC](../../00-status/MOBILE_RELEASE_01_SPEC.md) **FROZEN** (#260) · bloque Spec **MR1 · Preparation**  
**Precondición:** Gate READY · Runner ✅ · Spec ✅ · Land Check on `main` @ `137da79` · `capacitor-pass`  
**Nivel:** Distribution · private mobile delivery · YourMeal OS (tenant-agnostic)

> Certifica **una** transición: Distribution Certified → preparación operativa → **Ready for Android Build**.  
> No APK · no AAB · no signing · no CI · no stores · no MR2.

---

## Pregunta certificada

> ¿El entorno de distribución está preparado para producir builds reproducibles?

---

## Conceptos aprendidos (operación real)

| Concepto | Qué es | Por qué importa |
|----------|--------|-----------------|
| **Debug Build** | Build de desarrollo · firma de debug del SDK | Iteración rápida · no es entregable de Internal Testing |
| **Release Build** | Build de entrega · preparado para firma de release | Base de APK/AAB firmados (MR2/MR3) |
| **versionCode** | Entero monotónico Android | Play no acepta reutilizar el mismo `versionCode` |
| **versionName** | Etiqueta legible (`1.0`) | Comunicación de producto · no sustituye versionCode |
| **MARKETING_VERSION / CURRENT_PROJECT_VERSION** | Equivalentes iOS | Misma disciplina de versionado en ambas plataformas |
| **Signing prep ≠ Signing** | Política sin secretos en git | MR1 prepara · MR3 firma |

---

## Contrato observado

```text
MOBILE_RELEASE_MR1_STARTED     ✔ (exactly once)
MOBILE_RELEASE_MR1_COMPLETED   ✔ (exactly once)
MOBILE_RELEASE_MR2_STARTED     BLOCKED (no emitido — fuera de alcance)
```

Spine:

```text
START · Distribution Certified (capacitor-pass)
  ↓
Versionado Android + iOS
  ↓
Release buildType · build:mobile / cap:sync
  ↓
Release Checklist · Signing policy (no secrets in git)
  ↓
END · Ready for Android Build
```

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| Gate autoriza MR01-001 | ✅ |
| capacitor-pass precondition | ✅ |
| Android versionCode / versionName | ✅ |
| Android release buildType | ✅ |
| iOS MARKETING / CURRENT_PROJECT_VERSION | ✅ |
| Mobile build pipeline | ✅ |
| Release Checklist | ✅ |
| Signing policy (no git secrets) | ✅ |
| Spec → Ready for Android Build | ✅ |
| Sin APK / signing / CI / stores | ✅ |
| Runner: PASS through MR1 · BLOCKED at MR2 | ✅ |

---

## Comandos

```bash
npm run test:mobile-release-001
# → PASS through MR1 · blocked_at=MOBILE_RELEASE_MR2_STARTED · exit 0

npm run test:mobile-release
# → PASS through MR1 · blocked_at=MOBILE_RELEASE_MR2_STARTED · exit 0

npm run test:mobile-release:runner-only
# → BLOCKED at MOBILE_RELEASE_MR1_STARTED · exit 2
```

---

## Implementación (presencia / preparación)

| Pieza | Path |
|-------|------|
| Checklist | `docs/10-validation/mobile-release/MR01_PREPARATION_CHECKLIST.md` |
| MR1 driver | `scripts/lib/mobile-release-mr1-preparation.mjs` |
| Capability driver | `scripts/lib/mobile-release-capability-driver.mjs` |
| Runner | `CERTIFIED_THROUGH=1` |
| Evidence | `docs/10-validation/mobile-release/evidence/mobile-release-001-canonical-live.json` |

---

## Regla

```text
MR1: Distribution Certified → Preparation → Ready for Android Build.
Core Integrity: no altera el Core.
No consume MR2 (Android Build) · no APK · no signing · no CI.
```

---

## Siguiente

Land Check desde `main` → **MR01-002 · MR2 Android Build** only  
(artefactos reales: APK Debug/Release · AAB — todavía sin firma de release).

---

## End of MR01-001 Acta
