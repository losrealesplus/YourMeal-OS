# CAPABILITY_CANDIDATES — Puente Discovery → Blueprint

## Propósito

Conectar evidencia con oportunidades de producto.

**Aquí todavía no existe diseño técnico.**  
Solo oportunidades **justificadas**.

## Alcance

Filas que nacen de patrones validados (o evidencia fuerte en camino a patrón).

## Estructura

| Evidencia | Patrón | Asistente (Blueprint) | Capability candidata | Estado |
|-----------|--------|----------------------|----------------------|--------|
| OF-… | PAT-… / Sí / No | … | Nombre tentativo | Hipótesis / Justificada / En Blueprint / Descartada |

## Reglas

- Sin entidades, Use Cases ni esquemas.  
- Si no hay evidencia en esta carpeta → no añadir fila.  
- «Justificada» exige patrón o evidencia repetida acordada.  
- El diseño ocurre en [Product Blueprint](../15-product/README.md) / Capability specs — no aquí.

## Criterios de actualización

Cuando un PAT se valide o un conjunto de OF demuestre necesidad clara.

## Ejemplos (formato — vacíos de evidencia real)

| Evidencia | Patrón | Asistente | Capability | Estado |
|-----------|--------|-----------|------------|--------|
| OF-001 | No aún | Packaging | Packaging Verification | Hipótesis (ejemplo) |
| — | — | Delivery | Route Execution | — (esperar evidencia) |

---

## Regla de promoción

```text
Operational Discovery (evidencia)
        ↓
Capability Candidate (esta tabla)
        ↓
Product Blueprint / Asistente
        ↓
Capability + Use Cases + implementación
```
