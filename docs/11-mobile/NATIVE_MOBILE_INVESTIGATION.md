# Native Mobile Investigation — TanStack Start · Nitro · Cloudflare · Capacitor

**ID:** INV-NATIVE-001  
**Fecha:** 2026-07-30  
**Principio:** Evidence Before Versioning (FOPEBA)  
**ADR:** [0032 — Native Mobile Strategy](../adr/0032-native-mobile-strategy.md)  
**Alcance:** investigación técnica · **sin** cambios de código de producto  
**Proyecto as-built:** TanStack Start + Vite + Nitro (`@lovable.dev/vite-tanstack-config`, target Cloudflare) + Supabase

---

## 1. Pregunta

¿Puede YourMeal OS seguir siendo **SSR en web** y, con el **mismo código**, distribuirse en iOS/Android vía Capacitor — sin SPA global, sin React Native, con offline **modular**?

---

## 2. As-built (evidencia de repo)

| Hecho | Evidencia |
|-------|-----------|
| App única TanStack Start | `package.json` name `tanstack_start_ts`; `@tanstack/react-start` |
| Nitro presente | dependencia `nitro` 3.x beta; comentario en `vite.config.ts`: nitro build-only, default Cloudflare |
| SSR entry | `tanstackStart.server.entry = "server"` → `src/server.ts` |
| Server functions en uso | `createServerFn` en `src/lib/saas-admin.functions.ts`, `user-provisioning.functions.ts`, `tenant-admin.functions.ts` |
| Capacitor | **Ausente** (no hay `capacitor.config.*` ni deps) |
| Offline hoy | ADR 0008: preparado en arquitectura, **no implementar** |
| Mobile docs previos | mobile-first web; futuro `apps/mobile` — **superseded** por ADR 0032 |

---

## 3. Hallazgos externos (evidencia)

### 3.1 Capacitor `server.url` (Remote WebView)

| Fuente | Hallazgo |
|--------|----------|
| Capacitor Config / tipos | `server.url` documentado como **live-reload**; texto explícito: **not intended for use in production** |
| Maintainer Capacitor (PR #6762, 2024) | Recomendación oficial: **ship assets dentro del binario**; no depender de servidor remoto (riesgo rechazo stores) |
| Discussions #4080 / #5075 | Equipos lo usan en prod con éxito; deben manejar offline nativo, versionado de plugins, y zona gris App Store 4.7 |
| Issue #8302 | Cold start offline con `server.url` → pantalla en blanco; `errorPath` poco fiable en iOS |

**Veredicto Remote WebView:** viable como spike/dev; **no** baseline de producción YourMeal OS.

### 3.2 TanStack Start + Capacitor (Hybrid Shell)

| Fuente | Hallazgo |
|--------|----------|
| Comunidad TanStack + Capacitor (Aaron Saunders / plantillas) | Patrón dominante: **mismo repo**; web SSR; móvil empaqueta **cliente** (`dist/client` / SPA shell); API remota con URL absoluta |
| TanStack Start SPA mode (docs oficiales) | SPA mode = shell HTML/cliente **sin abandonar** server routes / server functions en el deployment web |
| `ssr-capacitor` (CLI comunitario) | Explicitamente: “no hay Node en el WebView”; mobile build = client shell; SSR permanece en el target web |
| Limitación `createServerFn` | En origen `capacitor://localhost` / `file://` **no** hay servidor co-localizado en `/__server` → hace falta base URL al deployment Nitro/Cloudflare o API routes |

**Veredicto Hybrid Shell:** compatible con “un código + web SSR + Capacitor contenedor”; es el patrón con más evidencia práctica y alineado con stores.

### 3.3 OTA / actualizaciones

| Opción | Rol |
|--------|-----|
| Capawesome Live Update / Capgo / `@capacitor/live-updates` | Actualiza **capa web** sin pasar por store |
| Store binary release | Obligatoria si cambian **plugins nativos** o permisos |
| Self-host en Cloudflare R2/Workers | Posible (ecosistema Capgo self-host) |

OTA **no** sustituye el empaquetado Hybrid Shell; lo complementa.

### 3.4 Cloudflare Workers + Nitro

El build actual ya asume Nitro → Cloudflare. El shell nativo **consume** ese origen (HTTPS) para SSR web y para RPC/API. No se requiere un segundo backend móvil.

---

## 4. Opciones evaluadas

```text
Opción 0  React Native duplicado          → RECHAZADA (ADR 0032)
Opción A  server.url → URL oficial SSR    → DEV ONLY / no baseline
Opción B  Hybrid Shell + API remota       → RECOMENDADA
Opción C  Solo PWA sin stores             → insuficiente para cocina/reparto de campo
```

### Comparativa

| Criterio | A Remote URL | B Hybrid Shell |
|----------|--------------|----------------|
| Un código | Sí | Sí |
| Web sigue SSR | Sí | Sí |
| Offline cold-start | Frágil (blank WebView) | Bundle local + SQLite posible |
| Posición oficial Capacitor | Desaconsejado prod | Alineado (assets in-app) |
| `createServerFn` | Funciona (mismo origen web) | Requiere URL absoluta / API |
| Riesgo App Store 4.7 | Más alto (wrapper puro) | Menor si hay valor nativo (push, offline, cámara) |
| OTA | “gratis” (siempre remoto) | Live Updates del web layer |

---

## 5. Arquitectura recomendada (evidencia → decisión)

```text
┌─────────────────────────────────────────────────────────┐
│  Código único · TanStack Start                          │
│  routes · Services · Query · Brand · Auth · Workspaces  │
└───────────────────────┬─────────────────────────────────┘
                        │
          ┌─────────────┴─────────────┐
          ▼                           ▼
   Target WEB SSR              Target NATIVE shell
   Nitro → Cloudflare          Capacitor WebView
   (HTML SSR + server fns)     (client bundle + plugins)
          │                           │
          └─────────────┬─────────────┘
                        ▼
                 Supabase + APIs
```

**Offline modular** (solo Kitchen / Delivery / Warehouse):

```text
UI operativa
  → Offline Gateway (detecta red)
      → online: Services / Supabase
      → offline: SQLite + Outbox queue (idempotent ops)
          → sync worker al recuperar red
              → conflict policy por dominio
```

Cliente y Admin: **sin** outbox; fail-closed si no hay red.

---

## 6. Limitaciones conocidas (aceptadas)

1. Capacitor no ejecuta Nitro dentro del teléfono.
2. Server functions co-localizadas no viajan al binario.
3. Auth en offline: sesión cacheada con TTL; operaciones sensibles requieren online.
4. Push / deep links / biometría = plugins nativos → ciclo de release store.
5. Lovable sync: Capacitor (`android/`, `ios/`) debe aislarse en convención de repo para no romper el editor web.
6. No abrir implementación mientras Platform Stabilization / PS-002-C sea el gate abierto.

---

## 7. Conclusión

| Pregunta | Respuesta |
|----------|-----------|
| ¿TanStack Start + Nitro + Cloudflare pueden convivir con Capacitor? | **Sí**, vía Hybrid Shell + API/SSR remoto |
| ¿`server.url` es la estrategia de producción? | **No** (evidencia oficial Capacitor) |
| ¿Hay que convertir el proyecto en SPA? | **No** |
| ¿React Native? | **No** |
| ¿Offline global? | **No** — modular operativo |
| ¿Código ahora? | **No** — ADR + plan primero |

**Siguiente artefacto:** [NATIVE_MOBILE_PLAN](./NATIVE_MOBILE_PLAN.md) (aprobación humana antes de implementar).
