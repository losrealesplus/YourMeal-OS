# Platform Stabilization · Known Issues

**Documento:** `KNOWN_ISSUES.md`  
**Fecha:** 2026-07-29  
**Fase:** Platform Stabilization v1

---

## Abiertos (impiden declarar PLATFORM STABLE)

| ID | Bloque | Descripción | Severidad |
|----|--------|-------------|-----------|
| PS-001 | A · UI | Confirmación visual de que `/admin` idle ya no titila tras FCR-002 fix | P1 |
| PS-002 | C · Auth | Smoke E2E login / logout / refresh token / membership gate | P1 |
| PS-003 | B · Nav | Smoke cambio Workspace / Role sin flash blanco | P2 |

## Residuales (no bloquean código; vigilar en Flow)

| ID | Descripción | Notas |
|----|-------------|-------|
| PS-010 | `animate-fade-in` en shells | Amplifica remounts; no causa loop si no hay remount |
| PS-011 | TOKEN_REFRESHED re-render de consumidores Auth | Una vez por refresh; esperado |
| PS-012 | Channel realtime `user_roles` | Invalidate al cambio de rol; correcto |

## Explicitamente fuera (no abrir)

Event Bus · Notifications · Jobs · Analytics · AI · Operational Intelligence · nuevos módulos · Flow execution.

## PRs abiertos no mergeados en main (contexto)

| PR | Contenido | Nota |
|----|-----------|------|
| #91 | Identity Hardening | Código Identity — merge antes/independiente |
| #92 | Identity Foundation Lock | Acta |
| #98 | Operating Model v1 | Constitución / Flow governance docs |
