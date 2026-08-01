# Priority Lock · PS-002-C before docs merge / FLOW-01

**Fecha:** 2026-07-29  
**Estado:** ACTIVE  
**Decisión:** No mergear stack documental ni abrir Flow hasta Auth real PASS.

---

## Orden obligatorio

```text
1. FCR-008 (código) ✅ en PR #102
2. Smoke Auth Supabase real
3. validateCanonicalPipeline() → PASS + evidencia
4. Entonces: resolver/rebase PRs docs (#98 vs #100/#102) o superseded
5. Entonces: PR FLOW-01 Kitchen → Delivery · Specification
```

## HOLD explícito

| PR / acción | HOLD |
|-------------|------|
| **#98** Operating Model v1 | ⏸ No merge hasta PS-002-C PASS · revisar si superseded |
| **#100** Stabilization COMPLETE | Bootstrap ≠ Flow-ready |
| **#102** FCR-008 + PS-002-C contract | Activo — ejecutar smoke real |
| **FLOW-01** | ⏸ No abrir |

## Por qué

Los conflictos de #98 con `CURRENT_PHASE` / READMEs son síntoma de seguir documentando mientras el login real no está demostrado. El producto no certifica Flows sobre un pipeline post-login no reproducible.

## Estado oficial del programa

| Área | Estado |
|------|--------|
| Foundation | ✅ Cerrada |
| Identity | ✅ Cerrada |
| Operational Core | ✅ Cerrado |
| Governance | ✅ Cerrado |
| Operating Model | ✅ Definido (PR #98 en HOLD hasta integrar) |
| Platform Stabilization | 🟡 Pendiente de validación final |
| PS-001 | ✅ PASS |
| PS-002-B | ✅ PASS |
| **PS-002-C** | 🟡 Auth+pipeline OK hasta `ROLE_READY` · FAIL `not_staff` (roles vacíos) — [staff data gate](./PS002C_STAFF_DATA_GATE.md) |
| PS-003 | ✅ PASS |
| FLOW-01 | ⏸ Bloqueado correctamente |

No abrir PRs metodológicas nuevas · no tocar FOPEBA / Core / Identity hasta PS-002-C.

## Cómo desbloquear

```bash
cp .env.example .env   # rellena VITE_SUPABASE_* (no REPLACE_ME) + PS002_* + Supabase oficial
npm install
npm run bootstrap:e2e          # READY/BLOCKED + instala browsers si faltan
VITE_BOOTSTRAP_MODE=false npm run dev -- --host 127.0.0.1 --port 8080
npm run test:ps002-canonical-auth
```

`bootstrap:e2e` es diagnóstico FOPEBA: dice exactamente qué falta (`.env`, **`VITE_SUPABASE_PUBLISHABLE_KEY`**, credenciales, Chromium, …).  
Solo check: `npm run bootstrap:e2e:check`.  
`.env` está **gitignored**.  
Placeholder Vite → [AUTH_PIPELINE_002](./AUTH_PIPELINE_002_VITE_PUBLISHABLE_KEY.md).

Condición de salida objetiva (PASS):

```text
status = PASS
duplicates = []
missing = []
out_of_order = []
pipeline → … → DASHBOARD_RENDERED
```

`duration_ms` (`login_to_session` · `session_to_bootstrap` · `bootstrap_to_dashboard`) es **telemetría diagnóstica**, no bloquea merge salvo umbrales futuros explícitos.

Tras PASS:

1. Platform Stabilization = COMPLETE (real, no solo Bootstrap)
2. Decidir #98: integrar tal cual o superseded (solo docs vigentes)
3. Abrir **FLOW-01 · Kitchen → Delivery · Specification**

Tras FAIL: el primer paso ⛔ del reporte = siguiente FCR (sin “bug genérico de login”).

**2026-08-01:** AUTH-SESSION-001 y HOME-PATH-001 **CLOSED**. Cold session OK; `STOP not_staff` con `roles=[]` es gate de **datos** (asignar staff / PO seed), no bug de Auth/nav. Ver [PS002C_STAFF_DATA_GATE](./PS002C_STAFF_DATA_GATE.md).

Evidencia comparable: `status` · `pipeline` · `duplicates` · `missing` · `out_of_order` · `duration_ms` · `home_path_gap` · `auth_session_002`.

Acta de gate: [PS-002.md](./platform-stabilization/PS-002.md) · contrato [FCR008](./FCR008_CANONICAL_POST_LOGIN_SESSION.md)

> El proyecto no espera una decisión metodológica más: espera la **última evidencia operacional** (PS-002-C) para abrir la siguiente etapa.
