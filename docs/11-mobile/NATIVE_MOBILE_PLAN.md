# Native Mobile Plan — Capacitor · Offline modular

**Estado:** Proposed — **pendiente de aprobación**  
**ADR:** [0032](../adr/0032-native-mobile-strategy.md)  
**Evidencia:** [NATIVE_MOBILE_INVESTIGATION](./NATIVE_MOBILE_INVESTIGATION.md)  
**Regla:** no implementar hasta aprobación explícita  
**Gate producto vigente:** no adelantar a PS-002-C / FLOW-01

---

## 1. Objetivo

Integrar Capacitor como **contenedor nativo** de la app TanStack Start existente, preservando SSR web, y diseñar offline **solo** para Kitchen · Delivery · Warehouse.

---

## 2. Fases (técnicas)

### Fase 0 — Gobernanza (este PR)

- [x] ADR 0032 Accepted (estrategia)
- [x] Investigación INV-NATIVE-001
- [x] Plan + lista de cambios
- [ ] Aprobación humana del plan

### Fase 1 — Spike controlado (repo, sin stores)

1. Añadir Capacitor en rama dedicada (`cursor/…-capacitor-spike-f54a`).
2. Configurar `webDir` → salida **client** del build Start (no todo `dist` server).
3. Verificar `npx cap sync` + WebView carga shell.
4. Probar `Capacitor.isNativePlatform()` + base URL absoluta a preview Cloudflare.
5. Documentar CORS origins necesarios.
6. **No** merge a main sin DoD del spike.

### Fase 2 — Contrato de red nativa

1. Inventariar todos los `createServerFn` / loaders server-only.
2. Definir `VITE_NATIVE_API_BASE` (o equivalente) solo para target nativo.
3. Política: web = relative; native = absolute HTTPS al deployment.
4. Auth: confirmar flujo password/OAuth en WebView; redirect URLs Supabase para custom schemes si aplica.
5. Branding tenant (ADR 0014) verificado en shell.

### Fase 3 — Offline modular (diseño → CAP)

1. Definir **Offline Capability Contract** por módulo (qué entidades, qué comandos).
2. Outbox schema (id, tenant_id, command_type, payload, created_at, status, attempts).
3. SQLite schema espejo **mínimo** (no clonar todo Supabase).
4. Conflict policy por comando (OM / UL).
5. Feature flags por módulo (`offline.kitchen`, etc. · ADR 0007).
6. Implementar primero **un** comando piloto (p. ej. marcar plato preparado) bajo FLOW Kitchen.

### Fase 4 — Nativo de valor (stores)

1. Push notifications (cuando el Flow lo exija).
2. Cámara / firmas delivery.
3. Live Updates (OTA web layer) + política de canales.
4. Checklist App Store / Play (privacidad, permisos, no “website wrapper” vacío).

### Fase 5 — Release

1. Pipelines CI: build web SSR + build native shell.
2. Versionado binario ≠ versionado OTA.
3. Runbook offline sync + rollback OTA.

---

## 3. Diseño técnico resumido

### 3.1 Targets de build

| Target | Comando (futuro) | Artefacto |
|--------|------------------|-----------|
| Web SSR | `npm run build` (actual) | Nitro/Cloudflare worker + assets |
| Native shell | `build` + flag/env Capacitor | Client bundle → `android/` `ios/` |

La app **no** se reescribe como SPA. El shell nativo es un **segundo artefacto** del mismo grafo de rutas/cliente.

### 3.2 Offline stack (previsto)

| Capa | Tecnología candidata | Notas |
|------|----------------------|-------|
| Persistencia | `@capacitor-community/sqlite` (o evaluar) | Solo módulos offline |
| Cola | Outbox en SQLite | Idempotent command IDs |
| Sync | Worker en cliente → Supabase REST/RPC | Reintentos + backoff |
| Conflictos | Por dominio | Documentar en OM; no LWW global |
| Auth | Supabase session + secure storage | Refresh online; cola pausa si 401 |
| Push | `@capacitor/push-notifications` | Fase 4 |
| OTA | Capawesome / Capgo | Firma de bundles |

### 3.3 Superficies

| Módulo | Offline | Primeros comandos candidatos |
|--------|---------|------------------------------|
| Kitchen | Sí | mark_prepared · mark_packaged · read production snapshot |
| Delivery | Sí | check_in stop · complete delivery · capture signature · incident |
| Warehouse | Sí | adjust_temp_inventory · receive count |
| Customer app | No | — |
| Admin / SaaS | No | — |

---

## 4. Lista de cambios necesarios (cuando se apruebe)

### Repo / tooling

| Cambio | Tipo |
|--------|------|
| Deps `@capacitor/core` `cli` `ios` `android` | add |
| `capacitor.config.ts` (`appId`, `webDir`, sin `server.url` prod) | add |
| Scripts `build:native`, `cap:sync`, `cap:open:*` | package.json |
| `.gitignore` ajustes `android/` `ios/` locales si aplica | config |
| CI job native shell smoke (opcional spike) | ci |
| Convención Lovable: no editar proyectos nativos en Lovable | docs |

### Aplicación (después de spike)

| Cambio | Tipo |
|--------|------|
| Detect native platform + API base URL | `src/lib` / env |
| CORS / allowed origins en server entry | `src/server.ts` / CF |
| Supabase redirect URLs nativos | ops |
| Offline gateway + outbox (flagged) | new module |
| SQLite repositories por módulo operativo | new |
| Feature flags offline.* | DB + ADR 0007 |
| Tests: outbox idempotency · sync replay | test |

### Docs

| Cambio | Tipo |
|--------|------|
| Actualizar 11-mobile README (hecho en ADR PR) | docs |
| CAP offline por Flow (Kitchen/Delivery) | docs/22 |
| Runbook OTA + store | docs/11-mobile |

### Explicitamente fuera de este plan

- React Native
- Convertir web a SPA
- Offline para cliente final
- Implementar AI (ADR 0008)
- Saltar PS-002-C / abrir FLOW-01 solo por móvil

---

## 5. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Rechazo store por WebView remoto | Baseline Hybrid Shell + plugins de valor |
| Rotura `createServerFn` en native | URL absoluta + inventario previo |
| Lovable sync conflict con `ios/` `android/` | Carpetas nativas gobernadas; docs |
| Offline inconsistente con OM | Outbox solo sobre comandos certificados por Flow |
| Scope creep Capacitor ahora | Gate: aprobación plan + fase producto |

---

## 6. Criterio de aprobación

El plan se considera **aprobado** cuando un responsable de producto/CTO confirma por escrito (PR comment / Acta):

1. Hybrid Shell = packaging baseline.
2. Offline modular = Kitchen / Delivery / Warehouse only.
3. Implementación no arranca antes del gate de producto acordado.
4. Fase 1 spike puede abrirse en rama dedicada.

Hasta entonces: **ADR Accepted · implementación Frozen**.
