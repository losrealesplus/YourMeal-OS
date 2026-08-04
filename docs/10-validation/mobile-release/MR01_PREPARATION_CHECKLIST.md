# MOBILE-RELEASE-01 · MR1 Preparation Checklist

**Documento:** `MR01_PREPARATION_CHECKLIST.md`  
**Entrega:** MR01-001 · Preparation  
**Spec:** [MOBILE_RELEASE_01_SPEC](../../00-status/MOBILE_RELEASE_01_SPEC.md) · MR1  
**Estado:** ✅ preparado para Ready for Android Build (sin artefactos firmados)

> Checklist operativa de **preparación**.  
> No genera APK/AAB. No firma. No publica. No CI ejecutable.

---

## Release Checklist

### Versionado (consistente)

| Plataforma | Campo | Significado | Estado en repo |
|------------|-------|-------------|----------------|
| Android | `versionCode` | Entero monotónico · **no se reutiliza** en Play | definido en `android/app/build.gradle` |
| Android | `versionName` | Etiqueta legible de producto (p. ej. `1.0`) | definido |
| iOS | `CURRENT_PROJECT_VERSION` | Build number (equivalente a versionCode) | definido en Xcodeproj |
| iOS | `MARKETING_VERSION` | Versión de usuario (equivalente a versionName) | definido |

**Aprendizaje:** `versionCode` / `CURRENT_PROJECT_VERSION` son para tiendas y pipelines; `versionName` / `MARKETING_VERSION` son para humanos.

### Debug vs Release

| Tipo | Para qué sirve | En MR1 |
|------|----------------|--------|
| **Debug** | desarrollo · no optimizado · firma de debug del SDK | entorno verificado (scripts `build:mobile` · `cap:sync`) |
| **Release** | entrega · optimizable · preparado para firma de release | `buildTypes.release` presente · **sin** firmar aún |

### Configuración Release (Android)

- [x] `buildTypes { release { … } }` presente  
- [x] Versionado en `defaultConfig`  
- [x] Signing config de release (condicional · **MR3** · secrets fuera de Git)  
- [x] APK/AAB generados (**MR2** unsigned · **MR3** signed)

### Preparación para Signing (policy)

```text
Signing secrets / keystores / provisioning profiles
MUST NOT be committed to git.
Never commit *.jks · *.keystore · AuthKey_*.p8 · mobileprovision secrets.
```

MR1 solo exige que la **política** exista. La firma real es MR3.

### Preparación para CI

- Scripts móviles institucionales presentes (`build:mobile` · `cap:sync`)  
- Native Tool Artifacts Rule vigente ([FOUNDATION](../../../FOUNDATION.md))  
- CI/CD ejecutable pertenece a **MR5** (no este incremento)

### Entorno

- Capacitor Distribution Certified (`capacitor-pass`)  
- Gate READY · Spec FROZEN  
- Core Integrity: ningún cambio de negocio en este checklist

---

## Fuera de esta checklist

APK Release final · AAB · Signing · Play Console · iOS Archive · GitHub Actions · Internal Testing

---

## End of MR1 Preparation Checklist
