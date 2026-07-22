# Invariants · Identidad

**Categoría 1** — quién es único e irreemplazable.

---

## INV-001 · Identidad única del Core Object

> Todo Core Object posee una **identidad única** dentro de su Organization (Tenant).

No se reutiliza la misma identidad para dos realidades distintas.  
Archive conserva identidad histórica.

**Checks relacionados:** — (vigilancia en persistencia / Domain)  
**Capabilities:** ninguna crea identidad duplicada.

---

## INV-002 · Lenguaje canónico

> Un concepto canónico tiene **un** nombre. Dos conceptos distintos **nunca** comparten nombre.

Sin «Cliente» / `Customer` ambiguo.  
Sinónimos de cocina = Nivel 2/3 — no sustituyen Nivel 1.

**Checks relacionados:** —  
**Violación:** modelo fracturado; ver [01 UL](../01-ubiquitous-language/README.md).

---

## INV-003 · Archive ≠ Purge

> Archivar **no** es borrar. Purge es excepcional, auditado, fuera del flujo operativo diario.

**Checks relacionados:** —  
**Lifecycle:** transiciones de archivo no eliminan trazabilidad de demanda/cobro.

---

## INV-004 · Actor explícito

> Toda demanda (**Order**) identifica si proviene de **Consumer** o **Beneficiary** (y en B2B, la **Company Account** contratante).

Nunca un «cliente» sin actor.

**Checks relacionados:** ¿Puede confirmarse Order? (completitud de actor)
