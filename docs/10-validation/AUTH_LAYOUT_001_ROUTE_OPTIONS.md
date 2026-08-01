# AUTH-LAYOUT-001 · Auth route architecture options

**Fecha:** 2026-08-01  
**Tipo:** Análisis arquitectónico (sin implementación)  
**Precedente:** PS-002-C timeout evidence · causa raíz: `/auth` padre sin `<Outlet />`  
**Decisión:** **Opción B adoptada** — implementación en [AUTH_LAYOUT_001.md](./AUTH_LAYOUT_001.md)

---

## 1. Estado actual (hechos)

```text
routeTree.gen.ts

/auth                 AuthRoute        → AuthPage (auth.tsx)
  ├── /auth/admin     AuthAdminRoute   → AdminAuthPage (auth.admin.tsx)
  └── /auth/callback  AuthCallbackRoute → AuthCallbackPage (auth.callback.tsx)
```

| Hecho | Evidencia |
|-------|-----------|
| `/auth/admin` es **hijo** de `/auth` | `getParentRoute: () => AuthRoute` |
| `AuthPage` **no** renderiza `<Outlet />` | `src/routes/auth.tsx` |
| Sin `Outlet`, el hijo **no se monta** | [TanStack Outlets](https://tanstack.com/router/latest/docs/framework/react/guide/outlets) |
| Playwright ve onboarding cliente | `onboarding1Title` / `Continuar` · storage limpio |
| URLs públicas deben permanecer | `/auth` · `/auth/admin` · `/auth/callback` (allowlist en `src/auth/urls.ts`, ADR-0014) |

**Mismo defecto afecta a `/auth/callback`:** también es hijo sin `Outlet` → `AuthCallbackPage` no se monta; OAuth/PKCE/recovery pueden estar rotos en perfil limpio de la misma forma.

Producto (ADR-0014): cliente y personal son **puertas distintas** bajo la misma marca — no el mismo journey.

---

## 2. Opción A — `AuthPage` renderiza `<Outlet />` (condicional o total)

### Idea

Mantener el anidamiento de archivos. En `auth.tsx`, cuando hay hijo matched, renderizar solo (o también) `<Outlet />` en lugar del splash/onboarding/login cliente.

### Cambios necesarios (estimados)

- `auth.tsx`: detectar child route (`useRouterState` / `Outlet` + index pattern)  
  - Exact `/auth` → UI cliente actual  
  - `/auth/admin` · `/auth/callback` → `<Outlet />` sin UI cliente  
- Posible `auth.index.tsx` si se separa leaf de layout (más limpio que `if` en el mismo archivo)  
- Regenerar `routeTree.gen.ts` solo si se mueven archivos  

### Impacto / efectos

| Dimensión | Efecto |
|-----------|--------|
| Cliente (`/auth`) | Conservable si el layout solo pinta `Outlet` en hijos |
| Admin (`/auth/admin`) | Empieza a montar `AdminAuthPage` → desbloquea PS-002-C |
| Callback | Se monta si se incluye en la rama `Outlet` |
| Routing / deep links | URLs **sin cambio** |
| Compatibilidad | Alta con links existentes · Supabase redirect URLs |
| Riesgo | Medio: lógica condicional fácil de romper (doble UI, flash de onboarding, SSR) |
| Complejidad | Baja–media (pocas líneas) pero **frágil** a largo plazo |

### Pros / contras

| Pros | Contras |
|------|---------|
| Cambio mínimo de archivos | Sigue acoplando admin/callback al padre cliente |
| URLs intactas | Condicionales en UI = deuda (regresiones) |
| Rápido para desbloquear PS-002-C | No refleja el modelo mental ADR-0014 (dos puertas) |

**Veredicto A:** viable como parche corto; **no** como arquitectura objetivo.

---

## 3. Opción B — Rutas hermanas (non-nested) bajo `__root`

### Idea

`/auth`, `/auth/admin` y (recomendado) `/auth/callback` dejan de compartir árbol de componentes. Mismo path URL; padres de layout distintos.

Mecanismo oficial TanStack (**Non-Nested Routes**): sufijo `_` en el segmento padre del nombre de archivo:

```text
auth.tsx              →  /auth                 (AuthPage)
auth_.admin.tsx       →  /auth/admin           (AdminAuthPage, NO nested under AuthPage)
auth_.callback.tsx    →  /auth/callback        (AuthCallbackPage, NO nested)
```

Documentación: [Routing concepts · Non-Nested Routes](https://tanstack.com/router/latest/docs/framework/react/routing/routing-concepts#non-nested-routes).

Árbol conceptual:

```text
__root
  ├── /auth
  ├── /auth/admin
  ├── /auth/callback
  ├── /reset-password
  └── /_authenticated /…
```

### Cambios necesarios (estimados)

- Rename: `auth.admin.tsx` → `auth_.admin.tsx`  
- Rename: `auth.callback.tsx` → `auth_.callback.tsx` (mismo bug)  
- Plugin regenera `createFileRoute('/auth/admin')` / parent → root  
- Auditar imports/tests que asuman nesting (pocos; paths string siguen iguales)  
- Smoke: deep link `/auth/admin`, OAuth callback, recovery  

### Impacto / efectos

| Dimensión | Efecto |
|-----------|--------|
| Cliente | Intacta: onboarding/login solo en `/auth` |
| Admin | Monta siempre su propia UI · sin `tenant_onboarding_done` |
| Callback | Monta su propia UI · crítico para PKCE |
| Routing | IDs internos cambian; **fullPath públicos iguales** |
| Deep links | `/auth/admin?returnTo=…` · allowlist `urls.ts` · sin cambio |
| Compatibilidad | Alta (URLs + Supabase Site URL / redirects) |
| Riesgo | Bajo–medio (rename + regen + smoke) · patrón oficial |
| Complejidad | Baja · alineada con el framework |

### Pros / contras

| Pros | Contras |
|------|---------|
| Coincide con ADR-0014 (dos puertas) | Hay que renombrar callback también (correcto, no opcional) |
| Sin condicionales en AuthPage | Equipo debe conocer convención `auth_.…` |
| Arregla admin **y** callback | — |
| Deep links / PS-002-C / EP-002A.1.1 estables | — |

**Veredicto B:** **recomendación principal.**

---

## 4. Opción C — Pathless layout para auth

### Idea

Introducir un layout sin segmento de URL (como `_authenticated`) que envuelva las rutas auth solo si hay UI/contexto compartido real:

```text
_auth.tsx                 →  <Outlet /> (+ ¿TenantBrandScope?)
_auth.auth.tsx            →  /auth          (?)
_auth.auth.admin.tsx      →  paths delicados
```

O carpeta `_auth/` con `route.tsx` + hojas.

Pathless layouts **no** añaden `/_auth` a la URL; sirven para loaders/context compartidos.

### Cambios necesarios (estimados)

- Crear pathless parent + reubicar `auth` / `admin` / `callback` como hijos con `Outlet` en el pathless  
- Decidir qué se comparte (brand scope, i18n, error boundary) vs qué no (onboarding)  
- Más movimiento de archivos que B  

### Impacto / efectos

| Dimensión | Efecto |
|-----------|--------|
| Cliente / Admin | Correctos **si** el pathless solo hace `Outlet` y las hojas son independientes |
| Callback | Igual |
| Routing | URLs pueden mantenerse; IDs de ruta más largos |
| Deep links | Estables si fullPath no cambia |
| Compatibilidad | Alta si se diseña bien |
| Riesgo | Medio: fácil recrear el bug (meter UI cliente en el pathless) |
| Complejidad | Media · aporta valor solo si hay shared shell real |

### Pros / contras

| Pros | Contras |
|------|---------|
| Lugar natural para guards/context auth compartido | Hoy **casi no hay** layout compartido útil (cada página ya usa `TenantBrandScope`) |
| Escalable si auth crece | Más archivos / indirection que B |
| — | Overkill para el bug actual |

**Veredicto C:** correcta a medio plazo si surge shell compartido; **no** la mínima solución ahora.

---

## 5. Comparativa

| Criterio | A Outlet condicional | **B Hermanas (non-nested)** | C Pathless layout |
|----------|----------------------|-----------------------------|-------------------|
| Desbloquea PS-002-C | Sí | **Sí** | Sí |
| Arregla `/auth/callback` | Solo si se contempla | **Sí (rename)** | Sí |
| URLs / deep links | Iguales | **Iguales** | Iguales |
| Alineación ADR-0014 | Débil | **Fuerte** | Media |
| Riesgo de regresión UI | Medio–alto | **Bajo** | Medio |
| Complejidad | Baja frágil | **Baja limpia** | Media |
| Deuda futura | Alta | **Baja** | Baja si se necesita |

---

## 6. Recomendación final

```text
AUTH-LAYOUT-001 → Opción B (rutas hermanas / non-nested)

auth.tsx
auth_.admin.tsx
auth_.callback.tsx
```

**Por qué**

1. Cliente y admin son productos de entrada distintos (ADR-0014) — no deben compartir árbol de componentes.  
2. El framework ya ofrece `auth_.admin.tsx` para path `/auth/admin` sin layout padre.  
3. Corrige el mismo defecto en **callback** (hoy también huérfano).  
4. Cero cambio de deep links / allowlist / Supabase redirect URLs.  
5. Sin hacks en el runner PS-002-C.

**No elegir A** como destino: desbloquea rápido pero mantiene el acoplamiento erróneo.  
**No elegir C ahora:** no hay layout compartido que lo justifique; se puede introducir después sin deshacer B.

---

## 7. Criterios de aceptación (cuando se implemente)

Sin implementar aquí — checklist futuro:

- [ ] `goto /auth/admin` monta `AdminAuthPage` (email/password ops) en perfil limpio  
- [ ] `goto /auth` sigue mostrando splash → onboarding/login cliente  
- [ ] `goto /auth/callback` monta `AuthCallbackPage` (no onboarding)  
- [ ] Deep link `/auth/admin?returnTo=/admin` intacto  
- [ ] `npm run test:ps002-canonical-auth` supera la espera del formulario (siguientes gates Auth aparte)  
- [ ] Runner **sin** cambios de timeouts/selectors  

---

## 8. Relación con PS-002-C

| Capa | Estado |
|------|--------|
| Infra Playwright / Chromium | Cerrada |
| Observabilidad timeout | Cerrada (PR #131) |
| Causa raíz producto | Identificada |
| Fix | **AUTH-LAYOUT-001 · Opción B** (siguiente bloque de trabajo) |

PS-002-C deja de estar bloqueado por entorno; el siguiente cambio es **routing**, no Auth Supabase.
