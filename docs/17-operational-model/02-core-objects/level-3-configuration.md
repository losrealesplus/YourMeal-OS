# Nivel 3 — Configuration Objects

**No representan la operación.**  
Representan **reglas y ajustes**.

No se mezclan con Core Objects ni se tratan como eslabones de la espina.

---

## Qué son

| Ejemplo | Código orientativo | Notas |
|---------|-------------------|--------|
| Business Settings | `BusinessSettings` | Preferencias de la Organization |
| Operating Hours | `OperatingHours` | Ventanas de cocina / reparto |
| Delivery Zones | `DeliveryZones` | Geografía comercial (si aplica) |
| Roles | `Role` | AuthZ de Employee |
| Permissions / Capabilities (auth) | `Permission` | Claves `dishes.read` — no confundir con Capability de producto |
| Feature Flags | `FeatureFlag` | Rollout — plataforma |

Estas piezas pueden vivir en Domain / Platform.  
**No** engordan el catálogo de Core Objects.

---

## Regla

Si alguien propone «añadir Settings al Operational Model como Core»:

1. ¿Es operacional, permanente y estable como **objeto de negocio**?  
2. ¿Tiene ciclo de vida de cocina / entrega?  

Casi siempre: **Nivel 3** o ni siquiera Operational Model.

---

## Qué tampoco es Nivel 3 «disfrazado de Core»

- Dashboard  
- Notification  
- Report  
- Widget  
- KPI  

→ Presentación. Fuera del Operational Model.
