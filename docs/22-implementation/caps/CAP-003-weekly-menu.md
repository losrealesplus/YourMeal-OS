# CAP-003 — Weekly Menu

**Estado:** Scaffold → Connected  
**Depende de:** CAP-002 (recomendado)

---

## Preconditions

- CAP-002 = Connected (lectura de platos reales)  
- Usuario autenticado · tenant resuelto  
- Oferta / menú semanal disponible en OM (sin inventar reglas)  

## Postconditions

- Menú semanal muestra datos reales (no mock de oferta)  
- Sin cambios UX / navegación  
- Typecheck limpio  
- Happy Path: Parcial (tras Connected)  

---

## Objetivo

Conectar Menú semanal a datos reales (Menu / oferta) sin cambiar UX.

## No modificar

Pantallas menu · navegación · componentes visuales.

## Traceability

| Campo | Valor |
|-------|-------|
| Core | Menu · Dish |
| OM | Menu lifecycle / oferta semanal |

## Prompt

```text
Implementar CAP-003 Weekly Menu.
No modificar UX ni componentes.
Solo conectar datos reales (Menu/Dish) vía Repository/Query/Hooks.
Typecheck limpio. Formato de cierre oficial.
Estado objetivo: Connected.
```
