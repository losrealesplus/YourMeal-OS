# Capacitor · Developer Workflow (MF-001 · M-01)

**Estado:** Scaffold Capacitor 8 listo · plugins nativos diferidos (M-05)  
**Config:** `capacitor.config.ts`  
**Auditoría:** [M-01_CAPACITOR_AUDIT](./M-01_CAPACITOR_AUDIT.md)

---

## Scripts

| Comando | Qué hace |
|---------|----------|
| `npm run build` | SSR web (Cloudflare/Nitro) |
| `npm run build:mobile` | SPA shell → `.output/public/index.html` |
| `npm run sync:mobile` | `build:mobile` + `npx cap sync` |
| `npm run cap:open:android` | Android Studio |
| `npm run cap:open:ios` | Xcode (macOS) |

---

## Configuración

```ts
appId: "com.yourmealos.eatclean"
appName: "YourMealOS"
webDir: ".output/public"
// no server.url (ADR-0032)
```

---

## Flujo diario

```bash
npm run sync:mobile
npm run cap:open:android   # o cap:open:ios en macOS
```

Los assets en `android/.../public` e `ios/.../public` están **gitignored**; siempre sincroniza antes de un build nativo.

---

## Convenciones

- **No** editar `android/` / `ios/` en Lovable.
- **No** instalar plugins Capacitor ad hoc en Services — usar DeviceCapabilities (M-05).
- Offline / Sync → M-03 / M-06.
- Background → MF-002.

---

## Límites del entorno cloud

| Acción | Cloud Linux | Máquina operador |
|--------|-------------|------------------|
| `cap sync` | ✅ | ✅ |
| `cap add android/ios` | ✅ | ✅ |
| Gradle assemble / Play | ⚠ SDK local | ✅ |
| Xcode / App Store | ❌ | ✅ macOS |

---

## Verificado 2026-07-30

- `npm run build:mobile` → `.output/public/{index.html,assets/}`
- `npx cap sync` → copia a android + ios (sin buscar `./www`)
- `npm run build` SSR intacto
