# AUTH_CONSOLE · FCR-009

**Fecha:** 2026-07-29

---

## Esperado en consola del navegador (si handler corre)

| Señal | Origen |
|-------|--------|
| `[FCR-008] LOGIN` | `beginPostLoginPipeline` |
| `[FCR-008] STOP` `{ reason: "auth_submit_error", message: "Invalid login credentials" }` | catch de submit |
| Errores Sonner | **Ninguno visible** si `<Toaster />` no está montado |

---

## Hallazgo estático crítico

```text
import { toast } from "sonner"   → usado en auth.tsx
<Toaster />                      → NO encontrado en el árbol React (__root / layouts)
```

`toast.error` / `toast.success` se invocan pero **no hay host de UI** → consola puede no mostrar nada útil al usuario; Sonner no renderiza.

---

## Unhandled / React Error Boundary

No se observó evidencia de Error Boundary en el path de submit (errores se capturan en `try/catch` del form).

---

## Checklist operador (F12 → Console)

1. Pulsar Iniciar sesión.  
2. ¿Aparece `[FCR-008] LOGIN`?  
   - **Sí** → handler ejecutado (Scenario A/B PASS en runtime).  
   - **No** → JS no llega al pipeline (revisar errores previos / build distinto).  
3. ¿Aparece `STOP` con mensaje?  
4. ¿Hay exception no capturada?
