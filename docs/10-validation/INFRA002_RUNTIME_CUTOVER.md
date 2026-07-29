# INFRA-002 · Runtime Cutover Completion

**Fecha:** 2026-07-29  
**Alcance:** Binding runtime only (`.env`) — no Auth / Identity / Flow / architecture  

## Pre-check

| Item | Resultado |
|------|-----------|
| Runtime previo | `cbeegcxkayybfncnuirg` (settings 200) |
| Oficial | `djangucecsphnejplvic` |
| PR #100 | MERGED · STALE (Bootstrap ≠ cutover) |
| PR #101 | CLOSED · PARTIAL/STALE |
| PR #102 | MERGED · VALID |
| PR #103 | OPEN · VALID (FCR-010 legacy 400) |

## Tabla de referencias `cbeegcxkayybfncnuirg`

| Archivo | Línea | Valor actual (pre) | ¿Migrar? | Motivo |
|---------|-------|--------------------|----------|--------|
| `.env` | 2 | `SUPABASE_PROJECT_ID=cbeeg…` | **Sí** | Runtime binding |
| `.env` | 3 | publishable legacy | **Sí** | Runtime key |
| `.env` | 4 | `SUPABASE_URL` legacy | **Sí** | Runtime URL |
| `.env` | 7 | `VITE_SUPABASE_PROJECT_ID` legacy | **Sí** | Vite runtime |
| `.env` | 8 | `VITE_SUPABASE_PUBLISHABLE_KEY` legacy | **Sí** | Vite runtime |
| `.env` | 9 | `VITE_SUPABASE_URL` legacy | **Sí** | Vite runtime |
| `.env.local` | — | ausente | No | N/A |
| `.env.production` | — | ausente | No | N/A |
| `.env.example` | — | ya `djangu…` | No | Ya oficial |
| `src/integrations/supabase/client.ts` | — | env-driven | No | Sin hardcode |
| `supabase/config.toml` | 1 | ya `djangu…` | No | Ya oficial |
| `package.json` | gen:types | ya `djangu…` | No | Ya oficial |
| scripts | — | env-driven | No | Heredan `.env` |
| workflows | — | sin remote project | No | N/A |
| `docs/**` FCR/AUTH_AUDIT/evidence | varios | legacy histórico | **No** | Documental / evidencia |
| Lovable Cloud | — | no accesible | Operador | Sync Cloud pendiente |

## Cambio aplicado

Solo `.env`: Project ID + URL + publishable key → `djangucecsphnejplvic` (key restaurada desde commit histórico `560e0cc`, verificada HTTP 200 en `/auth/v1/settings`).
