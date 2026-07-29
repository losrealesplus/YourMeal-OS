# FCR-011 · SUPABASE PROJECT AUDIT

**Fecha:** 2026-07-29  
**Modo:** Evidence only — no fix · no env change · no code change  

---

## Pre-check · rama y PRs #100–#103

| Item | Estado | Clasificación |
|------|--------|---------------|
| Rama al inicio | `cursor/fcr010-auth-token-400-f54a` (docs FCR-010) | — |
| Rama de esta auditoría | `cursor/fcr011-supabase-project-audit-f54a` ← `origin/main` | — |
| PR #100 PLATFORM STABILIZATION COMPLETE | MERGED | **STALE** para Auth real: cierra gates con Bootstrap; PS-002-C / proyecto oficial no quedan demostrados |
| PR #101 FCR-007 login blocker | CLOSED (no merge) | **PARTIAL / STALE**: diagnóstico de hang post-login; no audita project-ref |
| PR #102 FCR-008 + PS-002-C | MERGED | **VALID**: pipeline canónico; PS-002-C sigue bloqueado por credenciales/proyecto |
| PR #103 FCR-010 token 400 | OPEN (draft) | **VALID**: `invalid_credentials` en `cbeegcxkayybfncnuirg`; mismatch vs oficial |

`docs/01-foundation/SUPABASE_PROJECT.md`: **no existe** en el repo. Proyecto esperado se toma de `CUTOVER_REPORT.md`, `IDENTITY_FREEZE_v1.md`, `supabase/config.toml`, `.env.example`.

---

## 1. Entorno efectivo (runtime workspace)

| Variable | Valor efectivo |
|----------|----------------|
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | `https://cbeegcxkayybfncnuirg.supabase.co` |
| `SUPABASE_PROJECT_ID` / `VITE_SUPABASE_PROJECT_ID` | `cbeegcxkayybfncnuirg` |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_BXBaWRxrf…` (mismo valor URL↔Vite) |
| `SUPABASE_SERVICE_ROLE_KEY` | Ausente |
| `SUPABASE_ACCESS_TOKEN` | Ausente |

Cliente: `src/integrations/supabase/client.ts` usa `import.meta.env.VITE_SUPABASE_*` (Vite) → `createClient(URL, PUBLISHABLE_KEY)`.

Lovable Cloud env: **no legible** desde este agente (ver `LOVABLE_DEPLOYMENT_AUDIT_BOOTSTRAP.md`). Si Lovable no sobrescribe, hereda el mismo patrón de keys de operador; cutover docs marcan sync Lovable como pendiente de operador.

---

## 2. Project Reference desde URL

```
https://cbeegcxkayybfncnuirg.supabase.co
→ ref = cbeegcxkayybfncnuirg
```

Respuestas HTTP viven con header `sb-project-ref: cbeegcxkayybfncnuirg`.

---

## 3. Comparación

| Fuente | Project ref |
|--------|-------------|
| Runtime `.env` + cliente | `cbeegcxkayybfncnuirg` |
| Esperado docs / cutover / config.toml / `.env.example` / Dashboard docs | `djangucecsphnejplvic` |
| `docs/01-foundation/SUPABASE_PROJECT.md` | **AUSENTE** |

**¿Coinciden efectivo vs esperado?** **No.**

Dashboard “abierto”: no observable en este entorno. Enlaces y evidencia de plataforma apuntan a  
https://supabase.com/dashboard/project/djangucecsphnejplvic — si el operador usa ese Dashboard, **no** es el proyecto al que autentica la app.

---

## 4. Usuarios Platform Owner vs proyecto de la app

Evidencia histórica **oficial** (`docs/10-validation/evidence/op002/validation-run.json`, project `djangucecsphnejplvic`):

| Email | user_id (oficial) |
|-------|-------------------|
| `alex1409h@gmail.com` | `eb87be19-e7d3-4e15-b429-20d3cc9766e8` |
| `alexhdezmtinez@gmail.com` | `ddc40f80-8980-475c-a7a2-1f3be4eaa59f` |

Probes 2026-07-29 contra **runtime** `cbeegcxkayybfncnuirg` (publishable legacy):

| Check | Resultado |
|-------|-----------|
| password grant (password inventada) ambos emails | HTTP 400 `invalid_credentials`, `sb-project-ref=cbeegcxkayybfncnuirg` |
| signup `alex1409h@gmail.com` | 200 con `identities: []` (respuesta típica anti-enumeración / no sesión) |
| signup `alexhdezmtinez@gmail.com` | 200 con identidad real → **no existía** en legacy; se creó fila unconfirmed (side-effect de probe) `65e613ce-…` ≠ oficial `ddc40f80-…` |
| login `alexhdezmtinez` + password del probe | 400 `email_not_confirmed` (confirma usuario nuevo en **legacy**, no el owner oficial) |

**Conclusión usuarios:** los Platform Owners validados viven en **`djangucecsphnejplvic`**. No son la misma identidad Auth que sirve la app en `cbeegcxkayybfncnuirg`.

---

## 5. `invalid_credentials` = mismo proyecto autenticado

```http
POST https://cbeegcxkayybfncnuirg.supabase.co/auth/v1/token?grant_type=password
→ HTTP 400
→ sb-project-ref: cbeegcxkayybfncnuirg
→ {"error_code":"invalid_credentials","msg":"Invalid login credentials"}
```

Cross-check: misma publishable key contra URL oficial → HTTP **401** `Invalid API key`, `sb-project-ref: djangucecsphnejplvic`.

---

## 6. Todos los proyectos Supabase en el ecosistema del repo

| Ref | Rol | Quién lo usa en runtime |
|-----|-----|-------------------------|
| `cbeegcxkayybfncnuirg` | Legacy | **App efectiva** (`.env` workspace + respuestas GoTrue) |
| `djangucecsphnejplvic` | Oficial / esperado (INFRA-002) | Docs, `config.toml`, `.env.example`, `gen:types`, seeds OP-002 — **no** el `.env` actual |

---

## Resultado FCR-011 (formato requerido)

```
Proyecto Supabase efectivo: cbeegcxkayybfncnuirg
  (https://cbeegcxkayybfncnuirg.supabase.co)

Proyecto Supabase esperado: djangucecsphnejplvic
  (docs cutover / config.toml / .env.example / Dashboard documentado)

¿Coinciden?: No

Evidencias utilizadas:
- .env / VITE_* (URL + publishable + project id alineados a legacy)
- src/integrations/supabase/client.ts (lee VITE_SUPABASE_*)
- Header sb-project-ref en /auth/v1/settings y /auth/v1/token
- Cross-project 401 Invalid API key (oficial + key legacy)
- supabase/config.toml, .env.example, CUTOVER_REPORT, IDENTITY_FREEZE_v1
- op002 validation-run.json (owners en djangu…)
- Probes signup/token 2026-07-29 (owners ≠ identidades legacy)
- PR #103 / FCR-010

Causa raíz demostrada:
La aplicación autentica contra el proyecto legacy cbeegcxkayybfncnuirg
mientras el origen de verdad documentado y el Dashboard oficial de
plataforma es djangucecsphnejplvic. Cutover de binding en repo quedó
incompleto en el .env runtime (keys legacy restauradas / no cutover
operativo). Los owners alex1409h@ / alexhdezmtinez@ validados en el
proyecto oficial no son las credenciales Auth del proyecto al que
pega la app → invalid_credentials en el GoTrue legacy.

Nivel de confianza: ALTA
(Dashboard browser del operador no inspeccionable aquí; si el Dashboard
abierto fuera legacy, coincidiría con la app pero seguiría divergiendo
del proyecto esperado documentado.)
```

### Side-effect de investigación (no fix)

Probe `signup` creó cuenta **unconfirmed** `alexhdezmtinez@gmail.com` en legacy (`65e613ce-…`). No se cambió código ni variables de entorno. Operador puede borrar ese usuario en Dashboard legacy si no lo desea.
