# Development Environment

**Documento:** `DEVELOPMENT_ENVIRONMENT.md`  
**Track:** HOUSEKEEPING-002 · DEVELOPER-PLATFORM-INFRA-001  
**Estado:** Active · parte oficial del Developer Platform v1.0 tooling  
**ADR:** [0048 — Development Environment](../adr/0048-development-environment.md)  
**Código:** `scripts/development/` · Capability `development-environment`

> No queremos memorizar comandos.  
> Queremos que la plataforma detecte automáticamente cuándo el entorno no es válido.

---

## Por qué existe

Cada nueva terminal puede perder `JAVA_HOME`, volver a OpenJDK 26 y romper `assembleDebug`.  
Eso contradice FOPEBA: el **sistema** debe detectar el problema, no el desarrollador.

---

## Qué valida

| Driver | Esperado | Severidad clave |
|--------|----------|-----------------|
| Java | **JDK 21** (`java` · `javac` · `jlink`) | ERROR en 22–26+ |
| Android SDK | `ANDROID_HOME` / platforms / build-tools / adb | ERROR (WARNING en CI) |
| ADB | `adb devices` ≥ 1 device | WARNING si vacío |
| Gradle | wrapper + opcional `-version` / JVM | ERROR si Launcher JVM 22+ |
| Node | major ≥ 20 | ERROR |
| npm | presente | ERROR |
| Capacitor | config + `npx cap doctor` | WARNING |
| Git | branch / dirty / tag | PASS/WARNING |
| Environment | `JAVA_HOME` · `ANDROID_*` · `PATH` | WARNING |

Cada driver devuelve: **PASS | WARNING | ERROR** + Evidence + Recommendation + Recovery Hint.  
**Nunca** ejecuta recover automático.

---

## CLI

```bash
npm run doctor:env          # solo entorno
npm run doctor:env:json
scripts/development/bootstrap.sh

npm run doctor              # incluye módulo development-environment
```

Salida típica:

```text
Development Environment

Java ........ PASS
Android SDK . PASS
ADB ......... WARNING
Gradle ...... PASS
Node ........ PASS
npm ......... PASS
Capacitor ... PASS
Git ......... PASS
Environment . PASS

✅ Development Environment Ready
```

Si Java es 26:

```text
Java ........ ERROR
   → Configure JAVA_HOME apuntando a JBR 21.
   $ export JAVA_HOME="…"
   $ export PATH="$JAVA_HOME/bin:$PATH"
```

---

## Runtime Capability

`registerCapability("development-environment")` — visible en Host/Doctor.  
En browser no puede sondear el JDK del host; apunta a `npm run doctor:env` (FOPEBA-honest).

---

## Cómo añadir un driver

1. Crear `scripts/development/<name>-driver.mjs` con `runXDriver(ctx) → DriverResult`.  
2. Registrar en `DEVELOPMENT_DRIVERS` (`index.mjs`).  
3. Añadir mocks en `development.spec.mjs`.  
4. Documentar en esta página + ADR si cambia política (p.ej. JDK major).

Contrato: ver `scripts/development/shared.mjs`.

---

## Siguiente (PRODUCT-CORE)

Infraestructura de entorno cerrada (002 + 003).  
Siguiente foco: **PRODUCT-CORE-001 · Authentication & Bootstrap Stabilization**.

### Histórico HOUSEKEEPING-003

Completado: `.env.development.example` + Environment Contract (`doctor:env` ✔/✖).  
Ver [ENVIRONMENT_CONTRACT](./ENVIRONMENT_CONTRACT.md) · ADR 0049.

---

## Restricciones respetadas

No modifica Product Core · Android Runtime · Capacitor core · Runtime/Recovery/Doctor Engines.  
Solo tooling + capability registrable.
