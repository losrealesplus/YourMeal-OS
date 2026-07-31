# ADR 0033 — Platform Independence

## Estado

**Accepted** — 2026-07-30  
**Deriva de:** [ADR 0032 — Native Mobile Strategy](./0032-native-mobile-strategy.md)  
**Paquete:** [MF-001 · Mobile Foundation](../11-mobile/MF-001_MOBILE_FOUNDATION.md)

## Principio canónico

> **Platform Independence**

> La lógica de negocio nunca dependerá de una plataforma concreta (Web, iOS o Android). Toda capacidad nativa se expone mediante **interfaces y adaptadores**, preservando un único dominio compartido.

## Principio operativo · Capability Negotiation

> **Capability Negotiation**

> El sistema no asume un conjunto fijo de capacidades por plataforma. **Negocia** el estado de cada capability en runtime. El dominio reacciona al contrato, nunca a “¿estoy en Android?”.

```text
Domain
      ↓
Capability Contract
      ↓
Capability Registry
      ↓
Platform Adapter
```

El dominio pregunta:

```ts
if (capabilities.biometrics.isAvailable()) { ... }
if (capabilities.camera.canCaptureImages()) { ... }
```

**Nunca:**

```ts
if (Capacitor.getPlatform() === 'ios') { ... }
if (isAndroid) { ... }
```

### Estados negociables (ejemplos)

```text
DeviceCapabilities
Camera
  ├── supported
  ├── unavailable
  └── permissionDenied
Location
  ├── supported
  ├── disabled
  └── denied
Biometrics
  ├── faceID
  ├── touchID
  ├── fingerprint
  └── unsupported
Network
  ├── online
  ├── offline
  └── constrained
```

Los estados concretos por capability se fijan en [M-02 DeviceCapabilities](../11-mobile/M-02_DEVICECAPABILITIES.md); aquí queda la **regla**: negociar, no ramificar por OS.

## Decisión

YourMeal OS adopta **independencia de plataforma** como principio arquitectónico permanente:

| Capa | Puede conocer Web / iOS / Android |
|------|-----------------------------------|
| Domain · Services · Application | **No** |
| UI de producto (routes, workspaces) | Preferir agnóstico; solo vía Capability Contract / Registry |
| Capability Registry + Platform Adapters | **Sí** (Capacitor, DOM, Tauri, …) |
| Contenedor Capacitor | **Sí** — solo shell + plugins |

### Consecuencias prácticas

1. **Prohibido** importar `@capacitor/*` (u otro SDK nativo) desde Services, repositorios de dominio o reglas de negocio.
2. Capacidades nativas = catálogo **`DeviceCapabilities`** ([M-02](../11-mobile/M-02_DEVICECAPABILITIES.md)) detrás de Contract → Resolver → Adapter.
3. Persistencia local = **`StorageProvider`** (M-04) — no `localStorage` / IndexedDB / SQLite / Preferences directos en dominio.
4. Offline Queue (M-03) y **Sync Engine** (M-06) son ports del dominio compartido; transporte y SQLite viven en adapters.
5. Targets futuros (Tauri · Electron · otro shell) = nuevos adapters; el OM no se bifurca.

```text
Business
      ↓
Ports  (StorageProvider · DeviceCapabilities · SyncEngine · OfflineQueue)
      ↓
Capability Registry / Adapters
      ↓
Web · iOS · Android · Desktop
```

## Contexto

ADR 0032 fija: un código · Capacitor contenedor · Hybrid Shell · offline modular.

Sin Platform Independence + Capability Negotiation, Hybrid Shell degenera en `#ifdef Capacitor` / `isAndroid` dentro del dominio y vuelve imposible:

- tests sin device,
- Lovable/web-first development,
- degradación graceful cuando falta permiso o hardware,
- un futuro target desktop,
- y la materialización única del Operational Model ([ADR 0013](./0013-implementation-is-knowledge-materialization.md)).

Este principio es el puente entre FOPEBA (“un conocimiento”) y multi-target runtime.

## Relación

| ADR / paquete | Relación |
|---------------|----------|
| [0032](./0032-native-mobile-strategy.md) | Estrategia móvil; 0033 es el principio de aislamiento |
| [0005](./0005-services-layer.md) | Services siguen siendo el límite de negocio |
| [0008](./0008-ai-offline-ready.md) | Offline plug-in sin acoplar UI a SQLite |
| [MF-001](../11-mobile/MF-001_MOBILE_FOUNDATION.md) | Contenedor móvil |
| [M-02](../11-mobile/M-02_DEVICECAPABILITIES.md) | DeviceCapabilities · negotiation · adapters |
| [MF-002](../11-mobile/MF-002_BACKGROUND_EXECUTION.md) | Evolución futura (fuera de MF-001) |

## No hacer

- No filtrar reglas de Kitchen/Delivery con `Capacitor.isNativePlatform()` / `getPlatform()` en Services.
- No crear un “mobile domain” paralelo.
- No asumir que Web, iOS y Android exponen el mismo conjunto de capabilities.
- No implementar adapters Capacitor en este PR de documentación.

## Criterio de cumplimiento (futuro)

Un cambio viola ADR 0033 si:

- el dominio o Services ganan dependencia dura de una plataforma, **o**
- el dominio ramifica por OS en lugar de negociar el estado de una capability.

La corrección es Contract + Registry + Adapter — no un `#if native`.
