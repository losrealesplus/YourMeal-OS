# MF-002 · Background Execution

**Documento:** `MF-002_BACKGROUND_EXECUTION.md`  
**Fecha:** 2026-07-30  
**Estado:** **Deferred** — registrado · **fuera de MF-001**  
**Depende de:** [MF-001](./MF-001_MOBILE_FOUNDATION.md) Approved + M-03/M-06 operativos  
**ADR:** [0032](../adr/0032-native-mobile-strategy.md) · [0033](../adr/0033-platform-independence.md)

---

## Propósito (futuro)

Capacidades de ejecución cuando la app **no** está en primer plano — sin mezclarlas en la primera base móvil.

Candidatos:

| Tema | Notas |
|------|-------|
| Sync en background | Drain de Offline Queue / Sync Engine con app suspended |
| Reintentos al recuperar red | Hooks de conectividad (vía DeviceCapabilities.Network) |
| Push → refresh de datos | Notificación dispara pull acotado |
| Event processing en background | Límites iOS/Android · sin romper Platform Independence |

---

## Por qué no está en MF-001

MF-001 debe permanecer **enfocado y manejable**:

- Hybrid Shell + build  
- StorageProvider  
- DeviceCapabilities + negotiation  
- Offline Queue  
- Sync Engine (foreground / resume)

Background Execution añade complejidad de OS (BGTaskScheduler, WorkManager, restricciones de energía) y merece su propio paquete cuando M-06 esté validado en campo.

---

## Regla

No abrir MF-002 hasta:

1. MF-001 Approved e implementado en lo esencial (al menos M-01…M-06 diseño + spike Sync).  
2. Necesidad de Flow / evidencia de campo (p. ej. repartidores con app en background).  
3. Capability Negotiation estable (Network · Notifications).

Hasta entonces: **solo registro**. Sin código. Sin tickets de implementación mezclados con MF-001.
