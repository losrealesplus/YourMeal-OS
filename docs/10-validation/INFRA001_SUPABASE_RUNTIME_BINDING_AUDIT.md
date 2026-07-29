# INFRA-001 · Supabase Runtime Binding Audit

**Fecha:** 2026-07-29  
**Modo:** Solo inspección — no fix · no cambio de código · no cambio de variables  

**Dashboard oficial (referencia de comparación):** `djangucecsphnejplvic`  
(Documentado en CUTOVER_REPORT / IDENTITY_FREEZE / Dashboard YourMeal OS)

---

## Inventario por origen

| # | Origen | Project ID | URL | Publishable Key (redactada) | Entorno donde se utiliza |
|---|--------|------------|-----|-----------------------------|---------------------------|
| 1 | `.env` (**tracked** en `main`) | `cbeegcxkayybfncnuirg` | `https://cbeegcxkayybfncnuirg.supabase.co` | `sb_publishable_BXBaWRxrf…` (len 46) | Runtime local / Vite build / SSR fallback del workspace y de cualquier build que lea este fichero |
| 2 | `.env.local` | — | — | — | **Ausente** |
| 3 | `.env.production` | — | — | — | **Ausente** |
| 4 | `.env.example` | `djangucecsphnejplvic` | `https://djangucecsphnejplvic.supabase.co` | `sb_publishable_REPLACE_ME` (placeholder) | Plantilla; no runtime |
| 5 | Lovable Environment Variables | **UNVERIFIED** (no legible desde este agente) | — | — | Preview / publish Lovable Cloud — operador; cutover docs = pendiente |
| 6 | `src/integrations/supabase/client.ts` | *sin hardcode* — lee `VITE_SUPABASE_*` / `SUPABASE_*` | *desde env* | *desde env* | Browser + Vite client runtime |
| 7 | `supabase/config.toml` | `djangucecsphnejplvic` | (implícita CLI) | n/a | Supabase CLI local / `db start` / link |
| 8 | `scripts/*` (`seed-*`, `bootstrap-verify`) | *sin hardcode* — `process.env.SUPABASE_URL` | *desde env* | service/publishable desde env | Node scripts (heredan `.env` al ejecutar) |
| 9 | `package.json` `gen:types` | `djangucecsphnejplvic` | n/a | n/a | Dev tooling only |
| 10 | GitHub Actions `migration-bootstrap.yml` | *ninguno* (Docker local `supabase db start`) | n/a | n/a | CI migración vacía — no Auth remoto |
| 11 | Vercel / Netlify | — | — | — | **No aplica** (sin `vercel.json` / `netlify.toml`) |
| 12 | Lovable Runtime / Preview | Ver § Lovable | Ver § Lovable | Ver § Lovable | Preview / `*.lovable.app` |

También: `client.server.ts` / `auth-middleware.ts` = env-driven (sin Project ID hardcode).

---

## Tabla pedida

| Origen | Project ID | Coincide con Dashboard (`djangucecsphnejplvic`) |
|--------|------------|--------------------------------------------------|
| `.env` (runtime / `main` tracked) | `cbeegcxkayybfncnuirg` | **No** |
| `.env.local` | (ausente) | — |
| `.env.production` | (ausente) | — |
| `.env.example` | `djangucecsphnejplvic` | **Sí** |
| Lovable Environment Variables | UNVERIFIED | UNVERIFIED |
| `src/integrations/supabase/client.ts` | (hereda env) | **No** en la práctica (env actual = legacy) |
| `supabase/config.toml` | `djangucecsphnejplvic` | **Sí** |
| scripts (env-driven) | (hereda `.env` → legacy) | **No** al ejecutarse con `.env` actual |
| `package.json` `gen:types` | `djangucecsphnejplvic` | **Sí** |
| GitHub Actions | (local Docker, sin remote project) | N/A |
| Vercel / Netlify | (no configurado) | N/A |
| Lovable Preview (inferencia) | `cbeegcxkayybfncnuirg` si build usa `.env` de `main` sin override Cloud | **No** (si no hay override); override Cloud = UNVERIFIED |

---

## Lovable Preview — cuál binding usa

Hechos:

1. `.env` en **`origin/main`** contiene Project ID **legacy** `cbeegcxkayybfncnuirg` + publishable legacy (fichero **versionado**).
2. Cliente Vite embebe `import.meta.env.VITE_SUPABASE_*` en build-time desde el env disponible al build.
3. Este agente **no** puede leer Lovable Cloud UI / env (confirmado en `LOVABLE_DEPLOYMENT_AUDIT_BOOTSTRAP.md`, `CUTOVER_REPORT.md`).
4. CUTOVER lista sync de keys oficiales a Lovable como **pendiente de operador**.
5. No hay workflow CI que despliegue a Lovable; no hay Vercel/Netlify.

**Conclusión Lovable Preview:**

- Si el Preview construye desde el repo **sin** sobrescribir `VITE_SUPABASE_*` en Lovable Cloud → usa **`cbeegcxkayybfncnuirg`** (mismo que `.env` en `main`).
- Si Lovable Cloud tiene variables propias distintas → **no verificable aquí**; el operador debe confirmar en Lovable → Environment / Network host `*.supabase.co`.

Confianza sobre Preview sin override Cloud: **ALTA** (`.env` tracked = legacy).  
Confianza absoluta del valor Cloud override: **BAJA / UNVERIFIED**.

---

## Conclusión

| Pregunta | Respuesta |
|----------|-----------|
| **¿Cuál es el Project ID efectivo del runtime?** | **`cbeegcxkayybfncnuirg`** |
| **¿Existe más de un Project ID activo?** | **Sí** (dos bindings en el ecosistema): runtime/env = `cbeegcxkayybfncnuirg`; docs/CLI/template = `djangucecsphnejplvic` |
| **¿Cuál usa el Preview de Lovable?** | **Por defecto / sin override Cloud: `cbeegcxkayybfncnuirg`**. Override Cloud: UNVERIFIED |

**Causa:** cutover INFRA-002 incompleto en el binding runtime — `.env` versionado sigue en legacy mientras `config.toml` / `.env.example` / docs declaran oficial.
