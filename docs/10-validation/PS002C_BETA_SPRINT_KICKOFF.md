# PS-002-C · Beta Sprint Kickoff (Product CTO)

**Fecha:** 2026-07-31  
**Prioridad:** **P0-1** (bloqueador principal de la beta)  
**Gate técnico:** [PS-002.md](./platform-stabilization/PS-002.md) · [FCR-008](./FCR008_CANONICAL_POST_LOGIN_SESSION.md)  
**Fase:** [INFRASTRUCTURE_PHASE_CLOSED](../00-status/INFRASTRUCTURE_PHASE_CLOSED.md)

---

## Objetivo de producto (no solo técnico)

La autenticación debe:

1. **Funcionar** con Auth Supabase real (contrato canónico PASS).  
2. **Mantener sesión** tras cerrar y reabrir la app (Web + Android + iPhone).  
3. Ser **consistente** entre plataformas (mismo StorageProvider / Preferences en nativo).  
4. **No introducir fricción** innecesaria (login usable para EatClean el lunes).

Elegancia del pipeline importa solo si sirve a 1–4.

---

## Contrato técnico (sin cambio)

```text
LOGIN → … → DASHBOARD_RENDERED
status=PASS · duplicates=[] · missing=[] · out_of_order=[]
```

```bash
VITE_BOOTSTRAP_MODE=false npm run dev -- --host 127.0.0.1 --port 8080
PS002_EMAIL=… PS002_PASSWORD=… npm run test:ps002-canonical-auth
```

Evidencia: `docs/10-validation/platform-stabilization/evidence/ps002c-canonical-auth.json`

---

## Estado al arrancar este sprint (2026-07-31)

| Precondición | Estado | Nota |
|--------------|--------|------|
| Credenciales `PS002_EMAIL` / `PS002_PASSWORD` en el entorno del agente | ❌ **ausentes** | Gate = **BLOCKED** (≠ FAIL) hasta que el operador las aporte |
| Proyecto Supabase en `.env` del workspace | ⚠️ **legacy** `cbeegcxkayybfncnuirg` | Oficial SoT: `djangucecsphnejplvic` (`.env.example`) — cutover incompleto en runtime local |
| Sesión vía StorageProvider (M-04) | ✅ cableado | `createSupabaseAuthStorage()` · base para persistencia nativa |
| Pipeline FCR-008 / runner | ✅ en repo | No mockear Auth |

**Acción inmediata del operador (desbloqueo):**

1. Alinear runtime al proyecto **oficial** (`djangucecsphnejplvic`) con publishable key válida.  
2. Proveer usuario piloto real (`PS002_EMAIL` / `PS002_PASSWORD`) en ese proyecto.  
3. Ejecutar el smoke canónico y adjuntar evidencia JSON.  
4. En device: kill app → reopen → sesión intacta (criterio smoke nativo del checkpoint).

Sin (1)+(2) el agente **no puede** cerrar PS-002-C por sí solo.

---

## Orden tras PASS

1. Smoke Test dispositivos reales (Android + iPhone)  
2. Flujo completo pedido → cocina → reparto  
3. Entrega primera beta a EatClean  

FLOW-01 sigue ⏸ hasta PS-002-C PASS ([PRIORITY_PS002C_BEFORE_FLOW](./PRIORITY_PS002C_BEFORE_FLOW.md)).

---

## Qué no hacer en este sprint

- Nuevas capas / providers / “sería interesante…”  
- Abrir M-06 o MF-002  
- Documentar metodologías nuevas mientras Auth real no pase
