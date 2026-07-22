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

## Qué pedir en la primera pasada (Sprint 2.1)

1. Arquitectura de navegación por actor  
2. Flujos Happy Path  
3. Pantallas base (lista de la [matriz](./01-screen-knowledge-matrix.md))  
4. Design System inicial (tokens + componentes reutilizables)  
5. Sync al repositorio  

**No** pedir aún: motores de dominio, reglas Amend/Hold complejas no cableadas, «IA que decide», optimización de rutas.

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
