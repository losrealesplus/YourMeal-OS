# Mobile

## Current

Customer experience is **mobile-first web** inside the same TanStack Start app (`/app`, `MobileShell`, bottom navigation).

## Native strategy (Accepted · implementation frozen)

**ADR:** [0032 — Native Mobile Strategy](../adr/0032-native-mobile-strategy.md)

```text
Una aplicación SSR (TanStack Start)
        +
Capacitor como contenedor iOS/Android
        =
Un solo código · sin React Native
```

| Artefacto | Rol |
|-----------|-----|
| [NATIVE_MOBILE_INVESTIGATION](./NATIVE_MOBILE_INVESTIGATION.md) | Evidencia TanStack Start · Nitro · Cloudflare · Capacitor |
| [NATIVE_MOBILE_PLAN](./NATIVE_MOBILE_PLAN.md) | Plan técnico + lista de cambios · **pendiente aprobación** |

**Packaging baseline:** Hybrid Shell (client bundle en el binario + API/SSR remoto).  
**No** `server.url` como producción.  
**No** implementar Capacitor hasta aprobar el plan.

## Offline

Offline es **modular**, no global:

| Superficie | Offline |
|------------|---------|
| Cliente | No (siempre online) |
| Admin / SaaS | No (default) |
| Cocina · Reparto · Almacén | Sí (Storage + SQLite + sync diferido) |

Arquitectura preparada (Services, soft delete, audit, IDs estables — ADR 0008). **Do not implement sync now.**

## Historical note

La proyección anterior de un `apps/mobile` dedicado (posible monorepo) **ya no** es el camino preferente de producto. Si el monorepo aparece, será empaquetado del **mismo** código — no un segundo frontend React Native.
