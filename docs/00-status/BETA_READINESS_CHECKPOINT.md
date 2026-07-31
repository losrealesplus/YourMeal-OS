# Checkpoint · Beta Readiness (EatClean Mobile)

**Fecha:** 2026-07-31  
**Tipo:** Revisión corta de fase (no auditoría) · **Accepted** como criterio de priorización  
**Pregunta rectora (antes):** ¿Está preparada la arquitectura?  
**Pregunta rectora (ahora):** ¿Puede EatClean empezar a trabajar con ella el lunes por la mañana?  
**Contexto:** Cierre de infraestructura móvil MF-001 (M-01 → M-02 → M-04 → M-03).  

**PRs infra móvil:** #117 (M-01) · #119 (M-02) · #120 (M-04) · #122 (M-03) — merged.  
**Acta de cierre de fase:** [INFRASTRUCTURE_PHASE_CLOSED](./INFRASTRUCTURE_PHASE_CLOSED.md) ✅  

**Lema del sprint:**

> Cada PR debe acercar un poco más el momento en que EatClean pueda trabajar una jornada completa con la aplicación.  
> Si no contribuye a eso → documentar, planificar, **posponer**.

**Rol de revisión vigente:** Product CTO — instalar · usar · completar flujo · estabilidad para cliente.

---

## 1. Infraestructura — CERRADA para la beta

| Módulo | Estado | Qué habilita |
|--------|--------|--------------|
| Foundation / Identity / OM | ✅ | Plataforma base |
| M-01 Mobile Foundation | ✅ | Hybrid Shell Capacitor · `sync:mobile` · Android/iOS scaffold |
| M-02 DeviceCapabilities | ✅ | Dominio desacoplado de Capacitor |
| M-04 StorageProvider | ✅ | Persistencia unificada (sesión, idioma, onboarding) |
| M-03 Offline Queue | ✅ | Outbox de intenciones (sin ejecutar aún) |

**Decisión:** no invertir más tiempo ahora en nuevas abstracciones, providers, capas u optimizaciones arquitectónicas. Base suficiente para un piloto controlado.

### Evitar en el próximo sprint (scope creep)

Cualquier tarea que empiece por:

* “Sería interesante…”
* “Podríamos preparar…”
* “De cara al futuro…”
* “Ya que estamos…”

Esas frases se documentan y se posponen.

---

## 2. Qué NO está listo (y no bloquea una beta acotada)

| Tema | Estado | Nota |
|------|--------|------|
| M-06 Sync Engine | ❌ no empezado | Cola existe; nadie la drena aún |
| Offline cliente/admin | ❌ fuera de alcance | ADR-0032: online-only |
| Plugins (cámara, push, GPS) | ❌ diferidos | M-02 negocia `unavailable` |
| MF-002 Background | ⏸ Deferred | No abrir ahora |
| App Store / Play publish | ❌ posterior | Operador local para builds nativos |

---

## 3. P0 — Bloqueadores reales

### P0-1 · PS-002-C — Auth real

Sin autenticación real **no existe piloto**.  
Credenciales piloto (`PS002_EMAIL` / `PS002_PASSWORD`) + evidencia de sesión estable.  
Relacionado: FCR-009 (E2E auth) permanece abierto como investigación.

### P0-2 · Smoke Test nativo (estricto)

**No basta con que compile.** Debe ocurrir en **dispositivos reales**.

#### Android

- [ ] Instala correctamente  
- [ ] Abre  
- [ ] Login  
- [ ] Navegar entre pantallas  
- [ ] Cerrar la app  
- [ ] Abrir de nuevo  
- [ ] **Mantiene sesión**

#### iPhone

- [ ] Instala correctamente  
- [ ] Abre  
- [ ] Login  
- [ ] Navegar entre pantallas  
- [ ] Cerrar la app  
- [ ] Abrir de nuevo  
- [ ] **Mantiene sesión**

Hasta que Android **e** iPhone no pasen esta lista, **no** se asume beta lista.

Operador: `npm run sync:mobile` → Android Studio / Xcode (cloud no sustituye).

### P0-3 · Flujo operativo completo

No preguntar “¿funciona la pantalla?”.  
Preguntar: **¿Puede EatClean completar un pedido real sin intervención del equipo técnico?**

Ciclo acotado: pedido cliente → cocina → reparto → entrega (sin inventarios/compras placeholder).

---

## 4. Criterio de aceptación de la Beta (oficial)

La beta **no** se da por conseguida hasta marcar **todos** estos puntos en verde en evidencia de dispositivo / jornada real.

### Instalación

- [ ] Android instala  
- [ ] iPhone instala  

### Acceso

- [ ] Login  
- [ ] Logout  
- [ ] Persistencia de sesión  

### Cliente

- [ ] Ver menú  
- [ ] Crear pedido  
- [ ] Editarlo  
- [ ] Confirmarlo  
- [ ] Consultar historial  

### Administración

- [ ] Ver pedido  
- [ ] Preparación  
- [ ] Cocina  
- [ ] Reparto  
- [ ] Entrega  

### Estabilidad

- [ ] Sin bloqueos  
- [ ] Sin pérdida de datos  
- [ ] Sin cierres inesperados  

Cuando todo esté en verde → **beta funcional** (no promesa técnica).

---

## 5. Mapa rápido código ↔ criterios (orientación)

| Criterio | Superficie típica |
|----------|-------------------|
| Login / logout / sesión | `/auth` · StorageProvider auth bridge |
| Menú / pedido / historial | `/app/menu` · `/app/schedule` · `/app/orders` |
| Ops pedido → cocina → reparto | `/admin/orders` · kitchen · kitchen-execution · delivery · routes |
| Placeholders fuera de beta | inventory · purchasing · reports · promotions |

---

## 6. Prioridad del sprint

| Prioridad | Trabajo | Por qué |
|-----------|---------|---------|
| P0 | **PS-002-C** / auth usable en piloto | Sin entrar no hay jornada |
| P0 | Smoke nativo estricto (Android + iPhone) | Compilar ≠ beta |
| P0 | Pedido real de punta a punta sin ayuda técnica | Criterio definitivo |
| P1 | Huecos que fallen en el checklist §4 | Solo si bloquean casillas |
| Evitar | M-06 · MF-002 · plugins · “de cara al futuro” | Scope creep |

---

## 7. Decisión de fase

```text
ANTES                              AHORA
¿Arquitectura correcta?      →   ¿EatClean puede el lunes por la mañana?
Construcción de plataforma   →   Demostrar valor al primer cliente
Más cimientos                →   Casillas del §4 en verde
```

Si un cambio no acerca una casilla del §4 a verde → **fuera de este sprint**.

---

## Referencias

- [MF-001](../11-mobile/MF-001_MOBILE_FOUNDATION.md) · [M-01 CLOSED](../11-mobile/M-01_CLOSED.md) · [M-02](../11-mobile/M-02_CLOSED.md) · [M-04](../11-mobile/M-04_CLOSED.md) · [M-03](../11-mobile/M-03_CLOSED.md)  
- [CURRENT_PHASE](./CURRENT_PHASE.md) · [MILESTONE_EATCLEAN_PILOT_READY](./MILESTONE_EATCLEAN_PILOT_READY.md)  
- [PRIORITY_PS002C_BEFORE_FLOW](../10-validation/PRIORITY_PS002C_BEFORE_FLOW.md) · [CAPACITOR_WORKFLOW](../11-mobile/CAPACITOR_WORKFLOW.md)
