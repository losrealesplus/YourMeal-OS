# AUTH-PIPELINE-002 · Vite publishable key preflight

**Fecha:** 2026-08-01  
**Alcance:** DX / env validation + docs — **no** Auth pipeline (FCR-008) · **no** claves reales en git  
**Síntoma evitado:** `[FCR-008] STOP { reason: auth_admin_submit_error, message: Invalid API key }`

---

## Causa raíz (evidencia)

El SPA inicializa Supabase así:

```text
auth_.admin.tsx
  → signInWithPassword()
  → getAuthClient()
  → createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY)
```

Archivo: `src/integrations/supabase/client.ts`

En el navegador Vite inyecta **solo** `import.meta.env.VITE_*`.  
Si `.env` tiene:

```env
VITE_SUPABASE_PUBLISHABLE_KEY="sb_publishable_REPLACE_ME"
SUPABASE_PUBLISHABLE_KEY="sb_publishable_<real>"
```

el browser usa el **placeholder**. Supabase responde `Invalid API key` **antes** de validar email/password → `LOGIN` sí, `LOGIN_OK` no.

---

## Fix de operador (local · no es un PR de Auth)

1. Dashboard Supabase → proyecto **`djangucecsphnejplvic`** → publishable key  
2. En `.env` (gitignored):

```env
VITE_SUPABASE_URL="https://djangucecsphnejplvic.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<publishable real>"
SUPABASE_PUBLISHABLE_KEY="<mismo valor>"
```

3. Reiniciar Vite (`npm run dev`)  
4. `npm run test:ps002-canonical-auth`

---

## Guardrails en repo (este PR)

| Pieza | Comportamiento |
|-------|----------------|
| `scripts/lib/ps002c-vite-env.mjs` | Detecta vacía / `REPLACE_ME` |
| `runPs002cPreflight` | **BLOCKED** con mensaje explícito |
| `npm run bootstrap:e2e` / `:check` | Step `VITE_SUPABASE_PUBLISHABLE_KEY` → BLOCKED |
| `.env.example` | Aviso: el SPA usa `VITE_*`; no dejar placeholder |

Mensaje canónico:

```text
Invalid VITE_SUPABASE_PUBLISHABLE_KEY. Replace placeholder with the project's real publishable key.
```

---

## Qué no cambia

- Pipeline FCR-008 (`post-login-pipeline.ts`)  
- UI Auth / rutas  
- Claves reales (nunca en git)
