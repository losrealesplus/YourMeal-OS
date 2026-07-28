# Order Intake · estado

**ADR:** [0017](../adr/0017-order-intake.md) · **CAP-008**  
**Tipo:** Bounded context (no “pedido manual”)

```text
Purchase intent (any channel)
        → Order Intake Engine
        → Order (fulfillment)
```

**Scaffold:** App path already enters via Intake (`channel=app`).  
**Next:** Tenant Surface `+ Nuevo pedido` wizard + staff target customer + origin persistence.

No confundir con `demand_channel` (B2B/B2C · ADR 0015).
