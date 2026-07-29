# Known Issues — post Stabilization Complete

**Documento:** `KNOWN_ISSUES.md`  
**Fecha:** 2026-07-29  
**Fase:** Platform Stabilization · COMPLETE

---

## Abiertos (bloquean Flow)

| ID | Descripción | Severidad |
|----|-------------|-----------|
| **PS-002 real** | Revalidar login E2E con Supabase (no solo Bootstrap) tras FCR-008 | **P1** |

## Cerrados

| ID | Descripción | Resolución |
|----|-------------|------------|
| PS-001 | Titileo /admin idle | PASS — [PS-001](./PS-001.md) |
| PS-002 | Auth / identidad smoke **Bootstrap** | PASS — no cubría Supabase login |
| PS-003 | Navigation smoke | PASS — [PS-003](./PS-003.md) |
| FCR-002 | Render loop `can` | CLOSED |
| FCR-007 | Login blocker Session | Causa cerrada — [FCR-008](../FCR008_CANONICAL_POST_LOGIN_SESSION.md) |

## Residuales

| ID | Descripción | Notas |
|----|-------------|-------|
| PS-010 | `animate-fade-in` en shells | Cosmético |
| PS-011 | 401/404 bajo Bootstrap tokens | Esperado |

## Fuera

Event Bus · Notifications · Jobs · Analytics · AI · FLOW-01 (hasta PS-002 real PASS).
