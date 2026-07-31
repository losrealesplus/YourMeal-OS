# Checkpoint · Beta Readiness (EatClean Mobile)

**Fecha:** 2026-07-31  
**Tipo:** Revisión corta de fase (no auditoría)  
**Pregunta rectora:** ¿Puede EatClean utilizar esta aplicación durante una jornada de trabajo?  
**Contexto:** Cierre de infraestructura móvil MF-001 (M-01 → M-02 → M-04 → M-03).  

**PRs infra móvil:** #117 (M-01) · #119 (M-02) · #120 (M-04) · #122 (M-03) — merged.

---

## 1. Módulos completados (cimientos)

| Módulo | Estado | Qué habilita |
|--------|--------|--------------|
| Foundation / Identity / OM | ✅ | Plataforma base |
| M-01 Mobile Foundation | ✅ | Hybrid Shell Capacitor · `sync:mobile` · Android/iOS scaffold |
| M-02 DeviceCapabilities | ✅ | Dominio desacoplado de Capacitor |
| M-04 StorageProvider | ✅ | Persistencia unificada (sesión, idioma, onboarding) |
| M-03 Offline Queue | ✅ | Outbox de intenciones (sin ejecutar aún) |

**Veredicto cimientos:** suficientes para dejar de construir plataforma y centrar el sprint en **uso real**.

---

## 2. Qué NO está listo (y no bloquea una beta acotada)

| Tema | Estado | Nota |
|------|--------|------|
| M-06 Sync Engine | ❌ no empezado | Cola existe; nadie la drena aún |
| Offline cliente/admin | ❌ fuera de alcance | ADR-0032: online-only |
| Plugins (cámara, push, GPS) | ❌ diferidos | M-02 negocia `unavailable` |
| MF-002 Background | ⏸ Deferred | No abrir ahora |
| App Store / Play publish | ❌ posterior | Operador local para builds nativos |

---

## 3. Flujo cliente (Customer App)

| Paso | Ruta / superficie | ¿Usable en beta? |
|------|-------------------|------------------|
| Login | `/auth` | Sí (código); gate evidencia → PS-002-C |
| Menú semanal | `/app/menu` | Sí · datos Supabase |
| Programar pedido | `/app/schedule` | Sí · draft order |
| Pedidos | `/app/orders` | Sí |
| Métodos de pago | `/app/payment-methods` | Parcial · facturación tenant (no captura tarjeta) |
| Favoritos / settings / addresses | `/app/*` | Presentes; validar en dispositivo |

**Hueco crítico de evidencia:** sesión real Supabase en entorno piloto (**PS-002-C**).

---

## 4. Flujo administrador (Centro de Operaciones)

| Superficie | Estado |
|------------|--------|
| Dashboard, kitchen, kitchen-execution, delivery, orders | Conectadas (ops) |
| Production / routes / customers / dishes / menus | Presentes |
| Inventory · purchasing · reports · promotions | Placeholder — **fuera de beta** o declarar no-uso |

Beta EatClean puede acotar: **pedido cliente → cocina → reparto** sin inventarios/compras.

---

## 5. Android / iPhone

| Check | Estado |
|-------|--------|
| `capacitor.config.ts` · sin `server.url` | ✅ |
| `npm run sync:mobile` + CI mobile | ✅ |
| `@capacitor/preferences` (vía StorageProvider) | ✅ |
| Instalar en device (operador) | ☐ pendiente humano |
| Probar login + menú + pedido en device | ☐ pendiente humano |
| Probar admin kitchen/delivery en device o tablet | ☐ pendiente humano |

---

## 6. Bloqueadores reales para la primera beta

Ordenados por impacto en “jornada de trabajo”:

1. **PS-002-C** — Auth real con credenciales piloto (`PS002_EMAIL` / `PS002_PASSWORD`). Sin esto no hay evidencia de sesión estable.  
2. **FCR-009** — E2E auth (toaster / permanencia en `/auth`); investigación abierta.  
3. **Instalación nativa** — `sync:mobile` + open Android Studio / Xcode en máquina operador (cloud no sustituye).  
4. **Smoke de punta a punta en device** — cliente confirma pedido; ops ve/produce/entrega el mismo pedido (criterio [MILESTONE_EATCLEAN_PILOT_READY](./MILESTONE_EATCLEAN_PILOT_READY.md)).  
5. **No enganchar Offline Queue en UI** hasta exista ejecutor mínimo (o aceptar beta 100% online).

**No son bloqueadores de beta acotada:** M-06, cámara, push, SQLite, Background Sync, inventarios admin.

---

## 7. Decisión de fase

```text
ANTES                          AHORA
¿Arquitectura correcta?   →   ¿EatClean puede trabajar un día?
Construcción de plataforma →   Preparación para validación
MF-001 cimientos           →   Pilot smoke + gates de evidencia
```

**Siguiente sprint (recomendado):** solo trabajo que desbloquee instalación + jornada piloto.

| Prioridad | Trabajo | Por qué |
|-----------|---------|---------|
| P0 | Completar **PS-002-C** / auth E2E en proyecto oficial | Sin sesión no hay jornada |
| P0 | Smoke nativo EatClean (Android primero) | Demuestra app móvil, no solo web |
| P1 | Cerrar huecos del ciclo pedido→cocina→reparto visibles en device | Criterio del milestone piloto |
| P2 | Ejecutor mínimo de Offline Queue **solo si** un flujo offline operativo es imprescindible | Hoy el piloto cliente es online-only |
| Evitar | M-06 completo · MF-002 · plugins · pulido no ligado al smoke | Complejidad sin valor inmediato |

---

## 8. Definition of “beta usable” (esta fase)

EatClean puede:

1. Instalar el shell en un Android (o iPhone) de prueba.  
2. Iniciar sesión con usuario piloto.  
3. Ver menú, programar y confirmar un pedido.  
4. Desde ops, ver y avanzar ese pedido en cocina/reparto **sin salir de la plataforma**.  

Si falla cualquiera de 1–4, el siguiente PR se dedica a eso — no a más abstracciones.

---

## Referencias

- [MF-001](../11-mobile/MF-001_MOBILE_FOUNDATION.md) · [M-01 CLOSED](../11-mobile/M-01_CLOSED.md) · [M-02](../11-mobile/M-02_CLOSED.md) · [M-04](../11-mobile/M-04_CLOSED.md) · [M-03](../11-mobile/M-03_CLOSED.md)  
- [CURRENT_PHASE](./CURRENT_PHASE.md) · [MILESTONE_EATCLEAN_PILOT_READY](./MILESTONE_EATCLEAN_PILOT_READY.md)  
- [PRIORITY_PS002C_BEFORE_FLOW](../10-validation/PRIORITY_PS002C_BEFORE_FLOW.md) · [CAPACITOR_WORKFLOW](../11-mobile/CAPACITOR_WORKFLOW.md)
