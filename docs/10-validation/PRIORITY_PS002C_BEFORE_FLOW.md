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
| **PS-002-C** | ⏳ Pendiente (credenciales reales) |
| PS-003 | ✅ PASS |
| FLOW-01 | ⏸ Bloqueado correctamente |

No abrir PRs metodológicas nuevas · no tocar FOPEBA / Core / Identity hasta PS-002-C.

## Cómo desbloquear

```bash
VITE_BOOTSTRAP_MODE=false npm run dev -- --host 127.0.0.1 --port 8080
PS002_EMAIL=… PS002_PASSWORD=… npm run test:ps002-canonical-auth
```

- **PASS** → integrar estabilización · revisar/rebase #98 (o superseded) · abrir FLOW-01 Spec  
- **FAIL** → primer paso ⛔ del reporte = siguiente FCR (sin re-diagnosticar “bug genérico de login”)

Evidencia comparable: `status` · `pipeline` · `duplicates` · `missing` · `out_of_order` · `duration_ms`.

Acta de gate: [PS-002.md](./platform-stabilization/PS-002.md) · contrato [FCR008](./FCR008_CANONICAL_POST_LOGIN_SESSION.md)
