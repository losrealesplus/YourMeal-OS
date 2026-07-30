# Native Mobile Plan — Capacitor · Offline modular

**Estado:** Proposed — **pendiente de aprobación**  
**ADR:** [0032](../adr/0032-native-mobile-strategy.md) · [0033](../adr/0033-platform-independence.md)  
**Paquete:** [MF-001 · Mobile Foundation](./MF-001_MOBILE_FOUNDATION.md) (tareas **M-01…M-05**)  
**Evidencia:** [NATIVE_MOBILE_INVESTIGATION](./NATIVE_MOBILE_INVESTIGATION.md)  
**Regla:** no implementar hasta aprobación explícita  
**Gate producto vigente:** no adelantar a PS-002-C / FLOW-01  
**Nota ID:** **PS-003** ≠ móvil (Navigation Stability · PASS). Usar **MF-001**.

---

## 1. Objetivo

Integrar Capacitor como **contenedor nativo** de la app TanStack Start existente, preservando SSR web, y diseñar offline **solo** para Kitchen · Delivery · Warehouse — con dominio **platform-independent**.

---

## 2. Mapa MF-001 ↔ fases

| Tarea MF-001 | Fase técnica | Resumen |
|--------------|--------------|---------|
| **M-01** | Fase 1 | `/mobile` · Capacitor · iOS/Android |
| **M-02** | Fase 1–2 / Release prep | `build:web` · `build:mobile` · `sync:mobile` |
| **M-03** | Fase 3 | Offline Engine (SQLite · cola · estados · conflictos · retries · auditoría) |
| **M-04** | Pre-Fase 3 | `StorageProvider` (no localStorage/IDB directos) |
| **M-05** | Pre-Fase 4 | Native Services ports (Camera · Push · Biometric · GPS · Files · Share · Deep Links) |

Orden preferido: **M-01 → M-02 → M-04 → M-05 → M-03** (adapters antes del motor offline).

---

## 3. Fases (técnicas)

### Fase 0 — Gobernanza

- [x] ADR 0032 Accepted (estrategia)
- [x] ADR 0033 Platform Independence
- [x] MF-001 documentado (M-01…M-05)
- [x] Investigación INV-NATIVE-001
- [x] Plan + lista de cambios
- [ ] Aprobación humana del plan / MF-001

### Fase 1 — Spike controlado (M-01 · M-02)

1. Añadir Capacitor en rama dedicada (`cursor/…-capacitor-spike-f54a`).
2. Configurar `webDir` → salida **client** del build Start (no todo `dist` server).
3. Scripts `build:web` / `build:mobile` / `sync:mobile` sin romper SSR.
4. Verificar `npx cap sync` + WebView carga shell.
5. Probar detección nativa **solo** en adapters + base URL absoluta a preview Cloudflare.
6. Documentar CORS origins necesarios.
7. **No** merge a main sin DoD del spike.

### Fase 2 — Contrato de red nativa (sigue M-02)

1. Inventariar todos los `createServerFn` / loaders server-only.
2. Definir `VITE_NATIVE_API_BASE` (o equivalente) solo para target nativo.
3. Política: web = relative; native = absolute HTTPS al deployment.
4. Auth: confirmar flujo password/OAuth en WebView; redirect URLs Supabase para custom schemes si aplica.
5. Branding tenant (ADR 0014) verificado en shell.

### Fase 3 — Offline modular (M-03; después M-04)

1. Definir **Offline Capability Contract** por módulo (qué entidades, qué comandos).
2. Outbox schema (id, tenant_id, command_type, payload, created_at, status, attempts).
3. SQLite schema espejo **mínimo** (no clonar todo Supabase).
4. Conflict policy por comando (OM / UL) · prioridades · retries · auditoría.
5. Feature flags por módulo (`offline.kitchen`, etc. · ADR 0007).
6. Implementar primero **un** comando piloto (p. ej. marcar plato preparado) bajo FLOW Kitchen.

### Fase 4 — Nativo de valor (M-05 → stores)

1. Adapters Capacitor detrás de puertos (Camera · Push · …).
2. Push notifications (cuando el Flow lo exija).
3. Cámara / firmas delivery.
4. Live Updates (OTA web layer) + política de canales.
5. Checklist App Store / Play (privacidad, permisos, no “website wrapper” vacío).

### Fase 5 — Release

1. Pipelines CI: build web SSR + build native shell.
2. Versionado binario ≠ versionado OTA.
3. Runbook offline sync + rollback OTA.

---

## 4. Diseño técnico resumido

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

## 5. Lista de cambios necesarios (cuando se apruebe)

### Repo / tooling (M-01 · M-02)

| Cambio | Tipo |
|--------|------|
| Árbol `/mobile` + deps `@capacitor/core` `cli` `ios` `android` | add |
| `capacitor.config.ts` (`appId`, `webDir`, sin `server.url` prod) | add |
| Scripts `build:web`, `build:mobile`, `sync:mobile`, `cap:open:*` | package.json |
| `.gitignore` ajustes `android/` `ios/` locales si aplica | config |
| CI job native shell smoke (opcional spike) | ci |
| Convención Lovable: no editar proyectos nativos en Lovable | docs |

### Aplicación (después de spike · M-03…M-05)

| Cambio | Tipo | Tarea |
|--------|------|-------|
| `StorageProvider` + adapters web/native | new | M-04 |
| Native Service ports + stubs | new | M-05 |
| Detect native **solo en adapters** + API base URL | `src/lib` / env | M-02/05 |
| CORS / allowed origins en server entry | `src/server.ts` / CF | M-02 |
| Supabase redirect URLs nativos | ops | M-02 |
| Offline gateway + outbox (flagged) | new module | M-03 |
| SQLite repositories por módulo operativo | new | M-03 |
| Feature flags offline.* | DB + ADR 0007 | M-03 |
| Tests: outbox idempotency · sync replay · storage contract | test | M-03/04 |

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

## 6. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Rechazo store por WebView remoto | Baseline Hybrid Shell + plugins de valor |
| Rotura `createServerFn` en native | URL absoluta + inventario previo |
| Lovable sync conflict con `ios/` `android/` | Carpetas nativas gobernadas; docs |
| Offline inconsistente con OM | Outbox solo sobre comandos certificados por Flow |
| Scope creep Capacitor ahora | Gate: aprobación plan + fase producto |

---

## 7. Criterio de aprobación

El plan se considera **aprobado** cuando un responsable de producto/CTO confirma por escrito (PR comment / Acta):

1. Hybrid Shell = packaging baseline.
2. Offline modular = Kitchen / Delivery / Warehouse only.
3. Platform Independence (ADR 0033) = obligatorio en M-04/M-05.
4. Paquete de trabajo = **MF-001** (no reutilizar PS-003).
5. Implementación no arranca antes del gate de producto acordado.
6. Spike M-01/M-02 puede abrirse en rama dedicada.

Hasta entonces: **ADR Accepted · MF-001 Proposed · implementación Frozen**.
