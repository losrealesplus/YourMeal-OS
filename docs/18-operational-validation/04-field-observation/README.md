# 04 · Field Observation (entrada FASE 5)

EatClean y otras Organizaciones — **bajo lente de validación**.

> **Fase FOPEBA elevada:** [FOV — Field Operational Validation](../../20-evidence-framework/04-field-operational-validation.md)  
> Artefactos canónicos: **FOR** · **Field Validation Report** (no VR de mesa por defecto).

Esta carpeta conserva la plantilla operativa de campo alineada a FASE 5; el marco de fase obligatoria vive en Evidence Framework.

## Diferencia con Operational Discovery

| | Discovery (16) | FOV (20) / Validation campo |
|---|----------------|------------------------------|
| Pregunta | ¿Qué aprendimos para evolucionar? | ¿La realidad produce el mismo modelo? |
| Salida | Findings · Patterns · Candidates | FOR · Field Validation Report |
| Mezcla con diseño | No (solo evidencia) | No (solo coherencia del modelo) |

> No vamos a descubrir procesos nuevos para inventar features.  
> Vamos a **validar** que el modelo describe correctamente lo que ya ocurre.  
> **No llevar el modelo al negocio** para forzar vocabulario — observar y mapear.

Activación: cuando el equipo decida retomar campo **en modo FOV**.  
Checklist histórico Discovery: [FIRST_OBSERVATION_DAY.md](../../16-operational-discovery/FIRST_OBSERVATION_DAY.md) — apoyo, no sustituto.

---

## Plantilla · FOR-xxx (preferida)

Preferir **FOR** según [04 FOV](../../20-evidence-framework/04-field-operational-validation.md).

```markdown
# FOR-xxx — [Momento observado]

**Fecha / Organización:** …  
**Field Validation Report:** FVR-…  
**Origen Discovery (si aplica):** OF-xxx

## Realidad (sin opinión)

[Qué ocurrió, en lenguaje de cocina]

## Cadena

Realidad → Evento → Objeto → Lifecycle → Checks → Invariants

| Pregunta | Respuesta |
|----------|-----------|
| ¿Existe ya en el modelo? | Sí / Parcial / No |
| Core Objects | … |
| Dependencies | … |
| Lifecycle | … |
| Checks | … |
| Invariants | INV-… |

## Dictamen

Confirmed · Extended · Clarified · Contradicted

## ECL preliminar

ECL-2 → ECL-4 al cerrar en FVR
```

---

## Reglas en campo

1. Registrar en **lenguaje de cocina**; mapear después a canónico.  
2. No proponer pantallas ni APIs en el acto.  
3. Si «no existe en el modelo» → Extended/Contradicted → seguimiento VR/MC si estructural.  
4. Findings de Discovery pueden **alimentar** un FOR; el dictamen vive en FOV.  
5. No intervenir en la operación observada.

---

## Índice

| ID | Observación | Estado |
|----|-------------|--------|
| — | *(vacío hasta activación de campo)* | ⏸ |

---

## Relacionado

- [20 FOV](../../20-evidence-framework/04-field-operational-validation.md)  
- [16 Operational Discovery](../../16-operational-discovery/README.md)  
- [05 validation-reports](../05-validation-reports/README.md)
