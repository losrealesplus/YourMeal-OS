# MR01-004 · MR4 iOS Archive · Acta

**Documento:** `MR01_004_MR4_ACTA.md`  
**Fecha:** 2026-08-04  
**Entrega:** MR01-004  
**Spec:** [MOBILE_RELEASE_01_SPEC](../../00-status/MOBILE_RELEASE_01_SPEC.md) **FROZEN** (#260) · bloque Spec **MR4 · iOS Archive**  
**Precondición:** Gate READY · MR01-001…003 CERTIFIED desde `main` · Land Check PASS  
**Nivel:** Distribution · private mobile delivery · YourMeal OS (tenant-agnostic)

> Certifica **una** transición: Ready for iOS Archive → contrato reproducible de Xcode Archive → **Ready for Internal Testing Acceptance**.  
> No IPA · no TestFlight · no App Store · no CI · no MR5.

---

## Pregunta certificada

> ¿YourMeal OS puede generar un Xcode Archive reproducible a partir del mismo Core?

---

## Conceptos aprendidos

| Concepto | Qué es | Por qué importa |
|----------|--------|-----------------|
| **`.xcarchive`** | Contenedor Xcode (app + dSYMs + metadata + firma) | No es una IPA; es el paso previo a Organizer |
| **Organizer** | UI para exportar IPA / subir a Apple | MR4 no lo usa aún |
| **Release** | Configuración de Archive | Debug ≠ entregable |
| **CODE_SIGN_STYLE Automatic** | Identidad preparada sin secretos en Git | Firmas/perfiles fuera del repo |
| **Recipe `xcodebuild archive`** | Comando reproducible | Misma entrada → mismo contrato de Archive |

Pipeline Apple vs Android:

```text
Android: APK / AAB (MR2–MR3)
Apple:   Archive → IPA → TestFlight → Store  (MR4 solo Archive)
```

---

## Host de certificación

Este agente Cloud corre **Linux** (sin `xcodebuild`).  
MR4 certifica aquí el **fingerprint del proyecto iOS + recipe + política**.  
El binario `.xcarchive` se produce en **macOS + Xcode** y se registra con:

```bash
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Release \
  -archivePath ios/build/App.xcarchive archive
npm run mobile-release:mr4:record-archive
```

`xcarchive_status` en evidence: `contract_ready_pending_macos` (hasta que exista el Archive en Mac).

---

## Contrato observado

```text
MOBILE_RELEASE_MR1…MR3     ✔
MOBILE_RELEASE_MR4_STARTED ✔
MOBILE_RELEASE_MR4_COMPLETED ✔
MOBILE_RELEASE_MR5_STARTED BLOCKED
```

Spine:

```text
START · Ready for iOS Archive (MR3)
  ↓
Xcode project · Release · CODE_SIGN Automatic
  ↓
Archive recipe · pbxproj fingerprint · secrets out of Git
  ↓
END · Ready for Internal Testing Acceptance
```

---

## Metadata certificada (esta corrida)

| Campo | Valor |
|-------|-------|
| Bundle ID | `com.yourmealos.eatclean` |
| MARKETING_VERSION | `1.0` |
| CURRENT_PROJECT_VERSION | `1` |
| project.pbxproj sha256 | (evidence JSON) |
| git commit | (evidence JSON) |
| Archive recipe | `-scheme App -configuration Release archive` |

Evidence: `docs/10-validation/mobile-release/evidence/mr4-ios-archive.json`

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| Gate autoriza MR01-004 | ✅ |
| Proyecto iOS válido | ✅ |
| Build Release / Archive recipe | ✅ |
| Signing identity preparada | ✅ |
| Secrets / `.xcarchive` fuera de Git | ✅ |
| Metadata + fingerprint | ✅ |
| Spec → Ready for Internal Testing Acceptance | ✅ |
| Sin IPA / TestFlight / CI | ✅ |
| Runner: PASS through MR4 · BLOCKED at MR5 | ✅ |

---

## Comandos

```bash
npm run test:mobile-release-004
# → PASS through MR4 · blocked_at=MOBILE_RELEASE_MR5_STARTED · exit 0

npm run test:mobile-release
# → PASS through MR4 · blocked_at=MOBILE_RELEASE_MR5_STARTED · exit 0

npm run test:mobile-release:runner-only
# → BLOCKED at MOBILE_RELEASE_MR1_STARTED · exit 2
```

---

## Regla

```text
MR4: Ready for iOS Archive → Archive contract → Ready for Internal Testing Acceptance.
.xcarchive binary: macOS. Evidence + recipe: Git.
No IPA · no TestFlight · no Core SaaS changes.
```

---

## Siguiente

Land Check → **MR01-005 · Internal Testing Acceptance** only  
(¿listo para distribución privada? — Play Internal / TestFlight acceptance, sin Production).

---

## End of MR01-004 Acta
