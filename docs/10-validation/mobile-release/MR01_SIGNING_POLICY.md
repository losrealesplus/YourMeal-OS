# MOBILE-RELEASE-01 · MR3 Android Signing Policy

**Documento:** `MR01_SIGNING_POLICY.md`  
**Entrega:** MR01-003 · Android Signing  
**Spec:** [MOBILE_RELEASE_01_SPEC](../../00-status/MOBILE_RELEASE_01_SPEC.md) · MR3  
**Estado:** ✅ política operativa · secretos **fuera** de Git

> La firma es la **identidad criptográfica permanente** de la aplicación.  
> Perder el Keystore = no poder publicar actualizaciones de esa app.  
> Este documento certifica **gobernanza de firma**, no Play ni Internal Testing.

---

## Qué certifica MR3

| Sí | No |
|----|----|
| SigningConfig preparada (condicional) | Google Play / Play Console |
| Política de Keystore | Play App Signing |
| Variables de entorno / props locales | Publicación / Internal Testing |
| Secrets fuera del repositorio | iOS · CI/CD ejecutable |
| Validación de Release Signing | Core SaaS changes |
| Verificación de artefacto firmado | |

**Salida Spec:** Ready for iOS Archive.

---

## Conceptos (didáctica operativa)

| Término | Significado |
|---------|-------------|
| **Keystore** | Contenedor (`.jks` / `.keystore` / PKCS12) de la clave privada + certificado |
| **Alias** | Nombre de la entrada (clave) dentro del Keystore |
| **storePassword** | Contraseña del archivo Keystore |
| **keyPassword** | Contraseña de la clave bajo el Alias (a menudo igual en PKCS12) |
| **SigningConfig** | Bloque Gradle que aplica esa identidad al `release` |
| **Unsigned** | Compilado sin identidad de release (MR2) |
| **Signed** | Compilado **con** identidad de release (MR3) |

Sin firma: Android no sabe quién creó el APK.  
Con firma: Android / Play reconocen al propietario; solo esa clave puede actualizar.

---

## Reglas absolutas

```text
1. El archivo Keystore NUNCA se almacena en Git.
2. Las credenciales NUNCA se almacenan en texto plano en el repo.
3. keystore.properties es local / CI secret — gitignored.
4. Preferir variables de entorno para automatización futura.
5. Backup cifrado del Keystore + passwords fuera del repo (operador).
6. El Keystore de certificación de agentes ≠ Keystore de producción del tenant.
```

---

## Fuentes de secretos (orden)

1. **Entorno** (CI / máquina del operador):
   - `YOURMEAL_UPLOAD_STORE_FILE`
   - `YOURMEAL_UPLOAD_STORE_PASSWORD`
   - `YOURMEAL_UPLOAD_KEY_ALIAS`
   - `YOURMEAL_UPLOAD_KEY_PASSWORD`
2. **Archivo local** `android/keystore.properties` (gitignored)  
   Plantilla: `android/keystore.properties.example`

Si ninguna fuente está completa → `assembleRelease` sigue pudiendo producir **unsigned** (MR2).  
Si está completa → Gradle aplica `signingConfigs.release`.

---

## Dónde viven los artefactos

```text
Código fuente          → Git
Evidencias (JSON/actas)→ Git
APK / AAB firmados     → fuera de Git (artifact store)
Keystore               → fuera de Git (almacenamiento seguro + backup)
Checksums              → evidence JSON en Git
```

---

## Backup (operador)

1. Copiar el `.jks` / `.keystore` a almacenamiento cifrado offline + cloud privado.
2. Guardar Alias + ambas contraseñas en un gestor de secretos (no en el chat, no en el repo).
3. Documentar qué `applicationId` / tenant usa esa clave.
4. Probar restauración en otra máquina **antes** de depender de ella en producción.

Si en tres años cambias de Mac: restauras Keystore + secrets → firmas de nuevo. Sin eso, no hay updates.

---

## Futuro CI (fuera de MR3)

GitHub Actions / Fastlane podrán inyectar `YOURMEAL_UPLOAD_*` como secrets.  
MR3 solo deja el contrato listo; **no** abre workflows.

---

## End of MR3 Signing Policy
