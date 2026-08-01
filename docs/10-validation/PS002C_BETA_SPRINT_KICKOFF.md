# PS-002-C · Beta Sprint Kickoff (Product CTO)

**Fecha:** 2026-07-31 · **Actualizado:** Runtime Hardening + preflight  
**Prioridad:** **P0-1**  
**Gate:** [PS-002.md](./platform-stabilization/PS-002.md) · [FCR-008](./FCR008_CANONICAL_POST_LOGIN_SESSION.md)  
**Estándar FOPEBA:** cualquier desarrollador que clone el repo y siga este flujo obtiene el mismo resultado.

---

## Flujo único (máquina limpia)

```bash
cp .env.example .env
# Rellena VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY (NO dejar REPLACE_ME),
# SUPABASE_* en sync, y PS002_EMAIL / PS002_PASSWORD en .env (local · gitignored).
# El browser Auth usa VITE_* — ver AUTH_PIPELINE_002_VITE_PUBLISHABLE_KEY.md

npm install
npm run bootstrap:e2e          # diagnóstico READY/BLOCKED + instala browsers si faltan

# Terminal 1
VITE_BOOTSTRAP_MODE=false npm run dev -- --host 127.0.0.1 --port 8080

# Terminal 2
npm run test:ps002-canonical-auth
```

`bootstrap:e2e` verifica Node · npm · dotenv · `.env` · **`VITE_SUPABASE_PUBLISHABLE_KEY` (no vacía / no `REPLACE_ME`)** · credenciales PS002 · Playwright · **Chromium (new headless / `channel: chromium`)** · **integridad** (`INSTALLATION_COMPLETE` + Framework/resources).  
**No** exige `chromium_headless_shell`.  
Binario presente pero Framework ausente → **BLOCKED** (`Chromium installation incomplete`).  
Placeholder `sb_publishable_REPLACE_ME` en `VITE_SUPABASE_PUBLISHABLE_KEY` → **BLOCKED** (evitaría `Invalid API key` en login).  
Si falta algo → fix exacto (`npx playwright install chromium --no-shell`).  
Nunca recomienda bare `npx playwright install` (puede colgarse).  

Detalle: [PS002C_PLAYWRIGHT_HEADLESS_SHELL.md](./PS002C_PLAYWRIGHT_HEADLESS_SHELL.md) · [PS002C_CHROMIUM_INTEGRITY.md](./PS002C_CHROMIUM_INTEGRITY.md) · [AUTH_PIPELINE_002_VITE_PUBLISHABLE_KEY.md](./AUTH_PIPELINE_002_VITE_PUBLISHABLE_KEY.md)

Solo comprobar (sin instalar): `npm run bootstrap:e2e:check`

Sin `export` manual. Sin instalaciones ad-hoc no documentadas.

---

## Credenciales

| Archivo | Contenido |
|---------|-----------|
| `.env.example` (versionado) | `PS002_EMAIL=` · `PS002_PASSWORD=` (vacíos) |
| `.env` (gitignored) | Valores reales locales — **nunca** en git |

---

## Preflight (antes del test)

El runner comprueba, en orden, y sale **BLOCKED** con mensaje claro si falla:

1. Existe `.env`  
2. `VITE_SUPABASE_PUBLISHABLE_KEY` (no vacía · no `REPLACE_ME`)  
3. `PS002_EMAIL`  
4. `PS002_PASSWORD`  
5. Playwright disponible  
6. Chromium instalado para `channel: chromium` (`npm run bootstrap:e2e` · sin headless_shell)  
7. Dev server responde  

No lanza stacks largos de Node por precondiciones de entorno.

Si el formulario no aparece: el runner guarda evidencia de UI (`ps002c-form-timeout.*`) — ver [PS002C_TIMEOUT_EVIDENCE.md](./PS002C_TIMEOUT_EVIDENCE.md).

**AUTH-LAYOUT-001:** `/auth/admin` y `/auth/callback` son rutas hermanas de `/auth` (non-nested). Ver [AUTH_LAYOUT_001.md](./AUTH_LAYOUT_001.md).

**HOME-PATH-002:** si el FAIL se corta en `HOME_PATH_RESOLVED`, la evidencia incluye `home_path_gap` (`ROLE_READY.roles` + `STOP.reason`). Ver [HOME_PATH_002_EVIDENCE.md](./HOME_PATH_002_EVIDENCE.md).

**AUTH-SESSION-002:** si el form no aparece y UI = `checkingSession` / “Cargando…”, ver `auth_session_002` (qué `await` del cold mount quedó pendiente). [AUTH_SESSION_002_COLD_TIMING.md](./AUTH_SESSION_002_COLD_TIMING.md).

---

## Objetivo de producto

1. Auth Supabase real (contrato PASS)  
2. Sesión tras kill/reopen (Web + Android + iPhone)  
3. Consistencia entre plataformas  
4. Sin fricción innecesaria  

---

## Tras PASS

1. Smoke nativo estricto  
2. Pedido → cocina → reparto  
3. Beta EatClean  

FLOW-01 ⏸ hasta PS-002-C PASS.
