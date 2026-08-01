# AUTH-SESSION-002 · Cold-start `checkingSession` timings

**Fecha:** 2026-08-01  
**Alcance:** Instrumentación / medición **solo** — no timeouts · no Auth fix · no cambio de navegación  
**Flujo:** Cold mount de `/auth/admin` (`useEffect` → `checkingSession`), **no** el login canónico FCR-008

---

## Por qué

AUTH-SESSION-001 aisló tres `await` en el effect de mount:

```text
getSession → ensurePlatformOwnerSession → loadRoles → setCheckingSession(false)
```

Sin timings no sabemos cuál cuelga. Este PR solo mide.

---

## Qué emite la app

`src/lib/auth-session-002-trace.ts` · wired en `src/routes/auth_.admin.tsx` (solo cold effect):

```text
[AUTH-SESSION-002] START { step, pending, lastCompleted, … }
[AUTH-SESSION-002] END   { step, durationMs, ok, … }
[AUTH-SESSION-002] SKIP  { step, reason }   // p.ej. no_session
[AUTH-SESSION-002] SUMMARY { durationsMs, pending, cancelled, … }
```

Comportamiento de Auth / ensure / roles: **igual**. Solo wrappers `trace.time(...)`.

---

## Qué guarda PS-002-C

Clave `auth_session_002` en `ps002c-canonical-auth.json` (también en form-timeout BLOCKED):

| Campo | Significado |
|-------|-------------|
| `durationsMs.getSession` | ms |
| `durationsMs.ensurePlatformOwnerSession` | ms |
| `durationsMs.loadRoles` | ms |
| `pending` / `diagnosis.hung_step` | paso con START sin END |
| `lastCompleted` | última promesa que terminó |

Si el formulario no aparece y UI = `checkingSession`, el reporte de consola imprime el bloque `AUTH-SESSION-002 · cold-start…`.

---

## Cómo interpretar

| Evidencia | Siguiente foco |
|-----------|----------------|
| `pending: getSession` | Supabase Auth / storage session |
| `pending: ensurePlatformOwnerSession` | `getUser` o RPC `ensure_platform_owner_session` |
| `pending: loadRoles` | query `user_roles` |
| `SUMMARY` + durations finitas | cold path completó — el “Cargando…” era first paint |

---

## Qué no cambia

- FCR-008 / `submit()`  
- `Promise.race` / timeouts  
- `resolvePostAdminLoginPath` / home path
