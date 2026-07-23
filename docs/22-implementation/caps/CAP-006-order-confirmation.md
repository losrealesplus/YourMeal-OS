# CAP-006 — Order Confirmation

**Estado implementación:** Scaffold → **Operational** (código en `main` · IR-001)  
**Estado demostración:** ⏳ Smoke HP-001 pendiente · ⏳ ORR pendiente  
**OM:** `docs/17-operational-model/04-lifecycles/spine-transitions.md` — Draft → Confirmed  

> No requiere más desarrollo. Requiere **demostración** (smoke) y **autorización** (ORR PASSED).

---

## Preconditions

- CAP-001…005 Connected  
- Order Draft existente  

## Postconditions

- `status: confirmed` persistido  
- `audit_log` action `status_change`  
- Invalidación de queries · UI sin CTA Confirm si ya confirmado  
- Sin notificaciones / emails / integraciones  

## Flujo

```text
Draft → Confirm → Persist → Audit → Invalidate → Estado confirmado
```

## Fuera de alcance

Notificaciones · correos · CAP-007 · UX nueva · reglas OM nuevas.
