# Implementation Philosophy

**Carpeta:** `docs/23-engineering` (la `21` está reservada a Product Materialization).

---

```text
Todo cambio de código debe responder a una necesidad
previamente demostrada por el Operational Model.

El software es una implementación del conocimiento.
Nunca su origen.
```

Esa frase resume el recorrido FOPEBA → YourMeal OS hasta Etapa 2.

---

## Consecuencia práctica

| Hacer | No hacer |
|-------|----------|
| Conectar capacidades certificadas | Inventar reglas en código |
| Citar OM / Capability / objetos | «Nos parece mejor…» |
| STOP → Carril A si falta conocimiento | Parchear dominio en un PR de UI |

---

## Roles de herramientas

| Herramienta | Rol |
|-------------|-----|
| **FOPEBA** | Certifica conocimiento |
| **Lovable** | Materializa UX y estructura (Product Skeleton) — relevo visual **cerrado** para infra |
| **Cursor** | Implementa ingeniería (conexión) |
| **GitHub** | Conserva historia y evidencia |

A partir de ahora: **no pedir a Lovable infraestructura**. Cursor toma el relevo técnico.

---

## Relacionado

- [CURSOR_MASTER_PROMPT](../22-implementation/CURSOR_MASTER_PROMPT.md)  
- [IMPLEMENTATION_RULES](../22-implementation/IMPLEMENTATION_RULES.md)  
- [MODULE_STATE_CRITERIA](../00-status/MODULE_STATE_CRITERIA.md)
