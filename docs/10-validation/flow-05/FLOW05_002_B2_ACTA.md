# FLOW05-002 · B2 Authentication · Acta

**Documento:** `FLOW05_002_B2_ACTA.md`  
**Fecha:** 2026-08-03  
**Entrega:** FLOW05-002  
**Spec:** [FLOW_05_SPEC](../../00-status/FLOW_05_SPEC.md) **FROZEN** (#237)  
**Precondición:** [FLOW05_001_B1_ACTA](./FLOW05_001_B1_ACTA.md) ✅ · Gate ✅ · Land Check from `main` @ `07a19b4`  
**Nivel:** Core Flow · YourMeal OS (tenant-agnostic · no EatClean-only)

> Certifica **Authentication → Ready for Order Creation**.  
> No dashboard · no menú como END · no B3+.

---

## Pregunta certificada

> ¿Queda certificada la transición Ready for Authentication → sesión operable lista para pedido (B2)?

---

## Contrato observado

```text
FLOW05_B1_STARTED     ✔
FLOW05_B1_COMPLETED   ✔
FLOW05_B2_STARTED     ✔ (exactly once)
FLOW05_B2_COMPLETED   ✔ (exactly once)
FLOW05_B3_STARTED     BLOCKED (no emitido — fuera de alcance)
```

Spine:

```text
START · Ready for Authentication (outcome B1)
  ↓
Credenciales (signInWithPassword)
  ↓
Identidad / sesión canónica
  ↓
Tenant resuelto (tenant_members)
  ↓
RBAC resuelto (requireAuthRoles)
  ↓
Sesión disponible (_authenticated gate)
  ↓
END · Ready for Order Creation (customer → /app)
```

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| B1 CERTIFIED (acta presente) | ✅ |
| Gate autoriza FLOW05-002 | ✅ |
| Login entry presente | ✅ |
| Credentials validation presente | ✅ |
| Identity/session bootstrap presente | ✅ |
| Tenant resolution presente | ✅ |
| RBAC resolution presente | ✅ |
| Session availability presente | ✅ |
| Ready for Order Creation presente | ✅ |
| Sin B3 Order Creation | ✅ |
| Sin dashboard / menú como END | ✅ |
| `duplicates=[]` · `out_of_order=[]` | ✅ |
| Runner: PASS through B2 · BLOCKED at B3 | ✅ |

---

## Comandos

```bash
npm run test:flow05-002
# → PASS through B2 · blocked_at=FLOW05_B3_STARTED · exit 0

npm run test:flow-05
# → PASS through B2 · blocked_at=FLOW05_B3_STARTED · exit 0

npm run test:flow-05:runner-only
# → BLOCKED at FLOW05_B1_STARTED · exit 2
```

Resultado esperado (`test:flow05-002` / `test:flow-05`):

```text
status=PASS
delivery_status=PASS
flow_status=BLOCKED
certified_through=B2
blocked_at=FLOW05_B3_STARTED
duplicates=[]
missing=[]
out_of_order=[]
```

Exit code **0** (delivery PASS scoped).  
Full FLOW-05 remains BLOCKED at B3 — intencional.

---

## Implementación (presencia / integración)

| Pieza | Path |
|-------|------|
| Login entry | `src/routes/auth.tsx` |
| Credentials | `src/auth/credentials.ts` (`signInWithPassword`) |
| Identity/session | `src/auth/post-login-pipeline.ts` |
| Tenant resolution | `src/identity/supabase-identity-provider.tsx` |
| RBAC | `src/permissions/route-guards.ts` |
| Session gate | `src/routes/_authenticated/route.tsx` |
| Ready for Order | `src/lib/home-path.ts` → `/app` |
| B2 driver | `scripts/lib/flow-05-b2-authentication.mjs` |
| Capability driver | `scripts/lib/flow-05-capability-driver.mjs` |
| Canonical runner | `scripts/flow-05-canonical.mjs` · `CERTIFIED_THROUGH=2` |
| Evidence JSON | `docs/10-validation/flow-05/evidence/flow-05-002-canonical-live.json` |

Certifica **Authentication · Tenant Resolution · RBAC · Session**.  
No navegación de negocio · no pedidos · no Capacitor.

---

## Principio (plataforma)

```text
Identity belongs to YourMeal OS.
Brand belongs to the Tenant.
Business rules belong to the Tenant.
The customer journey belongs to the Flow.
```

B2 certifica identidad autenticada en YourMeal OS — no “el login de EatClean”.

---

## Siguiente

Land Check desde `main` → **FLOW05-003 · B3 Order Creation** only.  
No B4+ · no Capacitor · no Stores.

---

## End of FLOW05-002 Acta
