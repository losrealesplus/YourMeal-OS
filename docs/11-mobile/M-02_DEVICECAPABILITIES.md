# M-02 · DeviceCapabilities (spec)

**Estado:** 🔓 **OPEN** · especificación · implementación **no iniciada**  
**Fecha apertura:** 2026-07-30  
**Depende de:** [M-01 CLOSED](./M-01_CLOSED.md)  
**ADR:** [0033 Platform Independence](../adr/0033-platform-independence.md) · Capability Negotiation  
**Padre:** [MF-001](./MF-001_MOBILE_FOUNDATION.md)

> **Nota de numeración:** En el borrador inicial de MF-001, “M-02” era el pipeline de build. Ese trabajo se cerró dentro de **M-01.1 / M-01.2**.  
> A partir del cierre de M-01, **M-02** designa el siguiente bloque de entrega: **DeviceCapabilities** (antes etiquetado M-05 en el plan largo).

---

## Objetivo

Definir e implementar el **contrato de capacidades nativas** para que el dominio **nunca** importe `@capacitor/*` ni pregunte el OS.

```text
Domain
      ↓
Capability Contract
      ↓
Capability Registry
      ↓
Platform Adapter  (WebAdapter | CapacitorAdapter)
```

---

## Alcance (esta fase)

| Incluye | No incluye |
|---------|------------|
| Interfaces / contratos TypeScript | Plugins de producto cableados a Kitchen/Delivery |
| `WebAdapter` (stubs / degradación) | Offline Queue (M-03) |
| `CapacitorAdapter` esqueleto (sin lógica de negocio) | Sync Engine (M-06) |
| Capability Negotiation (estados) | StorageProvider completo (M-04 — puede ir en paralelo o justo antes) |
| Tests del contrato + docs | Push/Camera/Biometrics **features** de UI |
| Registro mínimo de capabilities | Background (MF-002) |

### Capabilities mínimas (contrato)

```text
DeviceCapabilities
├── Network     online | offline | constrained
├── Camera      supported | unavailable | permissionDenied
├── Location    supported | disabled | denied
├── Notifications
├── Biometrics  faceID | touchID | fingerprint | unsupported
├── FileSystem
└── DeepLinks
```

El dominio solo pregunta, p. ej.:

```ts
if (capabilities.camera.canCaptureImages()) { ... }
```

---

## Orden de trabajo propuesto

1. Spec freeze de este documento (aprobación).  
2. Carpeta `src/platform/capabilities/` (o convención del repo) — **sin** tocar Services de negocio.  
3. Contract + Registry + WebAdapter.  
4. CapacitorAdapter stub (detect native vía adapter, no en dominio).  
5. Tests Vitest del contrato / negotiation.  
6. Doc de uso en `docs/11-mobile/`.  

---

## DoD M-02

- [ ] Contrato publicado y referenciado desde ADR 0033  
- [ ] WebAdapter usable en SSR/web sin Capacitor  
- [ ] CapacitorAdapter no rompe `npm run build` / `sync:mobile`  
- [ ] Dominio / Services **sin** imports `@capacitor/*` (grep gate opcional en CI)  
- [ ] Tests PASS  
- [ ] Ningún plugin de producto instalado “por si acaso”  

---

## Relación con el resto de MF-001

| ID | Tema | Tras M-01 |
|----|------|-----------|
| M-01 | Capacitor infra | ✅ CLOSED |
| **M-02** | **DeviceCapabilities** | 🔓 OPEN (este doc) |
| M-03 | Offline Queue | Pending |
| M-04 | StorageProvider | Pending (recomendado antes o junto a M-03) |
| M-06 | Sync Engine | Pending |
| MF-002 | Background Execution | Deferred |
