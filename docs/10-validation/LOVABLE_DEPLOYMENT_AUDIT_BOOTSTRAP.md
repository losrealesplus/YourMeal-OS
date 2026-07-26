# Auditoría de Despliegue · Bootstrap Smoke (#82)

**Tipo:** Deployment Audit (sin cambios de aplicación)  
**Fecha:** 2026-07-26  
**Gate relacionado:** [DV-001](./DEPLOYMENT_VERIFICATION.md)  
**Smoke:** [BOOTSTRAP_SMOKE_FORCE](../00-status/BOOTSTRAP_SMOKE_FORCE.md)

---

## Hechos verificables desde GitHub (este agente)

| Pregunta | Respuesta |
|----------|-----------|
| ¿PR #80 (Bootstrap) en `main`? | **Sí** — merge `c628bfc` |
| ¿PR #81 (banner + FCR) en `main`? | **Sí** — merge `dc1b242` |
| ¿PR #82 (`isBootstrapMode()=true` forzado) en `main`? | **Sí** — merge `92577b0` · 2026-07-26T18:15:29Z |
| Tip de `origin/main` con smoke | `92577b060d512f2b36a567ac14c93d41a4177a84` |
| Commit del force | `4d96fdf72b60898ef60e6e3dfc57239e617b6ea0` |
| ¿GitHub Deployments API visible? | **No** — 403 (sin deployments listables desde esta integración) |
| ¿Workflow CI que despliega a Lovable? | **No** — solo `.github/workflows/migration-bootstrap.yml` |
| ¿Este agente puede leer preview Lovable / env Cloud? | **No** |

Conclusión GitHub: el código forzado **está en `main`**. Si la UI sigue en `/auth` login, el fallo **no** se puede atribuir a “Bootstrap no implementado en el repo”.

---

## Pregunta crítica (operador)

> ¿La preview que miras es rebuild desde `main` tras el merge de #82, o una Preview de otra rama / PR / publish antiguo?

| Escenario | Efecto |
|-----------|--------|
| Lovable conectado a `main` + rebuild post-`92577b0` | Debe aparecer Bootstrap (force ON, sin env) |
| Preview de otra rama / PR pre-#82 | Sigue login — esperado |
| Publish `eatcleanapp.lovable.app` sin sync | Puede servir build antiguo |
| Sync GitHub→Lovable pendiente / caché | Serve código viejo aunque `main` esté bien |

**Diferencia crítica:** merge en GitHub ≠ runtime Lovable. DV-001 exige igualdad de SHA en runtime.

---

## Checklist operador (responder en la tabla)

### 1. ¿Qué commit está desplegado en la preview?

| Campo | Valor (rellenar) |
|-------|------------------|
| URL exacta abierta | |
| SHA / build id visible en Lovable (si existe) | |
| ¿Coincide con `92577b0`? | Sí / No / Desconocido |

### 2. ¿Qué rama usa Lovable?

| Campo | Valor |
|-------|-------|
| Rama conectada (GitHub Integration) | `main` / otra: ___ |
| ¿Preview de PR o proyecto principal? | PR / Main publish / Desconocido |

### 3. ¿Existe caché de build?

| Campo | Valor |
|-------|-------|
| Rebuild forzado tras #82 | Sí / No |
| Hora del último build Lovable | |

### 4. ¿Se ejecutó rebuild después del merge?

| Campo | Valor |
|-------|-------|
| Merge #82 en GitHub | **Sí** (18:15 UTC) |
| Rebuild Lovable posterior a 18:15 UTC | Sí / No / Desconocido |

### 5. ¿Qué variables de entorno lee esa build?

| Variable | Esperado en `.env.example` | En Lovable Cloud (rellenar) |
|----------|----------------------------|-----------------------------|
| `VITE_BOOTSTRAP_MODE` | `"false"` (default) | |
| Nota | Con #82 **irrelevante** (force `true` en código) | Si tras force sigue login → no es env |

### 6. ¿Sync GitHub ↔ Lovable pendiente?

| Campo | Valor |
|-------|-------|
| Estado integración GitHub en Lovable | Connected / Error / Desconocido |
| Último sync / pull visible | |
| ¿`main` tip en Lovable = `92577b0`? | Sí / No / Desconocido |

---

## Cadena lógica (cerrada en repo)

```text
PR #80 → Bootstrap implementado          ✅ main
PR #82 → isBootstrapMode() = true        ✅ main
IdentityProvider cableado                ✅
BootstrapShell cableado                  ✅
Selector cableado                        ✅
```

Si la preview sigue mostrando `/auth` → Login:

> **El runtime no es el tip de `main` post-#82.**  
> Parar PRs de frontend. Abrir incidencia de pipeline Lovable / sync.

---

## Criterio de stop (Ingeniería)

| Condición | Acción |
|-----------|--------|
| Tras rebuild de `main@92577b0` → Bootstrap UI | Mundo A resuelto por force; configurar env; **revertir smoke** |
| Tras rebuild de `main@92577b0` → sigue Login | **Mundo B** · 0 PRs app · incidente despliegue |
| No se puede confirmar SHA del runtime | **DV-001 BLOCKED** · no certificar nada |

---

## Prueba nuclear (solo si Mundo B confirmado o SHA ilegible)

Si el operador confirma rebuild de `main` post-#82 y sigue login **o** no hay forma de ver el SHA:

Una sola pantalla raíz sin providers (“BUILD TEST PR82” a pantalla completa).  
Si tampoco aparece → prueba definitiva de preview ≠ código.  
**No abrir esa prueba hasta completar la tabla de este documento.**

---

## Veredicto provisional (agente)

| Dimensión | Estado |
|-----------|--------|
| Código en GitHub | **PASS** — smoke en `main` |
| Runtime Lovable = ese SHA | **UNKNOWN** — solo operador |
| Auth / Supabase como causa del login actual | **Descartado como hipótesis principal** bajo force ON |

**Siguiente paso válido:** rellenar esta tabla en Lovable UI.  
**Siguiente paso inválido:** más PRs de Bootstrap / Auth / React hasta DV-001.
