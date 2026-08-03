# CAPACITOR-003 · C3 Android Platform · Acta

**Documento:** `CAPACITOR_003_C3_ACTA.md`  
**Fecha:** 2026-08-03  
**Entrega:** CAPACITOR-003  
**Spec:** [CAPACITOR_SPEC](../../00-status/CAPACITOR_SPEC.md) **FROZEN** (#250) · bloque Spec **C3 · Android Build**  
**Precondición:** [CAPACITOR_002_C2_ACTA](./CAPACITOR_002_C2_ACTA.md) ✅ · Gate ✅ · Land Check C2 on `main` @ `0b26412`  
**Nivel:** Distribution · YourMeal OS (tenant-agnostic)

> Certifica **una** transición: Ready for Android → plataforma Android válida → **Ready for iOS**.  
> Representa `npx cap add android` por presencia del proyecto.  
> No APK · no AAB · no Play · no emulador · no C4.

---

## Pregunta certificada

> ¿Existe una plataforma Android válida y sincronizable con el Native Shell (C3)?

---

## Contrato observado

```text
CAPACITOR_C1…C2_COMPLETED   ✔
CAPACITOR_C3_STARTED        ✔ (exactly once)
CAPACITOR_C3_COMPLETED      ✔ (exactly once)
CAPACITOR_C4_STARTED        BLOCKED (no emitido — fuera de alcance)
```

Spine:

```text
START · Ready for Android (outcome C2)
  ↓
Proyecto android/ presente (cap add representado)
  ↓
capacitor.settings.gradle · capacitor-android
  ↓
App vinculado al shell (implementation project(':capacitor-android'))
  ↓
@capacitor/android · cap open/sync preparados
  ↓
END · Ready for iOS (Spec C3)
```

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| C2 CERTIFIED | ✅ |
| Gate autoriza CAPACITOR-003 | ✅ |
| android/ platform presente | ✅ |
| capacitor.settings.gradle presente | ✅ |
| App → capacitor-android presente | ✅ |
| @capacitor/android dependency presente | ✅ |
| cap open/sync script presente | ✅ |
| Spec C3 → Ready for iOS | ✅ |
| Sin APK / Play / C4 | ✅ |
| Runner: PASS through C3 · BLOCKED at C4 | ✅ |

---

## Comandos

```bash
npm run test:capacitor-003
# → PASS through C3 · blocked_at=CAPACITOR_C4_STARTED · exit 0

npm run test:capacitor
# → PASS through C3 · blocked_at=CAPACITOR_C4_STARTED · exit 0

npm run test:capacitor:runner-only
# → BLOCKED at CAPACITOR_C1_STARTED · exit 2
```

---

## Implementación (presencia / integración)

| Pieza | Path |
|-------|------|
| Android project | `android/` |
| Cap settings | `android/capacitor.settings.gradle` |
| App Gradle | `android/app/build.gradle` |
| Dep | `package.json` (`@capacitor/android`) |
| Scripts | `cap:open:android` · `cap:sync` |
| C3 driver | `scripts/lib/capacitor-c3-android-platform.mjs` |
| Runner | `CERTIFIED_THROUGH=3` |
| Evidence | `docs/10-validation/capacitor/evidence/capacitor-003-canonical-live.json` |

---

## Regla

```text
C3: Ready for Android → Android Platform → Ready for iOS.
Core Integrity: no altera el comportamiento funcional del Core.
No consume C4 (iOS) · no APK · no Play.
```

---

## Siguiente

Land Check desde `main` → revisar `npx cap add android` (Terminal) → **CAPACITOR-004 · C4 iOS** only.

---

## End of CAPACITOR-003 Acta
