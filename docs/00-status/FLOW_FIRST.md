# Flow First

**Documento:** `FLOW_FIRST.md`  
**Fecha:** 2026-07-29  
**Estado:** Active  
**Fase:** Flow Certification ([PLATFORM_V1_CLOSED](./PLATFORM_V1_CLOSED.md))  
**No modifica FOPEBA.**

---

## Regla

```text
Toda nueva funcionalidad deberá responder primero:

  ¿A qué Flow pertenece?

Si no pertenece a ningún Flow existente:

  ¿Debe crear uno nuevo?

Si la respuesta sigue siendo NO:

  La funcionalidad probablemente aún no está justificada operacionalmente.
```

---

## Efecto

| Antes (intuición) | Ahora (Flow First) |
|-------------------|--------------------|
| “Hace falta una mejora de Delivery” | “¿Esto es handoff de FLOW-01 / FLOW-02 / …?” |
| Feature sin dueño operacional | Feature anclada a un Flow del [catálogo](./FLOW_CATALOG.md) |
| Done = merge de código | Done = [definición Flow](./FLOW_DEFINITION_OF_DONE.md) |

---

## Excepciones

Solo con justificación explícita en el PR:

- **Bug Fix** que restaura un Flow/Journey ya certificado  
- **Documentation** sin cambio de comportamiento  
- **Operational Service** exigido por evidencia de un Flow (p. ej. Event Bus tras gap demostrado)

“Mejoras varias” / “refactor general” sin Flow → ❌ ([PR_TAXONOMY](./PR_TAXONOMY.md)).

---

## Pregunta de producto (única)

```text
¿Cómo opera la empresa?
```

Solo se responde con evidencia de Flow — no con pantallas aisladas.
