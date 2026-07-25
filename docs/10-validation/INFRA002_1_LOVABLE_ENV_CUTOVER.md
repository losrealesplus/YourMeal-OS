# INFRA-002.1 · Lovable Environment Cutover

**Tipo:** Informe técnico (diagnóstico)  
**Fecha:** 2026-07-25  
**Alcance:** De dónde obtiene este proyecto la configuración de Supabase · pasos de operador  
**Modo:** Sin cambios de código · sin PR

**Proyecto oficial:** `djangucecsphnejplvic`  
**URL oficial:** `https://djangucecsphnejplvic.supabase.co`

---

## Executive answers

| # | Pregunta | Respuesta |
|---|----------|-----------|
| 1 | ¿De dónde obtiene la URL? | Variables de entorno: cliente `import.meta.env.VITE_SUPABASE_URL` (fallback `process.env.SUPABASE_URL`); servidor/middleware `process.env.SUPABASE_URL` |
| 2 | ¿De dónde obtiene la Publishable Key? | Cliente `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY` (fallback `process.env.SUPABASE_PUBLISHABLE_KEY`); middleware `process.env.SUPABASE_PUBLISHABLE_KEY` |
| 3 | ¿Se leen desde variables de entorno? | **Sí.** No hay otro mecanismo en el código de aplicación. |
| 4 | ¿Valores hardcodeados? | **No** URL/key/project-ref en `src/`. Solo detección de prefijo `sb_publishable_` / `sb_secret_` (formato, no secretos). |
| 5 | ¿Lovable necesita sincronizar secretos de plataforma o basta el repo? | Para el **frontend (preview/publish)** basta el **`.env` del repositorio** (`VITE_*`). Lovable **no** usa Secrets UI para `VITE_*`. La conexión Supabase en Cloud (More → Cloud) es **adicional** (schema/migrations desde chat) y debe apuntar al mismo project ref. |
| 6 | ¿Pasos del operador? | Ver § Operator steps abajo. |

---

## 1. Cadena de configuración (evidencia)

### 1.1 Cliente browser / bundle Vite

Archivo: `src/integrations/supabase/client.ts` (marcado auto-generated Lovable)

```ts
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
```

- Prioridad en browser: **`VITE_SUPABASE_*`** (inyección build-time de Vite).  
- Fallback: `SUPABASE_*` (útil en SSR).  
- Si faltan → throw: *“Connect Supabase in Lovable Cloud.”*  
- Export: singleton lazy vía `Proxy` → `supabase`.

### 1.2 Middleware Auth (TanStack Start server)

Archivo: `src/integrations/supabase/auth-middleware.ts`

```ts
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
```

Solo `process.env` (sin `VITE_`). Usado por server functions (`requireSupabaseAuth`).

### 1.3 Admin server client (service role)

Archivo: `src/integrations/supabase/client.server.ts`

```ts
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
```

**Nunca** debe ir a Vite/`VITE_*`. Solo server/scripts.

### 1.4 Vite / Lovable build

Archivo: `vite.config.ts`

```ts
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
// Comment in-file: config includes "VITE_* env injection"
```

No redefine env. Confía en el preset Lovable + archivo `.env` del proyecto.

### 1.5 Lovable Auth bridge (OAuth)

Archivo: `src/integrations/lovable/index.ts`

- Usa `@lovable.dev/cloud-auth-js` para OAuth.  
- Tras OAuth: `supabase.auth.setSession(result.tokens)` sobre el **mismo** cliente de §1.1.  
- **No** aporta URL ni publishable key propias del proyecto Supabase de datos.

### 1.6 Consumers

Todos importan `@/integrations/supabase/client` (o middleware/server). No hay segundo `createClient` con URL literal en `src/`.

### 1.7 Config Lovable en repo

| Path | Contenido relevante |
|------|---------------------|
| `.lovable/project.json` | Template `tanstack_start_ts_current` — **sin** Supabase URL/key |
| `.env` | **Tracked in git** (requerido por Lovable para `VITE_*` en preview/build) |
| `supabase/config.toml` | Solo `project_id` (CLI); **no** alimenta el client JS |

---

## 2. Modelo Lovable (plataforma) vs este código

Según documentación Lovable ([Secrets](https://docs.lovable.dev/features/secrets), [Supabase integration](https://docs.lovable.dev/integrations/supabase)):

| Canal | Qué guarda | ¿Alimenta `client.ts`? |
|-------|------------|-------------------------|
| **`.env` en el repo** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, … | **Sí** (build-time) |
| **Cloud → Secrets** | Backend secrets; **rechaza** prefijo `VITE_` | **No** para el client browser |
| **More → Cloud · Connect Supabase** | Vincula org/proyecto Supabase a Lovable (migraciones/chat/schema) | **Indirecto**: Lovable suele alinear `.env` al conectar; el runtime del app sigue leyendo `.env` |
| Prefijos `SUPABASE_*` reservados en backend Lovable/Cloud | Edge / built-in backend | No sustituyen `import.meta.env.VITE_*` en este client |

**Conclusión para INFRA-002.1:**  
El cutover de **preview/producción de la app** se completa actualizando el **`.env` committed** (y rebuild).  
Además, el operador debe **reconectar** el proyecto Lovable al Supabase `djangucecsphnejplvic` en Cloud para que el chat/migrations de Lovable no sigan el proyecto antiguo.

---

## 3. Estado observado en el workspace de auditoría

| Superficie | Estado al auditar |
|------------|-------------------|
| `main` / working tree `.env` | Aún apunta al project ref **legacy** (publishable legacy presente) |
| PR INFRA-002 (#66) | Abierto (cutover de `.env`/`config.toml` hacia oficial) — **no mergeado** en `main` al momento del informe |
| `src/` hardcodes URL/key | Ausentes |
| Hardcodes de formato key | Solo `startsWith('sb_publishable_')` |

> Hasta merge de INFRA-002 **y** keys reales del proyecto oficial en `.env`, Lovable Preview seguirá (o fallará) según el `.env` que tenga el branch desplegado.

---

## 4. Respuestas detalladas (1–6)

### (1) URL

| Runtime | Fuente |
|---------|--------|
| Browser | `import.meta.env.VITE_SUPABASE_URL` |
| SSR fallback en mismo client | `process.env.SUPABASE_URL` |
| Middleware / admin server | `process.env.SUPABASE_URL` |

Valor esperado oficial: `https://djangucecsphnejplvic.supabase.co`

### (2) Publishable Key

| Runtime | Fuente |
|---------|--------|
| Browser | `import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY` |
| SSR fallback | `process.env.SUPABASE_PUBLISHABLE_KEY` |
| Middleware | `process.env.SUPABASE_PUBLISHABLE_KEY` |

Origen del valor: **Dashboard Supabase** → Project Settings → API → publishable / anon (formato `sb_publishable_…` en este proyecto).

### (3) ¿Env vars?

**Sí.** Única vía en código de aplicación.

### (4) ¿Hardcoded?

**No** valores de proyecto. Sí mensajes de error que mencionan “Lovable Cloud”.

### (5) ¿Secrets plataforma vs repo?

| Necesidad | Acción |
|-----------|--------|
| App UI / Auth client / Preview / Publish | Actualizar **`.env` en Git** (`VITE_*` + espejo `SUPABASE_URL` / `SUPABASE_PUBLISHABLE_KEY`) |
| Server functions que usen service role | `SUPABASE_SERVICE_ROLE_KEY` solo en entorno server / scripts locales — **nunca** `VITE_` |
| Edge Functions / secrets de terceros | Lovable Cloud Secrets o Supabase Edge secrets (fuera del client) |
| Lovable chat ↔ schema | **Connect** proyecto `djangucecsphnejplvic` en More → Cloud |

**No basta** “solo Secrets UI” sin tocar `.env`: este client **exige** `VITE_*` en build.

**No basta** solo Connect Cloud sin actualizar `.env` si el archivo committed sigue con el proyecto legacy.

### (6) Pasos exactos del operador

Ver sección siguiente.

---

## 5. Operator steps · Cutover Lovable completo

### A. Credenciales (Dashboard Supabase)

1. Abrir [proyecto oficial](https://supabase.com/dashboard/project/djangucecsphnejplvic).  
2. **Project Settings → API**.  
3. Copiar:
   - Project URL → `https://djangucecsphnejplvic.supabase.co`
   - **Publishable** key (`sb_publishable_…`)  
   - (Opcional scripts) **service_role** / secret — solo uso server, no Lovable `.env` con `VITE_`.

### B. Repositorio `.env` (obligatorio para este código)

En el branch que Lovable publica (idealmente tras merge INFRA-002), dejar:

```bash
SUPABASE_PROJECT_ID="djangucecsphnejplvic"
SUPABASE_URL="https://djangucecsphnejplvic.supabase.co"
SUPABASE_PUBLISHABLE_KEY="<publishable del dashboard>"

VITE_SUPABASE_PROJECT_ID="djangucecsphnejplvic"
VITE_SUPABASE_URL="https://djangucecsphnejplvic.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<misma publishable>"
```

4. Commit + push (Lovable **requiere** `.env` en git para previews; no gitignorear `.env` en este proyecto).  
5. **No** poner `SUPABASE_SERVICE_ROLE_KEY` en `VITE_*`.

### C. Lovable editor

6. Abrir el proyecto en Lovable.  
7. Verificar que el editor muestra el `.env` actualizado (sync Git).  
8. **More → Cloud**:
   - Si está conectado al proyecto antiguo: **Disconnect**.  
   - **Connect** → seleccionar `djangucecsphnejplvic` (organización linkeada).  
9. Forzar **rebuild / refresh Preview** (las `VITE_*` son build-time: sin rebuild no cambian).  
10. En Preview DevTools → Network: peticiones a `*.supabase.co` deben usar host `djangucecsphnejplvic`.

### D. Auth users (post-cutover)

11. Crear/usar usuarios en el Auth del **proyecto oficial** (el legacy no sirve).  
12. Platform Owners: emails allowlisted en `platform_owners` (migración OP-002) + login → `ensure_platform_owner_session`.  
13. Ejecutar smoke [G-03](./G03_PRODUCTION_SMOKE_CHECKLIST.md).

### E. Verificación rápida

```text
□ .env committed con URL/key oficiales
□ Preview Network → host djangucecsphnejplvic
□ Login no apunta al proyecto legacy
□ Consola sin “Missing Supabase environment variable(s)”
□ Cloud connector muestra el proyecto oficial
```

---

## 6. Matriz de variables

| Variable | Browser (`client.ts`) | Middleware | Admin server | Scripts seed |
|----------|----------------------|------------|--------------|--------------|
| `VITE_SUPABASE_URL` | ✅ primary | — | — | fallback OK |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | ✅ primary | — | — | — |
| `SUPABASE_URL` | fallback | ✅ | ✅ | ✅ |
| `SUPABASE_PUBLISHABLE_KEY` | fallback | ✅ | — | — |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ never | ❌ | ✅ | ✅ |
| `VITE_SUPABASE_PROJECT_ID` | no leído por client.ts | — | — | — |

`VITE_SUPABASE_PROJECT_ID` / `SUPABASE_PROJECT_ID` están en `.env` pero **el client JS no las usa** para `createClient`; sirven a tooling/CLI/documentación/Lovable. Conviene mantenerlas alineadas al ref oficial.

---

## 7. Riesgos

| Riesgo | Efecto |
|--------|--------|
| Actualizar solo Cloud Connect sin `.env` | Preview sigue en legacy |
| Actualizar `.env` sin rebuild Preview | Bundle antiguo con `VITE_*` viejas |
| Poner service_role en `VITE_*` | Exposición en bundle — prohibido |
| Merge INFRA-002 con keys vacías | Throw al init del client hasta pegar publishable |
| Usuarios Auth solo en legacy | Login “falla” o vacío de roles en oficial |

---

## 8. Criterio de cierre INFRA-002.1

PASS cuando:

1. `.env` en el branch publicado tiene URL + publishable del proyecto oficial.  
2. Lovable Cloud está conectado a `djangucecsphnejplvic`.  
3. Preview Network confirma el host oficial.  
4. Login de prueba crea sesión contra el proyecto oficial.

Entonces proceder a **G-03 Production Smoke**.
