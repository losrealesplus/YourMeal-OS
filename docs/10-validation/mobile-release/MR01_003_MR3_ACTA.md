# MR01-003 · MR3 Android Signing · Acta

**Documento:** `MR01_003_MR3_ACTA.md`  
**Fecha:** 2026-08-03  
**Entrega:** MR01-003  
**Spec:** [MOBILE_RELEASE_01_SPEC](../../00-status/MOBILE_RELEASE_01_SPEC.md) **FROZEN** (#260) · bloque Spec **MR3 · Android Signing**  
**Precondición:** Gate READY · MR01-001 ✅ · MR01-002 ✅ · Ready for Android Signing  
**Nivel:** Distribution · private mobile delivery · YourMeal OS (tenant-agnostic)

> Certifica **una** transición: Ready for Android Signing → identidad criptográfica gobernada → **Ready for iOS Archive**.  
> No Play · no Play App Signing · no Internal Testing · no CI · no iOS · no MR4.

---

## Pregunta certificada

> ¿YourMeal OS tiene identidad criptográfica de Release, con secretos fuera de Git y verificación del artefacto firmado?

---

## Conceptos aprendidos (operación real)

| Concepto | Qué es | Por qué importa |
|----------|--------|-----------------|
| **Keystore** | Archivo que guarda la clave privada + certificado | Es la identidad permanente de la app |
| **Alias** | Nombre de la entrada dentro del Keystore | Selecciona qué clave se usa al firmar |
| **storePassword vs keyPassword** | Contraseña del archivo vs de la clave | En PKCS12 suelen coincidir; no las mezcles |
| **SigningConfig** | Gradle aplica esa identidad al `release` | Compilar ≠ firmar (MR2 vs MR3) |
| **app-release.apk** | APK Release **firmado** | Distinto de `app-release-unsigned.apk` |
| **Cert fingerprint** | SHA-256 del certificado de firma | Identifica la clave sin exponer el Keystore |

### Regla de oro

```text
El Keystore NUNCA vive en Git.
Las contraseñas NUNCA viven en texto plano en el repo.
Backup cifrado del Keystore = poder actualizar la app en el futuro.
```

---

## Contrato observado

```text
MOBILE_RELEASE_MR1…MR2     ✔
MOBILE_RELEASE_MR3_STARTED ✔ (exactly once)
MOBILE_RELEASE_MR3_COMPLETED ✔ (exactly once)
MOBILE_RELEASE_MR4_STARTED BLOCKED
```

Spine:

```text
START · Ready for Android Signing (MR2)
  ↓
SigningConfig condicional (env / keystore.properties)
  ↓
Keystore policy · secrets fuera de Git
  ↓
assembleRelease / bundleRelease firmados · apksigner verify
  ↓
END · Ready for iOS Archive
```

---

## Firma verificada (esta corrida de certificación)

| Campo | Valor |
|-------|-------|
| Alias | `yourmeal_upload` |
| Certificate DN | `CN=YourMeal OS MR01-003 Certification, OU=Mobile Release, O=YourMeal OS, L=Local, ST=NA, C=ES` |
| Certificate SHA-256 | `f6c47e1f19eb2f08c57471d0eb962df98b92b1cc59771c76bbeba8e994be9644` |
| Signed APK | `android/app/build/outputs/apk/release/app-release.apk` |
| Signed AAB | `android/app/build/outputs/bundle/release/app-release.aab` |

> **Importante:** el Keystore usado aquí es de **certificación del incremento** (agente / lab).  
> El Keystore de **producción del tenant** lo crea y custodia el operador — nunca se sube a Git.

Huellas: `docs/10-validation/mobile-release/evidence/mr3-android-signing.json`  
Copia operativa (fuera del repo): `/opt/cursor/artifacts/mobile-release/mr01-003/`

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| Gate autoriza MR01-003 | ✅ |
| SigningConfig preparada (condicional) | ✅ |
| Política de Keystore | ✅ |
| Variables de entorno documentadas | ✅ |
| Secrets fuera del repositorio | ✅ |
| Validación Release Signing | ✅ |
| Integridad / verificación firmada (`apksigner`) | ✅ |
| Spec → Ready for iOS Archive | ✅ |
| Sin Play / CI / iOS | ✅ |
| Runner: PASS through MR3 · BLOCKED at MR4 | ✅ |

---

## Comandos

```bash
npm run test:mobile-release-003
# → PASS through MR3 · blocked_at=MOBILE_RELEASE_MR4_STARTED · exit 0

npm run test:mobile-release
# → PASS through MR3 · blocked_at=MOBILE_RELEASE_MR4_STARTED · exit 0

npm run test:mobile-release:runner-only
# → BLOCKED at MOBILE_RELEASE_MR1_STARTED · exit 2
```

Firmar localmente (secretos en env o `android/keystore.properties`):

```bash
cd android && ./gradlew :app:assembleRelease :app:bundleRelease
cd .. && npm run mobile-release:mr3:record-artifacts
```

---

## Implementación

| Pieza | Path |
|-------|------|
| Policy | `docs/10-validation/mobile-release/MR01_SIGNING_POLICY.md` |
| Template | `android/keystore.properties.example` |
| SigningConfig | `android/app/build.gradle` (condicional) |
| MR3 driver | `scripts/lib/mobile-release-mr3-android-signing.mjs` |
| Record | `scripts/mobile-release-mr3-record-artifacts.mjs` |
| Runner | `CERTIFIED_THROUGH=3` |

---

## Regla

```text
MR3: Ready for Android Signing → cryptographic identity → Ready for iOS Archive.
Core Integrity: no Play · no CI · no Core SaaS.
Keystore out of Git. Forever.
```

---

## Siguiente

Land Check → **MR01-004 · MR4 iOS Archive** only.

---

## End of MR01-003 Acta
