# PS-002-C · Timeout Evidence (instrumentation)

**Fecha:** 2026-08-01  
**Tipo:** Observabilidad del runner (FOPEBA)  
**Alcance:** Solo `scripts/ps002-canonical-auth.mjs` + `scripts/lib/ps002c-ui-evidence.mjs`  
**No modifica:** Auth · `auth.admin.tsx` · `checkingSession` · selectores · producto

---

## Por qué existe

El runner podía terminar en:

```text
BLOCKED
Auth form not available
```

sin decir **qué rama de UI** estaba montada. El formulario (`input[type="email"]`) solo existe cuando `checkingSession` / `bootstrapError` / `nonStaffSession` no bloquean el render.

Antes de tocar producto: **aumentar evidencia**.

---

## Qué se captura en el timeout del email

| Artefacto | Path |
|-----------|------|
| Screenshot | `docs/10-validation/platform-stabilization/evidence/ps002c-form-timeout.png` |
| `document.body.innerText` | `…/ps002c-form-timeout.txt` |
| HTML del contenedor | `…/ps002c-form-timeout.html` |
| JSON estructurado | `…/ps002c-form-timeout.json` |

El mensaje BLOCKED incluye:

```text
URL:
…
UI State:
checkingSession | bootstrapError | nonStaffSession | form | redirect | bootstrap_mode | unknown
Visible text:
"…"
Screenshot:
…
```

---

## Estados detectados

| UI State | Significado probable |
|----------|----------------------|
| `checkingSession` | Texto de loading; formulario aún no montado |
| `bootstrapError` | Panel Reintentar / error de bootstrap |
| `nonStaffSession` | Sesión cliente / cambiar cuenta |
| `form` | Inputs presentes (timeout de visibilidad raro) |
| `redirect` | Ya no está en `/auth/*` |
| `bootstrap_mode` | UI Bootstrap Mode |
| `unknown` | Sin señales claras — revisar screenshot/HTML |

---

## Uso

```bash
VITE_BOOTSTRAP_MODE=false npm run dev -- --host 127.0.0.1 --port 8080
npm run test:ps002-canonical-auth
# si BLOCKED en formulario → leer ps002c-form-timeout.*
```

Tras la evidencia: decidir si el fix es runner, `auth.admin.tsx`, o sesión — **no antes**.
