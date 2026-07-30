# M-01.3 · Capacitor Integration Audit

**Fecha:** 2026-07-30  
**Rama:** `cursor/mf001-capacitor-infra-f54a`  
**Alcance:** infraestructura Capacitor 8 · **sin** cambios de negocio  
**ADR:** [0032](../adr/0032-native-mobile-strategy.md) · [0033](../adr/0033-platform-independence.md)

---

## 1. Hallazgos (sin asumir)

| Área | Estado | Evidencia |
|------|--------|-----------|
| `build` / `build:web` | OK | SSR Nitro · sin `index.html` |
| `build:mobile` | OK | `.output/public/index.html` + `assets/` |
| `@capacitor/*` | **AUSENTE** | `npm ls` vacío |
| `capacitor.config.ts` | **AUSENTE** | — |
| `android/` · `ios/` | **AUSENTES** | — |
| `npx cap sync` → `./www` | Esperado | Default Capacitor sin config |
| Java | Presente | `/usr/bin/java` |
| Android SDK / Xcode | No en este entorno Linux cloud | `cap open` / builds nativos locales en máquina del operador |
| Iconos / splash nativos | No preparados | Usar defaults Capacitor hasta assets tenant (ADR 0014) |
| Push / Camera / Biometrics / Offline | No instalar plugins aún | M-05 DeviceCapabilities · M-03/M-06 · no acoplar dominio |

---

## 2. Solución propuesta (antes de implementar)

### En alcance ahora (M-01.3 → M-01.5 scaffold)

1. Dependencias Capacitor **8**: `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/ios`.
2. `capacitor.config.ts`:
   - `appId: com.yourmealos.eatclean`
   - `appName: YourMealOS`
   - `webDir: .output/public`
   - **sin** `server.url` (ADR 0032).
3. Generar `android/` e `ios/` con `npx cap add`.
4. Scripts: `sync:mobile` = `build:mobile && cap sync`.
5. Verificar `npm run build:mobile` + `npx cap sync`.
6. Documentar límites del entorno (iOS firmado solo en macOS).

### Fuera de alcance ahora (registrado · no “rápido”)

| Capacidad | Cuándo |
|-----------|--------|
| Push · Camera · Files · Biometrics · Deep Links | M-05 DeviceCapabilities (ports + adapters) |
| Offline Queue · Sync Engine | M-03 / M-06 |
| Iconos / splash por tenant | Branding Tenant-Managed + assets store |
| CI Play / App Store | M-01.6 |
| Background execution | MF-002 |

Instalar todos los plugins nativos “por si acaso” **ahora** aumentaría superficie y acoplamiento sin contrato DeviceCapabilities.

---

## 3. Riesgos estructurales

| Riesgo | Mitigación |
|--------|------------|
| Lovable edita `android/` / `ios/` | Convención: nativo fuera de Lovable UI · documentado |
| `.output/public` gitignored | Sync siempre tras `build:mobile` |
| iOS en Linux CI | Scaffold en repo; build/firma en macOS |
| App Store “website wrapper” | Hybrid Shell + valor nativo futuro (push/offline) · no `server.url` |

---

## 4. Criterio de éxito de esta pasada

- [x] Auditoría escrita  
- [ ] `capacitor.config.ts`  
- [ ] deps Capacitor 8  
- [ ] `android/` + `ios/`  
- [ ] `build:mobile` + `cap sync` sin error  
- [ ] `npm run build` SSR intacto  
- [ ] Sin cambios de negocio  
