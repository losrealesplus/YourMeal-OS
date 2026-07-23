# PR Change Levels — no mezclar niveles

**Regla:** ningún Pull Request mezcla niveles de cambio.

Un PR = un nivel principal (o Documentation subordinada al mismo tema).

---

## Niveles

Marcar **uno** en la descripción del PR:

```text
Nivel del cambio

□ Knowledge          (Operational Model / UL / invariants)
□ Documentation      (guías, índices, sin cambiar comportamiento)
□ UX                 (Lovable / Design System / navegación visual)
□ Infrastructure     (auth infra, CI, schema transversal sin CAP)
□ Capability         (CAP-00x · Scaffold→Connected→…)
□ Evidence           (FOV / FO / FER / IVR)
□ Decision           (KUR / ECR / Acta G-01 / ADR)
```

---

## ✅ Correcto

```text
PR — CAP-002 Dish Catalog
Nivel: Capability
Estado: Scaffold → Connected
Alcance: lectura Supabase → Repository → Query → Hook → DishCard
```

---

## ❌ Evitar

```text
CAP-002
+ refactor navegación
+ nuevo componente
+ animaciones
+ cambio de colores
+ mejoras Dashboard
```

Rompe trazabilidad y confunde el historial de GitHub (evidencia del proyecto).

---

## Capability PRs — checklist

- [ ] Un solo CAP-00x  
- [ ] Sin cambios UX / Design System  
- [ ] Sin Core Objects / reglas nuevas  
- [ ] Knowledge Traceability en cierre  
- [ ] Estado según [MODULE_STATE_CRITERIA](../00-status/MODULE_STATE_CRITERIA.md)  

---

## Relacionado

- [ADR 0013](../adr/0013-implementation-is-knowledge-materialization.md)  
- [CURSOR_MASTER_PROMPT](./CURSOR_MASTER_PROMPT.md)
