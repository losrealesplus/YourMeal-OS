# MR01-002 · MR2 Android Build · Acta

**Documento:** `MR01_002_MR2_ACTA.md`  
**Fecha:** 2026-08-03  
**Entrega:** MR01-002  
**Spec:** [MOBILE_RELEASE_01_SPEC](../../00-status/MOBILE_RELEASE_01_SPEC.md) **FROZEN** (#260) · bloque Spec **MR2 · Android Build**  
**Precondición:** Gate READY · MR01-001 CERTIFIED · Land Check on `main` · `capacitor-pass`  
**Nivel:** Distribution · private mobile delivery · YourMeal OS (tenant-agnostic)

> Certifica **una** transición: Ready for Android Build → artefactos Android reproducibles (unsigned) → **Ready for Android Signing**.  
> No keystore · no SigningConfig · no Play · no Internal Testing · no iOS · no CI · no MR3.

---

## Pregunta certificada

> ¿YourMeal OS puede producir artefactos Android compilables y reproducibles (aún sin firma de producción)?

---

## Conceptos aprendidos (operación real)

| Concepto | Qué es | Por qué importa |
|----------|--------|-----------------|
| **app-debug.apk** | APK Debug · instalable en dispositivo/emulador | Iteración rápida · no es entregable de Internal Testing |
| **app-release-unsigned.apk** | APK Release **sin** firma de release | Compilación completa · todavía no distribuible como Release firmado |
| **app-release.aab** | Android App Bundle | Formato preferido para Play; aquí se genera **sin** certificar Play |
| **Unsigned** | Artefacto compilado sin identidad criptográfica de release | Compilar ≠ firmar · firmar = MR01-003 |
| **versionCode / versionName** | `1` / `1.0` (este build) | Identidad de versión embebida en el artefacto |
| **Evidence fingerprint** | `sha256` + bytes en JSON (binarios gitignored) | Certificación reproducible sin versionar APK/AAB en git |

### Dónde aparecen los artefactos

```text
android/app/build/outputs/
├── apk/
│   ├── debug/app-debug.apk
│   └── release/app-release-unsigned.apk
└── bundle/release/app-release.aab
```

Binarios: gitignored. Huellas: `docs/10-validation/mobile-release/evidence/mr2-android-artifacts.json`.  
Copia operativa de esta corrida (fuera del repo): `/opt/cursor/artifacts/mobile-release/mr01-002/`.

---

## Contrato observado

```text
MOBILE_RELEASE_MR1_STARTED     ✔
MOBILE_RELEASE_MR1_COMPLETED   ✔
MOBILE_RELEASE_MR2_STARTED     ✔ (exactly once)
MOBILE_RELEASE_MR2_COMPLETED   ✔ (exactly once)
MOBILE_RELEASE_MR3_STARTED     BLOCKED (no emitido — fuera de alcance)
```

Spine:

```text
START · Ready for Android Build (MR1)
  ↓
assembleDebug · assembleRelease · bundleRelease
  ↓
APK Debug · APK Release unsigned · AAB
  ↓
Evidence fingerprint (sha256) · versioning intact · Core Integrity
  ↓
END · Ready for Android Signing
```

---

## Artefactos certificados (esta corrida)

| Artefacto | Bytes | sha256 (prefix) |
|-----------|------:|-----------------|
| app-debug.apk | 5 332 866 | `8996d9d76faa…` |
| app-release-unsigned.apk | 4 319 430 | `535aae726580…` |
| app-release.aab | 4 137 749 | `2e761e55a787…` |

- **applicationId:** `com.yourmealos.eatclean`  
- **versionCode:** `1` · **versionName:** `1.0`  
- **signing:** unsigned (sin `signingConfig` en `release`)

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| Gate autoriza MR01-002 | ✅ |
| MR1 → Ready for Android Build | ✅ |
| APK Debug generado | ✅ |
| APK Release unsigned generado | ✅ |
| AAB generado | ✅ |
| versionCode / versionName correctos | ✅ |
| Artefactos identificables (sha256) | ✅ |
| Build reproducible (Gradle tasks) | ✅ |
| Sin Signing / Keystore / Play / CI | ✅ |
| Spec → Ready for Android Signing | ✅ |
| Runner: PASS through MR2 · BLOCKED at MR3 | ✅ |

---

## Comandos

```bash
npm run test:mobile-release-002
# → PASS through MR2 · blocked_at=MOBILE_RELEASE_MR3_STARTED · exit 0

npm run test:mobile-release
# → PASS through MR2 · blocked_at=MOBILE_RELEASE_MR3_STARTED · exit 0

npm run test:mobile-release:runner-only
# → BLOCKED at MOBILE_RELEASE_MR1_STARTED · exit 2
```

Regenerar huellas tras un rebuild local (SDK requerido):

```bash
cd android && ./gradlew :app:assembleDebug :app:assembleRelease :app:bundleRelease
cd .. && npm run mobile-release:mr2:record-artifacts
```

---

## Implementación

| Pieza | Path |
|-------|------|
| MR2 driver | `scripts/lib/mobile-release-mr2-android-build.mjs` |
| Record artifacts | `scripts/mobile-release-mr2-record-artifacts.mjs` |
| Evidence | `docs/10-validation/mobile-release/evidence/mr2-android-artifacts.json` |
| Capability driver | `scripts/lib/mobile-release-capability-driver.mjs` |
| Runner | `CERTIFIED_THROUGH=2` |

Nota de shell: `cap sync android` alineó `:capacitor-preferences` en Gradle (plugin ya presente en Core/Capacitor) — necesario para el build reproducible; no introduce Signing ni altera lógica de negocio.

---

## Regla

```text
MR2: Ready for Android Build → Android artifacts (unsigned) → Ready for Android Signing.
Core Integrity: no altera el Core · no SigningConfig · no Play.
No consume MR3 (Android Signing).
```

---

## Siguiente

Land Check desde `main` → **MR01-003 · MR3 Android Signing** only  
(keystore · firma Release — todavía sin Play Production).

---

## End of MR01-002 Acta
