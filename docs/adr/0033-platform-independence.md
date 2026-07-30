# ADR 0033 — Platform Independence

## Estado

**Accepted** — 2026-07-30  
**Deriva de:** [ADR 0032 — Native Mobile Strategy](./0032-native-mobile-strategy.md)  
**Paquete:** [MF-001 · Mobile Foundation](../11-mobile/MF-001_MOBILE_FOUNDATION.md)

## Principio canónico

> **Platform Independence**

> La lógica de negocio nunca dependerá de una plataforma concreta (Web, iOS o Android). Toda capacidad nativa se expone mediante **interfaces y adaptadores**, preservando un único dominio compartido.

## Decisión

YourMeal OS adopta **independencia de plataforma** como principio arquitectónico permanente:

| Capa | Puede conocer Web / iOS / Android | |
|------|-----------------------------------|--|
| Domain · Services · Application | **No** | |
| UI de producto (routes, workspaces) | Preferir agnóstico; detectar plataforma solo vía ports | |
| Adapters (`StorageProvider`, `CameraService`, …) | **Sí** | Capacitor, DOM, Tauri, etc. |
| Contenedor Capacitor | **Sí** | Solo shell + plugins |

### Consecuencias prácticas

1. **Prohibido** importar `@capacitor/*` (u otro SDK nativo) desde Services, repositorios de dominio o reglas de negocio.
2. Capacidades nativas se modelan como **puertos** (M-05) con adapters web (no-op o degradación) y native.
3. Persistencia local pasa por **`StorageProvider`** (M-04) — no `localStorage` / IndexedDB / SQLite directos en dominio.
4. Offline Engine (M-03) opera sobre el dominio compartido; la cola y SQLite son infraestructura detrás de puertos.
5. Si mañana se añade escritorio (**Tauri** / **Electron**), se añaden adapters — no se bifurca el OM ni el frontend de negocio.

## Contexto

ADR 0032 fija: un código · Capacitor contenedor · Hybrid Shell · offline modular.

Sin Platform Independence, Hybrid Shell degenera en `#ifdef Capacitor` dentro del dominio y vuelve imposible:

- tests sin device,
- Lovable/web-first development,
- un futuro target desktop,
- y la materialización única del Operational Model ([ADR 0013](./0013-implementation-is-knowledge-materialization.md)).

Este principio es el puente entre FOPEBA (“un conocimiento”) y multi-target runtime.

## Relación

| ADR / paquete | Relación |
|---------------|----------|
| [0032](./0032-native-mobile-strategy.md) | Estrategia móvil; 0033 es el principio de aislamiento |
| [0005](./0005-services-layer.md) | Services siguen siendo el límite de negocio |
| [0008](./0008-ai-offline-ready.md) | Offline plug-in sin acoplar UI a SQLite |
| [MF-001](../11-mobile/MF-001_MOBILE_FOUNDATION.md) | M-04 / M-05 materializan este ADR |

## No hacer

- No filtrar reglas de Kitchen/Delivery con `Capacitor.isNativePlatform()` en Services.
- No crear un “mobile domain” paralelo.
- No implementar adapters Capacitor en este PR de documentación.

## Criterio de cumplimiento (futuro)

Un cambio viola ADR 0033 si el dominio o Services ganan dependencia dura de una plataforma.  
La corrección es extraer un puerto + adapter, no un `#if native`.
