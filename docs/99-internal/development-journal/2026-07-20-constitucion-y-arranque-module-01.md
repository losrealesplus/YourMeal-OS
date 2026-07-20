# Constitución consolidada e inicio de Module 01

Fecha: 2026-07-20  
Versión: v0.1.0  
Módulo: Gobierno / Module 01 (arranque)  
Estado: ✅ Constitución actualizada · 🚧 Module 01 en curso

---

## ¿Qué es?

Consolidación metodológica del proyecto el mismo día del Foundation Lock:

- Idioma oficial de desarrollo: español (código/BD en inglés)
- Protocolo de cierre de jornada + “no dejar en amarillo”
- Definition of Done
- Diario de Desarrollo del Proyecto
- Principio de Intencionalidad
- Documentos de dominio Module 01: Dish, Ingredient, Recipe (antes de implementar UI)

---

## ¿Cómo es?

```text
docs/
  00-status/DEFINITION_OF_DONE.md
  05-architecture/CIERRE_DE_JORNADA.md
  99-internal/development-journal/
  12-domain-model/module-01/{Dish,Ingredient,Recipe}.md
  adr/0010-*.md  adr/0011-*.md
```

Cursor lidera arquitectura y dominio. Lovable acelera UI bajo la constitución.

---

## ¿Por qué existe?

Sin constitución operativa, cada herramienta (Lovable, Cursor, prompts) puede reinventar el sistema. El Diario y el Principio de Intencionalidad evitan crecimiento sin conocimiento: cada pieza debe justificar su existencia.

---

## ¿Para qué sirve?

- Alineación del equipo y de los agentes de IA
- Memoria a 1–5 años (“por qué existe X”)
- Transición de *Infrastructure Driven* a *Domain Driven*

---

## Objetivos

**Principal:** cerrar Foundation como metodología y abrir Module 01 con dominio primero.

**Secundarios:** checklist Done; cierre diario disciplinado; fichas Dish/Ingredient/Recipe.

---

## Reglas

- Nada se añade sin razón de existir
- Done implica entrada en el Diario (cuando aplique)
- UI solo después de entidad, estados, reglas, servicio, repositorio, permisos (y tests cuando existan)

---

## Dependencias

**Necesita:** Foundation Lock v0.1.0.

**Lo utilizan:** toda la vida del proyecto.

**Siguiente consumidor:** implementación de dominio Dish (sin pantalla).

---

## Futuro

- Migrar docs históricos EN → ES de forma progresiva
- Una entrada de Diario por cada módulo Done
- Automatizaciones / IA solo cuando el dominio lo pida (ADR)

---

## Decisiones tomadas

- Nombre: **Diario de Desarrollo del Proyecto**
- Carpeta: `docs/99-internal/development-journal/`
- Un archivo por jornada/hito
- Module 01 empieza por tres docs de dominio, no por CRUD
- ADR 0011

Referencias: ADR 0010, ADR 0011, DEFINITION_OF_DONE, MODULE_01_DISH_LIBRARY
