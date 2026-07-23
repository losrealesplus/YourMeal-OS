# CAP-006 — Order Confirmation

**Estado:** Scaffold → **Operational** (cierra HP-001)  
**OM:** `docs/17-operational-model/04-lifecycles/spine-transitions.md` — Draft → Confirmed  

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
