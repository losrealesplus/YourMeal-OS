# M-02 · DeviceCapabilities — Implementation Guide

**Estado:** Implemented (infra) · 2026-07-31  
**Spec:** [M-02_DEVICECAPABILITIES](./M-02_DEVICECAPABILITIES.md)  
**ADR:** [0033](../adr/0033-platform-independence.md)  
**Código:** `src/platform/device-capabilities/`

---

## Por qué existe

Sin esta capa, UI/Services acabarían importando `@capacitor/camera` (etc.) y ramificando por OS. Eso:

- rompe tests SSR/web,
- acopla el dominio a un vendor,
- hace imposible Tauri/Electron/web-only sin reescribir negocio.

M-02 fija un **único punto de acceso** y deja las capacidades en modo **negotiation** (`unavailable` / `unsupported`) hasta módulos posteriores.

---

## Flujo

```text
UI / Application
        ↓
getDeviceCapabilities()
        ↓
WebAdapter  |  CapacitorAdapter
        ↓
Browser APIs | @capacitor/core (identity only)
```

---

## Uso

```ts
import { getDeviceCapabilities } from "@/platform/device-capabilities";

const caps = getDeviceCapabilities();

if (caps.camera.canCaptureImages()) {
  // future module — not M-02
}

if (!caps.network.isOnline()) {
  // degrade gracefully
}
```

**Prohibido en domain/services:**

```ts
import { Camera } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core"; // solo adapters
```

---

## Cómo añadir una capacidad nueva

1. Extender tipos en `types.ts` + `contract.ts`.  
2. Implementar negotiation en `web-adapter.ts` y `capacitor-adapter.ts`.  
3. En un módulo **posterior**, instalar el plugin Capacitor **solo** dentro del adapter (o un helper del adapter).  
4. Tests en `device-capabilities.spec.ts`.  
5. No cambiar Services de negocio salvo consumir el contrato.

---

## Qué NO hace M-02

- No instala plugins de cámara/push/GPS/biometría.  
- No pide permisos.  
- No añade UI.  
- No implementa offline (M-03/M-06) ni StorageProvider (M-04).

---

## Tests

```bash
npm test -- src/platform/device-capabilities
```

---

## DoD

| Criterio | |
|----------|--|
| Dominio no conoce Capacitor | ✅ contrato + convención |
| Único acceso `getDeviceCapabilities()` | ✅ |
| Web sin plugins | ✅ WebAdapter |
| Capacitor adapter sin cambiar negocio | ✅ |
| Tests | ✅ |
| Docs | ✅ este archivo + spec actualizada |
