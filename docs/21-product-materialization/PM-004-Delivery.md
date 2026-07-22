# PM-004 — Delivery

**Sprint:** 2.4  
**Estado:** 🔒 Tras PM-003  
**Depende de:** [PM-003](./PM-003-Production.md)

---

## 1. Objetivo

Materializar la experiencia de **reparto**: ruta, paradas, entregas e incidencias — sin optimizar rutas con heurísticas de campo.

---

## 2. Alcance

**Incluye:** Route · Stops · Deliveries · Attempt Delivery (UI) · Incidencias  

**Excluye:** Optimización de rutas · motor Route · Fase D

---

## 3. Actores

Repartidor / last-mile.

---

## 4. Capacidades

Consultar ruta del día · confirmar entrega · registrar intento / incidencia (UI alineada a Dynamics si existe; sin inventar estados).

---

## 5. Objetos operacionales

Route · Delivery · Packaging/Label (identidad) · Dynamics Attempt Delivery (referencia OM).

---

## 6. Restricciones

Móvil-first.  
Estados completos (sin señal · offline · error).  
No inventar lógica.  
Reutilizar i18n / infra.

---

## 7. Referencias OM

Route · Delivery · Dynamics · matriz Reparto · [Rules](./PRODUCT_MATERIALIZATION_RULES.md)

---

## 8. Criterios de aceptación

- [ ] Ruta → paradas → entrega / intento / incidencia  
- [ ] Sin optimización inventada  
- [ ] Matriz actualizada  

---

## 9. Entregables

Delivery UI revisable · sync repo.

---

## 10. Prompt Lovable

```text
PM-004 — Delivery
Materializa Route, Stops, Deliveries, Attempt Delivery e incidencias.
UI móvil. Experiencias completas. Sin optimización de rutas ni Fase D.
No inventes reglas. Incremento revisable tras PM-003.
```
