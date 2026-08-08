# ADR 0096 — TENANT SUCCESS LAW 001-A (Observe usable workflows only)

## Estado

**Accepted** — 2026-08-07  
**Track:** Tenant Success · Era 2  
**Detalle:** [TENANT_SUCCESS_PLAYBOOK](../00-status/TENANT_SUCCESS_PLAYBOOK.md) · [OBSERVATION_FRAMEWORK](../tenant-success/OBSERVATION_FRAMEWORK.md)  
**Depends on:** TENANT SUCCESS LAW 001 (ADR 0092) · TENANT-SUCCESS-001 (ADR 0095)

## Contexto

Observar a Isabella sobre workflows todavía incompletos (edit cliente · edit pedido · menús limitados · sin importación) mediría **implementación pendiente**, no fricción operativa real. Eso contaminaría la evidencia de Era 2.

## Decisión

1. Accept **TENANT SUCCESS LAW 001-A**:

```text
Never observe unfinished workflows.

Observe only workflows
that are realistically usable.

Otherwise,
you measure missing implementation,
not operational friction.
```

2. Separate Era 2 sprint types: **Experience Sprint** (build) vs **Observation Sprint** (learn) — never mixed.  
3. Reorder Era 2 roadmap: Framework → Experience chain (Customer→Delivery) → Android → OPPO → Dogfooding → **then** Isabella / Sara Observation → Tenant Backlog.  
4. Open **CUSTOMER EXPERIENCE 001** now with metric: alta / gestión frecuente **&lt; 30 seconds**.  
5. Do **not** schedule Isabella Observation until core experiences are realistically usable.  
6. Sin Architecture reopen · sin new Capabilities.

## Consecuencias

- Hybrid “observe while building unfinished UX” is rejected.  
- Observation Framework remains ready; sessions wait for usable workflows.  
- Experience sprints carry visible time objectives per epic.  
- ADR 0092’s “observe Isabella first” as immediate next step is superseded by this order.

## Referencias

- [CUSTOMER_EXPERIENCE_001](../00-status/CUSTOMER_EXPERIENCE_001.md)  
- [SPRINT_001_TENANT_SUCCESS](../00-status/SPRINT_001_TENANT_SUCCESS.md)  
- ADR [0092](./0092-tenant-success-law-001.md) · [0095](./0095-tenant-success-001-observation-framework.md)
