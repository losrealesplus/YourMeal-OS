# M-02 · CLOSED — DeviceCapabilities Infrastructure

**Estado:** ✅ **CLOSED**  
**Fecha de cierre:** 2026-07-31  
**Código:** `src/platform/device-capabilities/`  
**Spec:** [M-02_DEVICECAPABILITIES](./M-02_DEVICECAPABILITIES.md) · [IMPLEMENTATION](./M-02_IMPLEMENTATION.md)  
**ADR:** [0033](../adr/0033-platform-independence.md)

---

## Objetivo (cumplido)

Capa de abstracción para capacidades del dispositivo: el dominio no depende de Capacitor / OS.

---

## Evidencias DoD

| Criterio | Evidencia |
|----------|-----------|
| Dominio no conoce Capacitor | Contrato + adapters aislados; Services sin imports `@capacitor` |
| Único acceso | `getDeviceCapabilities()` |
| Web sin plugins nativos | `createWebDeviceCapabilities()` |
| Capacitor adapter sin cambiar negocio | `createCapacitorDeviceCapabilities()` · solo `@capacitor/core` identity |
| Tests | `device-capabilities.spec.ts` · 8 PASS |
| Docs | Spec + Implementation guide |

---

## Fuera de alcance (siguiente)

Plugins / features: cámara, push, GPS, biometría, deep links, share, files.  
Offline · StorageProvider · Sync → M-03 / M-04 / M-06.
