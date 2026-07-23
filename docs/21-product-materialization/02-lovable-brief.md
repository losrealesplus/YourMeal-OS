# Lovable Brief — materializar sin inventar

Lovable es la **herramienta principal** de experiencia (sync con el repo).  
No pedir «una app bonita». Pedir **navegación y pantallas ancladas a capacidades**.

---

## Prompt patrón (FOPEBA-aligned)

```text
Genera la navegación y pantallas base de [Actor App] basándote ÚNICAMENTE
en estas capacidades operacionales y objetos del Operational Model.

No inventes reglas de negocio.
No inventes entidades nuevas.
No añadas automatizaciones, heurísticas ni optimizaciones.
Si algo no está en la lista, no lo inventes: omítelo o deja un placeholder
marcado "fuera de alcance / pendiente de evidencia".

Actor: …
Capacidades:
- …
Objetos OM:
- …
Pantallas autorizadas (matriz):
- …
Design: coherente, operable en cocina/móvil según actor; sin glow / sin
inventar brand system paralelo al Design System del repo cuando exista.
```

---

## Qué pedir ahora

**Un PM por conversación** — empezando por [PM-001](./PM-001-Customer-App.md).

Para alinear la Customer App a la identidad del Tenant (EatClean), usar:

- [TENANT_IMPLEMENTATION_EATCLEAN](../05-architecture/TENANT_IMPLEMENTATION_EATCLEAN.md) ← **brief principal**  
- [ADR 0014](../adr/0014-customer-application-is-tenant-branded.md)  
- [TENANT_EXPERIENCE_SPEC](../05-architecture/TENANT_EXPERIENCE_SPEC.md)  
- [TENANT_BRANDING](../05-architecture/TENANT_BRANDING.md)  
- [`tenants/eatclean/`](../../tenants/eatclean/README.md)  

Sin tocar HP-001 ni inventar lógica de negocio.

No un único prompt enorme de «toda la app».

Infraestructura a reutilizar (ver [Rules](./PRODUCT_MATERIALIZATION_RULES.md)):

```text
- navegación / shell Customer
- audit_log
- feature_flags
- i18n (6 idiomas)

Utiliza esta infraestructura. No la recrees. No propongas alternativas.
```

Experiencias completas: vacío · datos · loading · error · offline · a11y.

---

## Checklist antes de generar

- [ ] Fila(s) en matriz pantalla↔conocimiento  
- [ ] Actor y objetivos claros (IA)  
- [ ] Prompt incluye «no inventes reglas de negocio»  
- [ ] Carril A / FOV no se da por cerrado  

---

## Tras generar

- Revisar que no haya pantallas huérfanas  
- Añadir a matriz cualquier pantalla que Lovable haya colado → aceptar (con cita OM) o eliminar  
- Iterar UX en Lovable; Figma solo si hace falta ([03](./03-figma-support.md))

---

## Relacionado

- [README materialization](./README.md) · [Sprint 2.1](../15-product/etapa-2/SPRINT_2_1_PRODUCT_FOUNDATION.md)
