# FLOW05-001 · B1 Registration · Acta

**Documento:** `FLOW05_001_B1_ACTA.md`  
**Fecha:** 2026-08-03  
**Entrega:** FLOW05-001  
**Spec:** [FLOW_05_SPEC](../../00-status/FLOW_05_SPEC.md) **FROZEN** (#237)  
**Runner:** [FLOW_05_RUNNER](./FLOW_05_RUNNER.md) · Gate ✅ READY (#239 → `eb07a1a`)  
**Nivel:** Core Flow · YourMeal OS (tenant-agnostic · no EatClean-only)

> Certifica el **nacimiento del usuario** hasta *Ready for Authentication*.  
> No login · no sesión · no dashboard · no B2+.

---

## Pregunta certificada

> ¿Queda certificada la transición anónimo → identidad lista para autenticación (B1)?

---

## Contrato observado

```text
FLOW05_B1_STARTED     ✔ (exactly once)
FLOW05_B1_COMPLETED   ✔ (exactly once)
FLOW05_B2_STARTED     BLOCKED (no emitido — fuera de alcance)
```

Spine:

```text
START · Usuario NO autenticado
  ↓
Formulario de registro disponible (/auth signup)
  ↓
Datos válidos · cuenta creada (signUp)
  ↓
Perfil inicial (handle_new_user)
  ↓
Tenant asociado (ensure_individual_customer)
  ↓
END · Ready for Authentication (confirm → /auth)
```

---

## Definition of Done

| Criterio | Estado |
|----------|--------|
| Gate READY · autoriza FLOW05-001 | ✅ |
| Registration entry presente | ✅ |
| Account creation (`signUp`) presente | ✅ |
| Profile bootstrap presente | ✅ |
| Tenant association presente | ✅ |
| Ready for Authentication presente | ✅ |
| Sin B2 Login / JWT / sesión | ✅ |
| Sin dashboard · pedidos · Capacitor | ✅ |
| `duplicates=[]` | ✅ |
| `out_of_order=[]` | ✅ |
| Runner: PASS through B1 · BLOCKED at B2 | ✅ |

---

## Comandos

```bash
npm run test:flow05-001
# → PASS through B1 · blocked_at=FLOW05_B2_STARTED · exit 0

npm run test:flow-05
# → PASS through B1 · blocked_at=FLOW05_B2_STARTED · exit 0

npm run test:flow-05:runner-only
# → BLOCKED at FLOW05_B1_STARTED · exit 2
```

Resultado esperado (`test:flow05-001` / `test:flow-05`):

```text
status=PASS
delivery_status=PASS
flow_status=BLOCKED
certified_through=B1
blocked_at=FLOW05_B2_STARTED
duplicates=[]
missing=[]
out_of_order=[]
```

Exit code **0** (delivery PASS scoped).  
Full FLOW-05 remains BLOCKED at B2 — intencional.

---

## Implementación (presencia / integración)

| Pieza | Path |
|-------|------|
| Registration entry | `src/routes/auth.tsx` |
| Account creation | `src/auth/credentials.ts` (`signUp`) |
| Profile bootstrap | `supabase/migrations/20260720164312_*.sql` (`handle_new_user`) |
| Tenant association | `supabase/migrations/20260723183000_b2b_b2c_customer_model.sql` |
| Ready for Authentication | `src/auth/urls.ts` (`AUTH_LOGIN_PATH` / confirm) |
| B1 driver | `scripts/lib/flow-05-b1-registration.mjs` |
| Capability driver | `scripts/lib/flow-05-capability-driver.mjs` |
| Canonical runner | `scripts/flow-05-canonical.mjs` · `CERTIFIED_THROUGH=1` |
| Evidence JSON | `docs/10-validation/flow-05/evidence/flow-05-001-canonical-live.json` |
| Aggregate live | `docs/10-validation/flow-05/evidence/flow-05-canonical-live.json` |

Certifica **existencia · integración · contrato**. No UX avanzada · no negocio · no sesión.

---

## Siguiente

Land Check desde `main` → **FLOW05-002 · B2 Authentication** only  
(`Ready for Authentication` → sesión autenticada).  
No B3+ · no Capacitor · no Stores.

---

## End of FLOW05-001 Acta
