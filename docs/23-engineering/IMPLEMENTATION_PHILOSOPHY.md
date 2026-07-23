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

## Objetivo (desde CAP-002)

| Antes | Ahora |
|-------|-------|
| Construir YourMeal OS | **Demostrar que FOPEBA puede producir software operacional de alta calidad** |

YourMeal OS es el vehículo de la demostración; FOPEBA es la tesis.

---

## Etapa 2 no es solo «código»

Cuatro niveles: Infrastructure → Capability → Workflow → Verification.  
Ver [ETAPA_2_LEVELS](../22-implementation/ETAPA_2_LEVELS.md).

Hito: **Primer Happy Path sin mocks** — no «una CAP más terminada».

---

## Consecuencia práctica

| Hacer | No hacer |
|-------|----------|
| Conectar capacidades certificadas | Inventar reglas en código |
| Citar OM / Capability / objetos | «Nos parece mejor…» |
| Un PR · una CAP · un nivel | «Ya que estamos…» (filtros, UX, dashboard) |
| STOP → Carril A si falta conocimiento | Parchear dominio en un PR de UI |
| Actualizar Knowledge Coverage | Medir éxito por pantallas |

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
- [ETAPA_2_LEVELS](../22-implementation/ETAPA_2_LEVELS.md)  
- [KNOWLEDGE_COVERAGE](../22-implementation/KNOWLEDGE_COVERAGE.md)  
- [IMPLEMENTATION_RULES](../22-implementation/IMPLEMENTATION_RULES.md)  
- [MODULE_STATE_CRITERIA](../00-status/MODULE_STATE_CRITERIA.md)  
- [ADR 0013](../adr/0013-implementation-is-knowledge-materialization.md)
