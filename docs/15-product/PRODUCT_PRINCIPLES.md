# PRODUCT_PRINCIPLES — Principios permanentes del producto

**Tipo:** Product Blueprint (Product Era)  
**Alcance:** toda experiencia, Asistente y Capability futura  
**No contiene:** implementación técnica

---

## 1. Acción antes que información

El sistema propone **qué hacer**.

No espera a que el usuario interprete tablas.

❌ Stock: lechuga 12 kg · tomate 8 kg · pollo 4 kg  
✅ Comprar 6 kg de lechuga hoy — la producción de mañana supera el stock.

---

## 2. Anticipación antes que reacción

Avisar **antes** del problema.

Nunca solo después.

El valor está en las 18:00 del día anterior, no en el caos de las 04:00.

---

## 3. Una pregunta menos

Cada Capability / Asistente debe eliminar **al menos una pregunta recurrente** del equipo.

Si no elimina una pregunta, no está listo.

Filtro canónico:

> ¿Qué pregunta elimina?

---

## 4. Las métricas son de la operación

Cada mejora debe mover al menos una:

| KPI | Qué mide |
|-----|----------|
| Tiempo recuperado | Minutos ahorrados |
| Errores evitados | Incidencias reducidas |
| **Preguntas eliminadas** | Dependencia de memoria y coordinación |
| Decisiones asistidas | Acciones sugeridas por el sistema |
| Interrupciones evitadas | Cambios de contexto del equipo |

**Preguntas eliminadas** es la métrica que resume la filosofía.

Si no mueve ninguna, cuestionar su prioridad.

---

## 5. El contexto manda

La misma cocina ve información distinta según:

- **hora** / momento operativo;
- **rol**;
- **estado** de la operación.

No hay una sola pantalla universal de «todo para todos».

---

## 6. Nunca información sin propósito

> Cada Asistente Operativo debe responder una pregunta concreta o recomendar una acción concreta.

Ver [IDENTIDAD_ASISTENTES_OPERATIVOS.md](./IDENTIDAD_ASISTENTES_OPERATIVOS.md).

---

## 7. Asistentes por encima de módulos

Lo que se compra = **Asistentes Operativos**.  
Lo que se implementa = **Capabilities** (pueden orquestarse varias para una decisión).

No diseñar el producto como un ERP de módulos aislados.

---

## 8. Evidencia antes que abstracción

Primero EatClean (u otra operación real).

Después generalizar.

No inventar Capabilities «por si acaso».

---

## 9. Solo tres pilares

No hay cuarto pilar documental.

Todo nace de FOUNDATION · PRODUCT BLUEPRINT · OPERATIONAL DISCOVERY.

---

## 10. Ciclo cerrado (oficial)

```text
Operación real
        ↓
Operational Discovery
        ↓
Patrón validado
        ↓
Product Blueprint
        ↓
Capability
        ↓
Use Cases
        ↓
Implementación
        ↓
Integración
        ↓
Operación real
```

La cocina alimenta al producto. El producto vuelve a la cocina.

---

## 11. Operational Checks (transversal)

No es un pilar nuevo. Vive en el Product Blueprint.

Es la **unidad mínima de valor operativo** y el mecanismo: datos → comprobación → atención → acción.

Unidad mínima de inteligencia del producto (sin IA).

Ver [OPERATIONAL_CHECKS.md](./OPERATIONAL_CHECKS.md).

Filtro adicional:

> ¿Qué comprueba, por qué lo comprueba y qué acción permite tomar?

### Gate (propuesta nueva)

1. ¿Evidencia en Discovery?  
2. ¿Qué pregunta elimina?  
3. ¿Se resuelve con un Operational Check?  
4. ¿Qué Capabilities necesita? → solo entonces Core.

### Lemas internos (equipo)

1. Primero evidencia. Después abstracción.  
2. ¿Qué pregunta elimina?  
3. **No mostramos datos. Confirmamos que la operación puede continuar.**

### Adopción

Digitalizar → Validar → Recomendar → Optimizar (IA solo con evidencia).

---

## 12. Diseño estratégico del Blueprint: cerrado

La fase de visión / Asistentes / Checks del Blueprint está **cerrada** como diseño especulativo.

Siguiente construcción documental (no es reabrir brainstorming de features):

> **Operational Model** — lenguaje permanente de objetos ([docs/17-operational-model/](../17-operational-model/README.md)).

Observation en EatClean **valida** ese lenguaje.  
No pantallas ni Capabilities inventadas en esta fase.

Los PRs grandes deberían contar **valor operativo** (modelo · jornada · findings · Checks).

---

## Relacionado

- [PRODUCT_VISION.md](./PRODUCT_VISION.md)
- [OPERATIONAL_CHECKS.md](./OPERATIONAL_CHECKS.md)
- [Operational Model](../17-operational-model/README.md)
- [OPERATIONS_DASHBOARD.md](./OPERATIONS_DASHBOARD.md) — Centro de Control
- [Operational Discovery](../16-operational-discovery/README.md)
- [Filosofía de Producto](../05-architecture/FILOSOFIA_DE_PRODUCTO.md)
