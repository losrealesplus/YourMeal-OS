# M-02 · DeviceCapabilities (spec)

**Estado:** ✅ **IMPLEMENTED** (infraestructura · 2026-07-31) · sin plugins de producto  
**Fecha apertura:** 2026-07-30  
**Depende de:** [M-01 CLOSED](./M-01_CLOSED.md)  
**ADR:** [0033 Platform Independence](../adr/0033-platform-independence.md) · Capability Negotiation  
**Padre:** [MF-001](./MF-001_MOBILE_FOUNDATION.md)  
**Guía:** [M-02_IMPLEMENTATION](./M-02_IMPLEMENTATION.md)  
**Código:** `src/platform/device-capabilities/`

> **Nota de numeración:** En el borrador inicial de MF-001, “M-02” era el pipeline de build. Ese trabajo se cerró dentro de **M-01.1 / M-01.2**.  
> A partir del cierre de M-01, **M-02** designa **DeviceCapabilities**.

---

## Objetivo

Crear una capa de abstracción para capacidades del dispositivo de forma que el dominio **nunca** dependa de Capacitor, Android o iOS.

```text
UI → DeviceCapabilities → Adapter → (Web | Capacitor core)
```

M-02 **no** añade funcionalidad de usuario: solo infraestructura.

---

## Entregables

| # | Entregable | Ubicación |
|---|------------|-----------|
| 1 | Contrato `DeviceCapabilities` | `contract.ts` · `types.ts` |
| 2 | Web Adapter | `web-adapter.ts` |
| 3 | Capacitor Adapter | `capacitor-adapter.ts` (sin feature plugins) |
| 4 | Resolver `getDeviceCapabilities()` | `resolve.ts` |
| 5 | Tests | `device-capabilities.spec.ts` |
| 6 | Documentación | este spec + [IMPLEMENTATION](./M-02_IMPLEMENTATION.md) |

---

## Fuera de alcance (explícito)

❌ Cámara · Push · GPS · Biometría · Deep Links · Share · Archivos (features)  
❌ Instalación de plugins Capacitor de producto  
❌ Permisos nativos  
❌ Offline / StorageProvider  

Esas capacidades se **negociarán** como `unavailable` / `unsupported` hasta módulos posteriores.

---

## Definition of Done

- [x] El dominio no necesita conocer Capacitor (consume solo el contrato).  
- [x] Único punto de acceso: `getDeviceCapabilities()`.  
- [x] Web funciona sin dependencias nativas de producto.  
- [x] Android/iOS pueden usar CapacitorAdapter sin cambiar código de negocio.  
- [x] Tests PASS.  
- [x] Documentación completa.  

---

## Relación

| ID | Tema | Estado |
|----|------|--------|
| M-01 | Capacitor infra | ✅ CLOSED |
| **M-02** | **DeviceCapabilities** | ✅ IMPLEMENTED (infra) |
| **M-03** | Offline Queue | ✅ IMPLEMENTED (infra) |
| **M-04** | **StorageProvider** | ✅ IMPLEMENTED |
| M-06 | Sync Engine | Pending |
