# ROOT_CAUSE · FCR-009

**Fecha:** 2026-07-29  
**Estado:** Causa raíz **demostrada por evidencia** (compuesta) · **sin fix aplicado**

---

## Causa raíz

```text
1. PRIMARY (UX / feedback)
   <Toaster /> never mounted in the application tree.
   → Auth success/error toasts are silent.
   → Operator perceives “login/signup does nothing”.

2. CONTRIBUTING (credential / Auth response) for the reported attempt
   Email/password used at /auth (e.g. kike2morrow@gmail.com)
   does not produce a session against the wired Supabase project
   (API: invalid_credentials) OR signup returns user without session
   (email confirmation required).
   → No CANONICAL_SESSION → no navigate → stay on /auth.

3. NOT FIRST FAILURE
   FCR-008 post-login pipeline (Identity→Dashboard) is not reached
   without a successful Auth session.
```

---

## Nivel de confianza

| Parte | Confianza |
|-------|-----------|
| Toaster ausente | **Alta** (grep estático exhaustivo) |
| API Auth responde; signup crea user sin session | **Alta** (probes HTTP) |
| Credenciales del intento UI inválidas para ese proyecto | **Alta** (probe `kike2morrow`) |
| Click del operador siempre dispara Network en Lovable | **Media** (falta F12 humano) |

---

## Archivos implicados

| Archivo | Rol |
|---------|-----|
| `src/routes/__root.tsx` | Falta montar `<Toaster />` |
| `src/components/ui/sonner.tsx` | Componente existente no usado |
| `src/routes/auth.tsx` | Form + toast + pipeline |
| `src/auth/credentials.ts` | `signInWithPassword` / `signUp` |

---

## Propuesta mínima de corrección (**NO implementada**)

1. **Fix UX (mínimo):** montar `<Toaster />` desde `@/components/ui/sonner` en `RootComponent` / shell.  
2. **Operación:** Forgot password / password conocida para `alex1409h@gmail.com` o `alexhdezmtinez@gmail.com`.  
3. **Verificación:** F12 Network → `POST /auth/v1/token` → 200 + `[FCR-008]` hasta `DASHBOARD_RENDERED`.  
4. **PS-002-C:** solo entonces `npm run test:ps002-canonical-auth` con esas credenciales.  
5. **Confirmar** que Lovable apunta al mismo `VITE_SUPABASE_*` que el Dashboard que se inspecciona.

---

## Next FCR (propuesta de ID, sin abrir código)

| ID propuesto | Alcance |
|--------------|---------|
| **FCR-009a** | Mount Sonner `<Toaster />` (fix mínimo UX Auth) |
| **FCR-009b** | Solo si Network **no** muestra `/auth/v1/token` tras click (handler runtime) |

No reabrir FCR-008 como primer fallo de este síntoma.
