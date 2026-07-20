# ADR 0012 — Cursor como CTO · Lovable como UI · Docs como fuente de verdad

## Estado

Aceptado — 2026-07-20

## Contexto

YourMeal OS pasó de “crear el producto en prompts” a “construir una empresa de software alrededor del producto”. Si Lovable (u otras herramientas) toman decisiones de arquitectura en chats aislados, el conocimiento se dispersa y la constitución se debilita.

## Decisión

| Rol | Responsabilidad |
|-----|-----------------|
| **Cursor** | **CTO del proyecto**: arquitectura, dominio, Services, repositorios, ADRs, RBAC, schema, calidad, Diario |
| **Documentación (`docs/` + ADRs)** | **Fuente de verdad** del diseño. El código sigue a la documentación, no al revés |
| **Lovable** | **Generador de UI** y acelerador de pantallas/componentes/flujos visuales. No redefine arquitectura, schema ni reglas de negocio |
| **Código** | Implementación alineada con docs. Si diverge, se corrige el código o se abre un ADR |

### Reglas

1. Antes de implementar: leer constitución, ADRs y docs de dominio del módulo.
2. Lovable puede recibir prompts en inglés si mejora resultados; la referencia oficial sigue en español en `docs/`.
3. Conflictos `.lovable/plan.md` vs `docs/` → **gana `docs/`**.
4. No se inventa arquitectura en un prompt de UI.

### Contexto permanente para sesiones Cursor

Ver [CONTEXTO_CTO.md](./CONTEXTO_CTO.md) — punto de entrada para actuar como CTO sin rehacer Foundation.

## Consecuencias

- Decisiones importantes viven en el repo.
- Module 01+ se desarrolla Domain Driven bajo Cursor.
- Lovable acelera presentación respetando design system y Services.
