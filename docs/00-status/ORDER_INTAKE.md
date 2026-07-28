# Order Intake · estado

**ADR:** [0017](../adr/0017-order-intake.md) · **CAP-008**  
**Tipo:** Bounded context / proceso transversal (no “pedido manual”)

```text
Intent → Normalize → Validate → Resolve → Build → Emit
        (cualquier canal)                         ↓
                                              Order Created
                                         (Kitchen · Billing · …)
```

| Dimensión | Pregunta | No confundir con |
|-----------|----------|------------------|
| **Order Source** | ¿Por dónde entró? | — |
| **`demand_channel`** | ¿B2B o B2C? | Order Source |

**Scaffold:** App path ya entra por Intake (`channel=app`). Motor antes que Wizard.  
**Next (sin prisa):** wizard Tenant con lenguaje operacional · staff target · origin store · Emit.  
**Futuro (no ahora):** intents incompletos / Draft Intake — solo si evidencia de tenant.
