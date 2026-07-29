# Known Issues — post Stabilization Complete

**Documento:** `KNOWN_ISSUES.md`  
**Fecha:** 2026-07-29  
**Fase:** Platform Stabilization · COMPLETE

---

## Abiertos (bloquean Flow)

| ID | Descripción | Severidad |
|----|-------------|-----------|
| **PS-002-C** | Login E2E Auth Supabase real + `validateCanonicalPipeline` | **P0** — bloquea Flow y merge docs #98 |

## Cerrados

| ID | Descripción | Resolución |
|----|-------------|------------|
| PS-001 | Titileo /admin idle | PASS — [PS-001](./PS-001.md) |
| PS-002-B | Auth / identidad smoke **Bootstrap** | PASS — no cubría Supabase login |
| PS-003 | Navigation smoke | PASS — [PS-003](./PS-003.md) |
| FCR-002 | Render loop `can` | CLOSED |
| FCR-007 | Login blocker Session | Causa cerrada — [FCR-008](../FCR008_CANONICAL_POST_LOGIN_SESSION.md) |

## Residuales

| ID | Descripción | Notas |
|----|-------------|-------|
| PS-010 | `animate-fade-in` en shells | Cosmético |
| PS-011 | 401/404 bajo Bootstrap tokens | Esperado |
| PR #98 | Operating Model stack | ⏸ HOLD merge — [PRIORITY](../PRIORITY_PS002C_BEFORE_FLOW.md) |

## Fuera

Event Bus · Notifications · Jobs · Analytics · AI · **FLOW-01** (hasta PS-002-C PASS).
