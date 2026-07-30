# Cierre de sesión · 2026-07-30

**Track:** Mobile Foundation (MF-001)  
**Acta M-01:** [M-01_CLOSED](./M-01_CLOSED.md)  
**Siguiente:** [M-02 DeviceCapabilities](./M-02_DEVICECAPABILITIES.md)

---

## 1. Revisión del trabajo

Foco: cerrar **M-01 · Capacitor Infrastructure** y resolver la discrepancia repo local vs GitHub.

Conseguido:

- Diagnóstico: fallo no era TanStack/Vite sino ausencia de Capacitor config/plataformas (`./www`).
- Dual build (`build` SSR · `build:mobile` SPA shell) ya en `main` (#116).
- Infra Capacitor 8 + `android/` + `ios/` + `sync:mobile` + CI (#117 · `c213969`).
- Explicación del `Missing script: "sync:mobile"` en terminal local: `git pull` abortado por dirty tree → copia antigua.

---

## 2. Errores

### Resueltos

- Infra Capacitor inexistente  
- `capacitor.config.ts` / webDir  
- Scaffold android/ios  
- Flujo `sync:mobile`  
- CI Mobile Foundation  

### Pendientes no bloqueantes

- Migrar `createServerFn().inputValidator()` → `.validator()` (mantenimiento TanStack)  
- Operadores: limpiar working tree antes de pull de `main`  

---

## 3. Estado GitHub

| Ítem | Estado |
|------|--------|
| PR #117 | ✅ MERGED |
| `main` tip | `c213969` |
| SSR build | ✅ |
| Mobile CI | ✅ |
| M-01 | ✅ **CLOSED** |

Trabajar desde `main` actualizado.

---

## 4. Avances consolidados

- Base móvil Capacitor 8  
- Separación infra vs capacidades nativas  
- CI anti-regresión shell/sync  
- SSR intacta  

---

## 5. Roadmap

### Completado

- Foundation Lock / tracks previos del programa  
- **M-01 · Mobile Foundation (Capacitor Infrastructure)** ✅  

### Próximo bloque

**M-02 · DeviceCapabilities** — contrato + WebAdapter + CapacitorAdapter · sin plugins de producto.

### Más adelante

M-04 StorageProvider · M-03 Offline Queue · M-06 Sync Engine · MF-002 Background.

---

## 6. Arranque de la próxima sesión

1. `git checkout main && git pull origin main` (working tree limpio).  
2. `npm install && npm run sync:mobile && npm run build`.  
3. Aprobar / refinar [M-02_DEVICECAPABILITIES](./M-02_DEVICECAPABILITIES.md) **antes** de código.  
4. Implementar contrato → adapters → tests.  

---

## Balance

M-01 cerrado con evidencia y CI. La plataforma móvil deja de ser un bloqueo de scaffolding; el valor nativo se construye sobre **DeviceCapabilities** sin acoplar el dominio a plugins.
