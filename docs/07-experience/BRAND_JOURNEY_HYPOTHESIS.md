# Brand Journey (BJ) — hipótesis metodológica

**Estado:** 🧪 **Hypothesis** — **no** es concepto oficial FOPEBA  
**Knowledge Lifetime:** Iteration *(nota de hipótesis; no Contract)*  
**Origen:** observación del bloque PR #24→#30 (EatClean sobre YourMeal OS)  
**Promoción a oficial:** solo si un **segundo tenant** (además de EatClean) demuestra el mismo valor

> No confundir con Customer Journey (CJ) ni Operational Journey (OJ).  
> No añadir a PROJECT_DICTIONARY como Accepted hasta promoción.

---

## Definición propuesta (hipótesis)

> **BJ (Brand Journey):** secuencia de puntos de contacto donde la identidad visual, el lenguaje y la percepción de marca deben mantenerse coherentes para que el usuario reconozca un **único producto**, independientemente del canal o del rol con el que interactúe.

No describe un flujo funcional.  
No es branding aislado ni “UX genérica”.  
Es la **continuidad de marca a lo largo de toda la experiencia**.

---

## Ejemplo (EatClean)

```text
Instagram
    ↓
Website
    ↓
Login
    ↓
Customer App
    ↓
Centro de Operaciones
```

En cada transición, cliente o empleado debe seguir sintiendo el mismo universo de marca.

Filtro operativo ya oficial (Contract):  
[Brand Recognition Filter](../05-architecture/TENANT_EXPERIENCE_SPEC.md#principio-rector--brand-recognition-filter-no-negociable).

---

## Tres niveles de journey (mapa mental)

| Sigla | Qué responde | Oficial FOPEBA hoy |
|-------|--------------|:------------------:|
| **CJ** | ¿Qué quiere hacer el cliente? | ✅ |
| **OJ** | ¿Qué necesita hacer el equipo hoy? | ✅ (Experience) |
| **BJ** | ¿Sigue siendo la misma marca en cada canal/rol? | 🧪 Hypothesis |

```text
BJ  (continuidad de identidad)
 │
 ├── CJ  (recorrido del cliente)
 └── OJ  (recorrido del equipo)
```

BJ no sustituye a CJ/OJ. Los **atraviesa**.

---

## Por qué aún no es metodología FOPEBA

1. Methodology Frozen: no se inventan conceptos oficiales sin evidencia / Gate.  
2. Un solo tenant (EatClean) no basta para generalizar.  
3. El valor ya está parcialmente cubierto por ADR-0014 + Tenant Experience Spec + Brand Continuity Locked.

Si en un **segundo proyecto/tenant** vuelve a demostrar valor → entonces valorar:

- entrada Accepted en Dictionary;
- sección en TENANT_EXPERIENCE_SPEC;
- eventual regla FOPEBA de documentación (no fase de validación nueva).

Hasta entonces: **hipótesis útil**, no obligación metodológica.

---

## Relacionado

- [ACT-001](../00-status/ACT-001_EATCLEAN_EXPERIENCE_BASELINE_FROZEN.md)  
- [ADR 0014](../adr/0014-customer-application-is-tenant-branded.md)  
- [CUSTOMER_JOURNEYS](./CUSTOMER_JOURNEYS.md) · [OPERATIONAL_JOURNEYS](./OPERATIONAL_JOURNEYS.md)  
- [EATCLEAN_BRAND_CONTINUITY_LOCKED](../21-product-materialization/EATCLEAN_BRAND_CONTINUITY_LOCKED.md)
