# Developer Portal

**Documento:** `DEVELOPER_PORTAL.md`  
**Dominio:** Platform · Engineering access  
**Estado:** Accepted · DEVELOPER-PORTAL-001 · 2026-08-05  
**ADR:** [0037 — Developer Portal](../adr/0037-developer-portal.md)  
**Estándar:** Evidence before Implementation · FOPEBA

> Discovery ≠ Authentication ≠ Runtime Suite.  
> El Suite no sabe cómo fue abierto. Solo recibe `ymos-runtime-toggle`.

---

## Objetivo

Convertir el acceso de ingeniería en una **puerta oficial pero invisible** para usuarios normales:

- Inspiración: Android Developer Options · Konami · herramientas internas Apple
- Sin botones Developer/Debug en producto
- Sensación de descubrir una puerta secreta

---

## Flujo

```text
Triple tap · TenantLogo  (≈500ms)
        │
        ▼
 Developer Portal modal
        │
        │  Passphrase: YMOS Horus
        ▼
 ymos-runtime-toggle
        │
        ▼
 Runtime Suite (lifecycle independiente)
```

| Paso | Responsable |
|------|-------------|
| Discovery | Triple-tap en `TenantLogo` |
| Authentication | Developer Portal (passphrase) |
| Tooling | Runtime Suite (no conoce el origen) |

---

## Arquitectura

```text
src/runtime/developer-portal/
  triple-tap.ts              # detector 3 taps / 500ms
  passphrase.ts              # catálogo HORUS (+ futuro)
  developer-portal-events.ts # discover + audit
  useDeveloperPortal.ts      # estado RAM
  DeveloperPortal.tsx        # modal premium
  index.ts
```

Montaje: `DeveloperPortal` en `__root.tsx` (junto al Suite, desacoplado).  
Discovery: `TenantLogo` → `requestDeveloperPortal()` (evento).

---

## Seguridad

| Regla | |
|-------|--|
| No localStorage / sessionStorage / cookies de passphrase | ✅ |
| Solo RAM | ✅ |
| Audit `developer-portal-opened` con `passphraseId` (HORUS), nunca la frase | ✅ |
| Sin biometría · PIN · Supabase · usuarios · feature flags | ✅ |

---

## Extensibilidad

```ts
PASSPHRASE_CATALOG = [
  { id: "HORUS", phrase: "ymos horus", action: "runtime-toggle" },
  // Future: DOCTOR · ASSETS · NETWORK · PERFORMANCE
]
```

v1 solo cablea **HORUS** → `dispatchRuntimeToggle()`.

---

## Relación con Secret Gateway

El keyboard Secret Gateway (`YMOS Horus` tipado) permanece como camino avanzado.  
El **Developer Portal** es la puerta oficial de descubrimiento (triple-tap + modal).

---

## Criterios de aceptación

1. Triple tap → modal  
2. Cancel → nada  
3. Passphrase incorrecta → shake + “Invalid passphrase”  
4. `YMOS Horus` → Suite toggle  
5. Cerrar Suite no afecta al Portal  
6. Triple tap otra vez → modal otra vez  
7. Sin botones Developer visibles  

---

**Evidence before Implementation.**
