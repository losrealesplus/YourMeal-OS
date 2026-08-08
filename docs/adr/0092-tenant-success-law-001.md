# ADR 0092 — TENANT SUCCESS LAW 001

## Estado

**Accepted** — 2026-08-07  
**Track:** Tenant Success · Era 2  
**Detalle:** [TENANT_SUCCESS_PLAYBOOK](../00-status/TENANT_SUCCESS_PLAYBOOK.md) · [ERA_DECLARATION](../00-status/ERA_DECLARATION.md)  
**Depends on:** PRODUCT LAW 001 (ADR 0084) · Era Declaration (ADR 0091) · Operational Evidence Loop

## Contexto

Era 2 opens with a permanent Product Core cycle (Observe → … → Measure Again → Time Saved). Without an explicit law, observations and “improvements” can still enter the roadmap on belief alone.

TENANT SUCCESS LAW 001 extends PRODUCT LAW 001 into the evidence discipline of Tenant Success.

This ADR **does not introduce software**. Documentation only.

## Decisión

1. Accept **TENANT SUCCESS LAW 001** as a permanent Product Core law:

```text
No observation is accepted
until it has been measured.

No solution is accepted
until the improvement has been measured again.
```

2. Publish the law in [TENANT_SUCCESS_PLAYBOOK](../00-status/TENANT_SUCCESS_PLAYBOOK.md).  
3. Bind it to the Operational Evidence Loop: Measure before · Measure Again after.  
4. Declare that Era 2’s hard skill is **deciding what not to build**.  
5. Declare the first Era 2 objective: observe Isabella / operators — discover where time is lost — before Delivery / Billing / AI / Telemetry as Product Core drivers.  
6. Sin código · sin refactor · sin cambio de runtime.

## Consecuencias

- Claims without measurement are not Product Core evidence.  
- “It feels better” is insufficient for ship-as-success.  
- The true MVP of Era 2 is the cycle Isabella → Observation → Friction → Product → Time recovered.  
- PRODUCT LAW 001 filters *what* may be Product Core; TENANT SUCCESS LAW 001 filters *how* we accept evidence.

## Referencias

- [TENANT_SUCCESS_PLAYBOOK](../00-status/TENANT_SUCCESS_PLAYBOOK.md)  
- [ERA_DECLARATION](../00-status/ERA_DECLARATION.md) · ADR [0091](./0091-era-declaration.md)  
- [PRODUCT_DIRECTION](../00-status/PRODUCT_DIRECTION.md) · ADR [0084](./0084-product-law-001.md)
