# Hipótesis FOV derivadas del RC

Fuente: [Known Limitations RC](../../00-status/03-known-limitations-rc.md).

FOV no explora sin dirección.  
Cada hipótesis se confirma, refuta, extiende o queda insuficiente (FO-V / FO-C / FO-E / FO-U).

---

## H-FOV · Limitaciones de cobertura

| ID | Hipótesis (neutra) | Si se observa… | Clasificación candidata |
|----|--------------------|----------------|-------------------------|
| H-01 | Inbound finished goods sin Batch local se resuelve con Stock / receive-and-portion | Flujo sin Batch de cocina | FO-V o FO-E |
| H-02 | Servery / canteen se narra como Route=ventana + Delivery=mostrador | Entrega sin vehículo | FO-V o FO-E |
| H-03 | Dual payer aparece como funding / Invoice path sin romper Account | Dos pagadores, un Beneficiary | FO-E o FO-C vs INV-015 |
| H-04 | Restricción dietética vive en Beneficiary / Order Item / Checks (no DietPrescription Core) | Hospital / alergias / menú clínico | FO-V, FO-E o FO-C |
| H-05 | Cook-chill multi-hop se narra como dos ciclos espina vía Stock | Regenerar / reenvasar | FO-V o FO-C |

---

## H-FOV · Hipótesis de producción espontánea

| ID | Hipótesis | Evidencia esperada |
|----|-----------|-------------------|
| H-10 | Happy Path B2B se produce sin forzar vocabulario | Escena Menu→…→Payment en lenguaje de cocina |
| H-11 | Amend / Pause / Hold aparecen en incidentes reales | Dinámica sin enseñar Dynamics |
| H-12 | Decisiones humanas en borde = MANUAL DECISION | Checks / INV-043 en campo |
| H-13 | Existen tiempos, errores y preguntas eliminables | Entrada futura a EC (no fuerza KU) |

---

## H-FOV · Fuera del Core (deliberado)

| ID | Afirmación RC | Qué mirar en campo |
|----|---------------|--------------------|
| H-20 | Shift / Wave / Super-Route no son Core | ¿La cocina inventa un objeto que fuerce Core? |
| H-21 | Recall no es Core | ¿Lot + Hold bastan en incidente real? |
| H-22 | Notification / Dashboard = Capabilities | ¿Aparece necesidad de objeto de dominio? |

---

## Uso en campo

1. Antes de la sesión: marcar 2–4 hipótesis del día (plan).  
2. Durante: registrar FO sin forzar encaje.  
3. Después: mapear FO → hipótesis (una FO puede tocar varias).  
4. En FER: ¿qué hipótesis quedaron V / C / E / U?

---

## Relacionado

- [02 Observation Plan](./02-observation-plan-eatclean.md)  
- [03 Field Observations](./03-field-observations.md)
