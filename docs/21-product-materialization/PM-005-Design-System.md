# PM-005 — Design System

**Sprint:** 2.5  
**Estado:** 🔒 Tras PM-001 (puede solaparse parcialmente con 001; cierre formal tras 002–004 o en paralelo controlado)  
**Depende de:** patrones emergentes de [PM-001](./PM-001-Customer-App.md)+

---

## 1. Objetivo

Consolidar el **Design System** de YourMeal OS / EatClean: tokens, tipografía, iconografía, estados, componentes y motion — sin reinventar producto.

---

## 2. Alcance

**Incluye:** Tokens · tipografía · iconografía · estados (default/hover/disabled/error/success) · componentes · animaciones sutiles (presencia, no ruido)

**Excluye:** Nuevas features · pantallas de negocio nuevas · glow / estética genérica IA prohibida por reglas de diseño del proyecto

---

## 3. Actores

Diseño / frontend (transversal a todos los actores de producto).

---

## 4. Capacidades

N/A (sistema visual). Debe **servir** capacidades ya materializadas en PM-001…004.

---

## 5. Objetos operacionales

Ninguno nuevo. El DS no define dominio.

---

## 6. Restricciones

Alinear con marca EatClean y convenciones del repo.  
Figma solo si hace falta documentar un patrón ([03](./03-figma-support.md)).  
No proponer design system paralelo al de Lovable/repo.

---

## 7. Referencias

[Rules](./PRODUCT_MATERIALIZATION_RULES.md) · componentes ya generados en PM-001…004 · `AGENTS.md` / reglas de diseño frontend del proyecto

---

## 8. Criterios de aceptación

- [ ] Tokens documentados y usados  
- [ ] Librería de componentes reutilizable  
- [ ] Estados consistentes across Customer/Admin/Production/Delivery  
- [ ] Motion 2–3 intencional, no decorativo excesivo  

---

## 9. Entregables

DS v1 en repo · guía breve de uso · sync Lovable.

---

## 10. Prompt Lovable

```text
PM-005 — Design System
Consolida tokens, tipografía, iconografía, estados, componentes y
animaciones sutiles a partir de lo ya materializado en Customer/Admin/
Production/Delivery. No añadas pantallas de negocio nuevas.
No inventes brand system paralelo. Documenta y reutiliza.
Incremento revisable.
```
