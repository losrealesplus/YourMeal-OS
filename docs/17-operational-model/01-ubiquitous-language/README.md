# 01 — Ubiquitous Language (operativo)

**FASE 4 · Operational Model**  
**Prioridad de esta sesión:** consolidar el lenguaje — no ampliar el sistema  
**Observation:** ⏸ congelada  

> El Ubiquitous Language **no es un glosario**.  
> Es el **contrato semántico** entre negocio, producto y desarrollo.

---

## Propósito

> El Ubiquitous Language define el vocabulario oficial de YourMeal OS.

Todos los documentos, Capabilities, Operational Checks, modelos de datos, interfaces y conversaciones deben utilizar **exactamente** estos términos.

- Un concepto solo puede tener **un** significado.  
- Dos conceptos distintos **nunca** compartirán el mismo nombre.  
- Si un término resulta ambiguo, debe **eliminarse o sustituirse**.

Complemento técnico (código / tablas): [docs/12-domain-model/UBIQUITOUS_LANGUAGE.md](../../12-domain-model/UBIQUITOUS_LANGUAGE.md).  
Actores de dominio: [ACTORS.md](../../12-domain-model/ACTORS.md).

Este bloque define el **sentido operativo** primero.

---

## Principios permanentes

### 1. Un nombre = un concepto

Nunca usar «Pedido» para comprar, servir, menú y producción a la vez.

Cada palabra canónica tiene un único significado.

### 2. Un concepto = un responsable

Ejemplo: **Production Batch** existe para organizar una producción.  
No para almacenar Orders.

### 3. Los nombres describen la realidad

Nunca nombres técnicos, de BD o de ERP heredado.

| Mal | Bien |
|-----|------|
| MealPlanHeader | Weekly Menu |
| InventoryMovementDTO | *(no pertenece aquí — es código)* |
| MealEntity | Dish |

### 4. El lenguaje pertenece al negocio

Si un cocinero nunca usaría esa palabra, hay que justificarla muy bien.

### 5. Toda Capability habla este idioma

Las pantallas y la tecnología cambian.  
El lenguaje no.

### 6. Un concepto debe poder dibujarse

Si no se puede hacer un esquema del objeto (relaciones, ciclo, estados), probablemente **no es un concepto** — es una agrupación («configuración», «utilidades»).

### 7. Contrato semántico (regla diferencial)

> **Si dos personas usan la misma palabra para referirse a cosas distintas, el modelo está roto.**

> **Si una misma realidad necesita dos palabras distintas, el modelo también está roto.**

---

## Tres niveles de términos

| Nivel | Qué es | Ejemplo | Regla |
|-------|--------|---------|--------|
| **1 · Canónico** | Lenguaje oficial del sistema | Order, Recipe, Ingredient, Production Batch | Nunca cambia sin decisión consciente |
| **2 · Alias de negocio** | Cómo habla un cliente en el día a día | «servicio», «comida», «ración», «pedido» | Se mapea al canónico; no entra al Core |
| **3 · Local / migración** | Vocabulario de una Organización concreta | «bandeja», «línea» | Solo notas de migración; el sistema sigue diciendo el canónico |

En docs y código de producto: **Nivel 1**.  
En conversación con cocina: se puede oír Nivel 2/3 — se traduce al canónico al documentar.

---

## Plantilla obligatoria de cada concepto

```text
# Nombre (Código)

## Definición
Una frase.

## Qué es

## Qué NO es

## Existe cuando...

## Finaliza cuando...

## Responsable principal

## Se relaciona con

## Operational Checks habituales

## Capabilities relacionadas

## Sinónimos prohibidos

## Notas
```

Si un campo no aplica aún: escribir `—` (no inventar).

---

## Índice por área

| Área | Archivo | Contenido |
|------|---------|-----------|
| Actores | [actors.md](./actors.md) | Quién actúa (sin «Cliente» / Customer ambiguo) |
| Comercial | [commercial.md](./commercial.md) | Weekly Menu · Dish · Order · Order Item |
| Operaciones | [operations.md](./operations.md) | Plan · Batch · Recipe · Ingredient · Stock · Supplier · Kitchen · Packaging · Label |
| Logística | [logistics.md](./logistics.md) | Delivery Route · Vehicle · Delivery |
| Finanzas | [finance.md](./finance.md) | Payment · Invoice |

Espina de valor:

```text
Weekly Menu → Order → Production Plan → Production Batch
→ Packaging → Delivery Route → Delivery → Payment
```

---

## Disciplina de edición

1. No añadir objetos «por si acaso» (riesgo de sobre-modelado).  
2. Solo permanentes y comunes a cualquier operación de comida preparada.  
3. Antes de un sinónimo nuevo: comprobar la regla 7.  
4. Sin nombres de DTOs, Entities o Repositories en este vocabulario.

---

## Relacionado

- [Operational Model](../README.md)  
- [Core Objects](../02-core-objects/README.md)  
- [OPERATIONAL_CHECKS](../../15-product/OPERATIONAL_CHECKS.md)  
- [ACTORS](../../12-domain-model/ACTORS.md)
