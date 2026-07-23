# IR-001 — First Engineering Integration

**Fecha:** 2026-07-23  
**PR:** [#22](https://github.com/losrealesplus/YourMeal-OS/pull/22)  
**Tipo:** Integration Release (no Capability · no Decision · no Audit)

---

## Qué es

El momento en que la Etapa 2 deja de vivir solo en ramas apiladas y pasa al **tronco** (`main`).

```text
IR-001
First Engineering Integration

Stack (CAP-002…006 · Acta · Sprint 0 audit)
        ↓
      main
```

---

## Por qué importa

Hasta IR-001 el conocimiento estaba integrado en la **pila**, no en el **tronco**:

- `#15` → `main` ✅  
- `#16…#21` → bases de feature (pila) ✅ · `main` ❌  

IR-001 corrige esa asimetría. Sin ella, FOV arrancaría sobre un trunk incompleto.

---

## Alcance absorbido

| Ref | Contenido |
|-----|-----------|
| CAP-002…005 | Read / Mutation Patterns Connected |
| CAP-006 | Confirm · HP-001 materializado en código |
| PR #19 | Acta · ORR binaria · MILESTONES |
| PR #21 | Sprint 0 Engineering Review |
| — | `CURRENT_PHASE.md` · puertas duales |

---

## No es

- Declaración de **ORR PASSED**  
- Listo para FOV  
- Fin de deuda P1  

Tras IR-001: **Engineering Fix Sprint** → verificación → ORR → FOV.

---

## Tag de restauración (post-merge)

```text
v0.2.0-engineering-baseline
```

Alias conceptual: `v0.2.0-pre-pilot`.

Snapshot: FOPEBA Frozen · Methodology Closed · Product Skeleton · Connection + Mutation Patterns · CAP-001…006 en `main` · gobernanza consolidada.
