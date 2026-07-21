# FOUNDATION.md como constitución global reusable

Fecha: 2026-07-21  
Versión: v0.1.0  
Módulo: Gobierno / metodología  
Estado: ✅ Regla permanente

---

## ¿Qué es?

Creación de `FOUNDATION.md` en la raíz como constitución **global** reusable para cualquier proyecto Foundation.

No describe el producto.

Describe **cómo debe pensar una IA o colaborador antes de modificar el producto**.

Se complementa con la constitución específica de YourMeal OS (`AGENTS.md`, `docs/`, ADRs, roadmap, dominio).

---

## ¿Cómo es?

```text
FOUNDATION.md        → constitución global reusable
AGENTS.md            → constitución operativa específica del proyecto
docs/ + ADRs         → fuente de verdad de arquitectura y dominio
```

Orden de lectura fijado en el proyecto:

```text
FOUNDATION.md → AGENTS.md → docs/
```

---

## ¿Por qué existe?

Porque el contexto CTO y la constitución de YourMeal OS son específicos del producto, pero la forma de **pensar antes de tocar cualquier proyecto** es transversal.

Esto permite que todos los proyectos Foundation compartan criterio, disciplina y filosofía, independientemente de su stack o negocio.

---

## ¿Para qué sirve?

| Aporta a | Valor |
|----------|--------|
| IA / Cursor | Punto de partida común antes de cualquier cambio |
| Desarrolladores | Criterio homogéneo entre proyectos |
| Empresa | Método reproducible, no dependiente de un único producto |

---

## Objetivos

**Principal:** separar constitución global reusable de constitución específica del proyecto.

**Secundarios:**

- Evitar prompts largos repetidos en cada repositorio
- Convertir Foundation en una firma metodológica reconocible
- Mantener YourMeal OS alineado con esa base común

---

## Reglas

- `FOUNDATION.md` no sustituye ADRs ni docs del proyecto
- El producto concreto se gobierna desde `AGENTS.md` + `docs/`
- Si una decisión contradice la visión del proyecto, se documenta el conflicto antes de implementar

---

## Dependencias

Necesita: constitución específica del proyecto.  
Lo utilizan: futuras sesiones de Cursor, otros proyectos Foundation.

---

## Futuro

Replicar `FOUNDATION.md` en proyectos futuros y mantener el núcleo estable.

---

## Decisiones tomadas

- Nombre definitivo: `FOUNDATION.md`
- Ubicación: raíz del proyecto
- Cursor sigue siendo CTO en YourMeal OS, pero lee primero la constitución global
- ADR relacionado: 0012
