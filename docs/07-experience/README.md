# 07 · Experience

Capa de **experiencia del usuario final** (Customer Application).

Complementa al Operational Model:

| Documento | Responde a |
|-----------|------------|
| [Operational Model](../17-operational-model/README.md) | ¿Cómo funciona la operación? |
| **Experience** (esta carpeta) | ¿Cómo la vive el usuario? |

## Principio: Experience First

```text
Antes (orientado a capacidades)     Ahora (orientado a recorrido)
─────────────────────────────       ─────────────────────────────
Capability                          Customer Journey
    ↓                                   ↓
Screen                              Screen
                                        ↓
                                    Capability
```

La capability no cambia. La pantalla se diseña desde el **recorrido del usuario**, no desde la estructura interna del sistema.

**Pregunta de diseño (Customer App):**

> ¿Mi madre podría hacer un pedido sin que nadie le explique la app?

No: «¿Está bien implementado?»

## Documentos

| Doc | Rol |
|-----|-----|
| [CUSTOMER_JOURNEYS](./CUSTOMER_JOURNEYS.md) | Recorridos CJ-xxx · pantallas MVP |
| [TENANT_EXPERIENCE_SPEC](../05-architecture/TENANT_EXPERIENCE_SPEC.md) | Identidad EatClean |
| [TENANT_IMPLEMENTATION_EATCLEAN](../05-architecture/TENANT_IMPLEMENTATION_EATCLEAN.md) | Brief Cursor/Lovable |

## Relacionado

- [07-user-flows](../07-user-flows/README.md) — flujos técnicos / rutas (auth, roles)  
- ADR [0014](../adr/0014-customer-application-is-tenant-branded.md) · [DICT-050](../99-reference/PROJECT_DICTIONARY.md)
