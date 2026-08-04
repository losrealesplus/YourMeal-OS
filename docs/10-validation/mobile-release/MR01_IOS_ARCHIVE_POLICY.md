# MOBILE-RELEASE-01 · MR4 iOS Archive Policy

**Documento:** `MR01_IOS_ARCHIVE_POLICY.md`  
**Entrega:** MR01-004 · iOS Archive  
**Spec:** [MOBILE_RELEASE_01_SPEC](../../00-status/MOBILE_RELEASE_01_SPEC.md) · MR4  
**Estado:** ✅ política operativa · `.xcarchive` **fuera** de Git

> Un **Archive** no es una IPA.  
> Es el contenedor que Xcode usa para preparar distribución (Organizer → IPA / TestFlight / App Store).  
> MR4 certifica el **contrato reproducible** de Archive. IPA / TestFlight = MR5.

---

## Qué certifica MR4

| Sí | No |
|----|----|
| Proyecto iOS válido · Release | IPA export |
| Signing identity preparada (Automatic) | TestFlight / App Store Connect |
| Recipe `xcodebuild … archive` | App Review / distribución |
| Metadata · fingerprint del proyecto | Push · Deep Links |
| Verificación de `.xcarchive` si existe (macOS) | CI/CD · Fastlane |

**Salida Spec:** Ready for Internal Testing Acceptance.

---

## Conceptos

| Término | Significado |
|---------|-------------|
| **`.xcarchive`** | Bundle con app compilada · dSYMs · Info.plist · firma |
| **Organizer** | UI de Xcode para exportar / subir desde el Archive |
| **Release** | Configuración de build para Archive (no Debug) |
| **CODE_SIGN_STYLE Automatic** | Xcode gestiona identidad; perfiles/secretos no van a Git |
| **IPA** | Paquete instalable derivado del Archive (fuera de MR4) |

Pipeline Apple:

```text
Archive (.xcarchive)
  ↓
IPA (export)
  ↓
TestFlight / App Store   ← MR5 / stores — no este incremento
```

---

## Reglas absolutas

```text
1. *.xcarchive NUNCA se almacena en Git.
2. AuthKey_*.p8 / *.mobileprovision NUNCA en el repo.
3. DerivedData / build locales = Native Tool Artifacts (fuera de Git).
4. El Archive de producción se custodia fuera del código fuente.
5. Automatización futura inyecta secretos por entorno — no por archivos commiteados.
```

---

## Recipe (reproducible)

Desde la raíz del repo (macOS + Xcode):

```bash
xcodebuild \
  -project ios/App/App.xcodeproj \
  -scheme App \
  -configuration Release \
  -archivePath ios/build/App.xcarchive \
  archive
```

Luego:

```bash
npm run mobile-release:mr4:record-archive
```

En hosts **sin** Xcode (p. ej. agentes Linux), MR4 certifica el fingerprint del proyecto + recipe; el binario `.xcarchive` queda `contract_ready_pending_macos`.

---

## Dónde viven los artefactos

```text
Código fuente     → Git
Evidencias JSON   → Git
.xcarchive / IPA  → fuera de Git (artifact store / Organizer)
Secrets Apple     → Keychain / CI secrets — nunca Git
```

---

## End of MR4 iOS Archive Policy
