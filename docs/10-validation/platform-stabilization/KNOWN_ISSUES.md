# Known Issues — post Stabilization Complete

**Documento:** `KNOWN_ISSUES.md`  
**Fecha:** 2026-07-29  
**Fase:** Platform Stabilization · COMPLETE

---

## Abiertos (bloquean Flow)

| ID | Descripción | Severidad |
|----|-------------|-----------|
| **FCR-007** | Login real no navega a Ops/Customer — Session post-login | **P0** · [investigación](../FCR007_LOGIN_BLOCKER_INVESTIGATION.md) |

## Cerrados (gates Bootstrap)

| ID | Descripción | Resolución |
|----|-------------|------------|
| PS-001 | Titileo /admin idle | PASS — [PS-001](./PS-001.md) |
| PS-002 | Auth / identidad smoke **Bootstrap** | PASS — no cubre Supabase login |
| PS-003 | Navigation smoke | PASS — [PS-003](./PS-003.md) |
| FCR-002 | Render loop `can` | CLOSED |

## Residuales (no bloquean Flow Certification)

| ID | Descripción | Notas |
|----|-------------|-------|
| PS-010 | `animate-fade-in` en shells | Cosmético; no causa loop |
| PS-011 | 401/404 Supabase bajo Bootstrap tokens | Esperado; no Auth prod |
| PS-012 | Smoke Auth producción (email/password real) | **Ahora FCR-007** |

## Fuera

Event Bus · Notifications · Jobs · Analytics · AI · FLOW-01 (bloqueado por FCR-007).
