# ADR 0032 — Native Mobile Strategy

## Estado

**Accepted** — 2026-07-30  
**Implementación:** **congelada** hasta aprobación del plan técnico  
**Evidencia:** [NATIVE_MOBILE_INVESTIGATION](../11-mobile/NATIVE_MOBILE_INVESTIGATION.md) · [NATIVE_MOBILE_PLAN](../11-mobile/NATIVE_MOBILE_PLAN.md)  
**Paquete de trabajo:** [MF-001 · Mobile Foundation](../11-mobile/MF-001_MOBILE_FOUNDATION.md) (M-01…M-06)  
**Principio derivado:** [ADR 0033 — Platform Independence](./0033-platform-independence.md)

## Principio canónico

> **Una aplicación. Un código. Capacitor es solo el contenedor nativo.**

> **Offline es por módulo operativo, no por aplicación.**

## Decisión

YourMeal OS utilizará **una única aplicación SSR** basada en **TanStack Start** (Vite + Nitro; despliegue previsto Cloudflare Workers).

Las aplicaciones **iOS** y **Android** se distribuirán mediante **Capacitor** como contenedor nativo (App Store / Google Play).

| Decisión | Valor |
|----------|-------|
| Código | **Único** — misma app, mismos routes/Services/UI |
| Contenedor nativo | **Capacitor** |
| React Native / app duplicada | **No** |
| Web | Sigue siendo **SSR** (no se convierte el producto en SPA) |
| Offline | **Modular** (Kitchen · Delivery · Warehouse) |
| Cliente (B2C/B2B ordering) | **Online-only** |
| Administración / SaaS Admin | **Online-only** (salvo decisión futura) |
| Implementación Capacitor ahora | **No** — solo ADR + plan + lista de cambios |

Esta ADR **refina** [ADR 0008](./0008-ai-offline-ready.md): la intención offline permanece; el alcance se acota a módulos operativos y se pospone la implementación hasta evidencia + plan aprobado.

Esta ADR **sustituye** la proyección en [docs/11-mobile](../11-mobile/README.md) de un `apps/mobile` dedicado como camino preferente. El monorepo puede existir más adelante por empaquetado; **no** implica un segundo producto React Native.

## Contexto

YourMeal OS ya es una sola app TanStack Start (`src/`), con Auth/RBAC, Order Intake, Operational Workspaces y Branding Tenant-Managed ([ADR 0014](./0014-customer-application-is-tenant-branded.md)).

Necesidades de campo (FOPEBA / FLOW-01 Kitchen → Delivery):

- Cocina, repartidores y almacén operan en entornos con conectividad intermitente.
- Los clientes finales no requieren offline.
- Duplicar en React Native rompería Lovable sync, doblaría coste y contradiría “Implementation is Knowledge Materialization” ([ADR 0013](./0013-implementation-is-knowledge-materialization.md)).

FOPEBA exige **Evidence Before Versioning**: no se versiona una integración Capacitor sin investigación de compatibilidad SSR/Nitro/Cloudflare.

## Arquitectura objetivo

```text
                    YourMeal OS
                          │
        ┌─────────────────┴──────────────────┐
        │                                    │
   Aplicación Web SSR                 Capacitor
   (TanStack Start)              (iOS / Android)
        │                                    │
        └──────────────┬─────────────────────┘
                       │
               Cloudflare + Nitro
                       │
                  Supabase
```

Capacitor **no** es un segundo frontend. Es el shell nativo (WebView + plugins) que presenta el mismo producto.

### Empaquetado nativo (decisión de empaquetado)

La visión de producto (“Capacitor abre la URL oficial”) se mantiene como **experiencia de origen**. La investigación técnica recomienda, para **producción en stores**, el patrón **Hybrid Shell** (no depender de `server.url` en producción):

| Patrón | Descripción | Uso YourMeal OS |
|--------|-------------|-----------------|
| **A · Remote WebView** (`server.url` → `https://eatclean…`) | WebView carga SSR remoto | Dev / spike · **no** baseline de producción (ver evidencia) |
| **B · Hybrid Shell** (recomendado) | Bundle cliente del mismo código en el binario; datos/API hacia Nitro/Supabase; OTA del web layer | **Baseline de producción** |

Detalle y riesgos: [NATIVE_MOBILE_INVESTIGATION](../11-mobile/NATIVE_MOBILE_INVESTIGATION.md).

La web pública **sigue SSR**. El shell nativo es un **target de build** del mismo codebase (cliente), no una SPA paralela ni un fork.

## Offline modular

| Superficie | Offline | Capacidad mínima |
|------------|---------|------------------|
| Cliente (pedido / menú) | **No** | Siempre online |
| Administración / SaaS | **No** (default) | Online |
| Cocina | **Sí** | Producción · platos preparados · empaquetado · sync diferido |
| Reparto | **Sí** | Rutas · entregas · firmas · incidencias · sync |
| Almacén | **Sí** | Inventario temporal · sync |

Stack offline previsto (implementación futura, no ahora):

- Storage local + **SQLite** (p. ej. Capacitor Community SQLite / equivalente)
- **Cola de operaciones** idempotente (alineada con Services + soft delete + audit · ADR 0005/0006/0008)
- Sincronización con **Supabase**
- Política de **conflictos** por dominio (last-write-wins solo donde el OM lo permita)
- Auth: sesión online; refresh/rehidratación acotada; sin “Auth mock”
- Push: Capacitor Push + backend (fuera del gate actual Platform Stabilization)
- OTA: Live Updates del **web layer** (Capawesome / Capgo / Ionic), **no** sustituye releases nativos de plugins

## Consecuencias

### Positivas

- Un solo conocimiento materializado → un solo producto.
- Offline acotado al riesgo operativo real (FOPEBA).
- Stores sin mantener React Native.
- Compatible con Lovable + Cursor sobre el mismo árbol `src/`.

### Negativas / restricciones

- `createServerFn` asume origen co-localizado; en shell nativo hay que usar **URL absoluta** al deployment Nitro/Cloudflare o API routes explícitas (ya hay server fns en `src/lib/*`).
- CORS / orígenes Capacitor (`capacitor://localhost`, etc.) deben planificarse.
- Offline exige diseño de cola e idempotencia **antes** de codificar UI offline.
- Plugins nativos fijan versión del binario; OTA no actualiza código nativo.
- `server.url` en producción: advertencia oficial Capacitor + riesgo de rechazo store + cold-start offline en blanco — **excluido del baseline**.

### No hacer

- No convertir el proyecto entero en SPA.
- No abrir React Native.
- No implementar Capacitor / SQLite / sync / push en este PR.
- No abrir FLOW-01 ni cambiar el gate Platform Stabilization por esta ADR.
- No tratar “móvil” como app distinta de la Customer Application Tenant-Branded.

## Relación con otras ADR

| ADR | Relación |
|-----|----------|
| [0005](./0005-services-layer.md) | Mutations offline pasan por Services / cola, no por UI |
| [0006](./0006-soft-delete-audit.md) | IDs estables + audit habilitan sync |
| [0008](./0008-ai-offline-ready.md) | Intención offline; 0032 acota módulos y empaquetado |
| [0013](./0013-implementation-is-knowledge-materialization.md) | Móvil materializa el mismo OM |
| [0014](./0014-customer-application-is-tenant-branded.md) | Branding tenant también en shell nativo |
| [0033](./0033-platform-independence.md) | Dominio agnóstico · ports/adapters |

## Criterio de apertura de implementación

Implementación Capacitor solo cuando:

1. Esta ADR permanece Accepted.
2. [ADR 0033](./0033-platform-independence.md) permanece Accepted.
3. [MF-001](../11-mobile/MF-001_MOBILE_FOUNDATION.md) + [NATIVE_MOBILE_PLAN](../11-mobile/NATIVE_MOBILE_PLAN.md) están **aprobados** explícitamente.
4. El gate de producto vigente (hoy: PS-002-C → FLOW-01) no se salta por “móvil primero”.

> **PS-003** = Navigation Stability (Platform Stabilization). No es este trabajo móvil.

## Referencias

- Investigación: [NATIVE_MOBILE_INVESTIGATION](../11-mobile/NATIVE_MOBILE_INVESTIGATION.md)
- Plan + lista de cambios: [NATIVE_MOBILE_PLAN](../11-mobile/NATIVE_MOBILE_PLAN.md)
- Paquete MF-001: [MF-001_MOBILE_FOUNDATION](../11-mobile/MF-001_MOBILE_FOUNDATION.md)
- Mobile index: [docs/11-mobile](../11-mobile/README.md)
