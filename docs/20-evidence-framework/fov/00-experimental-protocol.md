# FOV · Protocolo experimental

Mismo rigor que [IOV Experimental Protocol](../../19-independent-operational-validation/05-experimental-protocol.md):  
objetivo · material · participantes · entregables · clasificación · reglas de escalado.

---

## Objetivo

Medir si el conocimiento certificado en el Operational Model RC **sobrevive y se produce** en la operación real — sin forzar el vocabulario del modelo.

---

## Hipótesis de campaña

> Si el Operational Model RC describe la estructura permanente del dominio, la operación observada en EatClean producirá espontáneamente (en lenguaje de cocina) los objetos, lifecycles, checks y dependencias del modelo — o generará FO-C / FO-E documentables.

Hipótesis concretas: [01](./01-hypotheses-from-rc.md).

---

## Material

| Incluido para el observador | Excluido en campo |
|-----------------------------|-------------------|
| [Known Limitations RC](../../00-status/03-known-limitations-rc.md) (guía de atención) | App / demos / pitch |
| Hoja FO (plantilla) | Explicar el modelo a la cocina |
| Reloj / tiempos | Proponer pantallas o procesos |
| Consentimiento / acceso | Intervenir en la operación |

El observador **conoce** el modelo (no es ciego como IOV).  
Su disciplina es **no enseñarlo** ni pedirle a la operación que lo siga.

---

## Participantes

- Observador(es) de campo (equipo FOPEBA).  
- Operación EatClean (sujeto observado, no co-diseñador en sesión).  
- Autores del modelo: **silencio interpretativo** en el momento de la observación (no «traducir en vivo» lo visto al Core).

---

## Entregables

1. **FO-xxx** — Field Observations clasificadas (FO-V / FO-E / FO-C / FO-U).  
2. **FER-xxx** — Field Evidence Review (respuesta a 4 preguntas).  
3. Solo si FER autoriza: candidatos a [Knowledge Update](../05-knowledge-update.md).

**No** se espera un MC por cada FO.

---

## Pregunta de campo (neutral)

> ¿Qué hace realmente la operación cuando nadie le pide que siga el modelo?

---

## Clasificación (obligatoria por FO)

| Código | Significado | ¿Puede escalar a KU? |
|--------|-------------|----------------------|
| **FO-V** | Confirma el modelo | No (refuerza ECL; no cambia estructura) |
| **FO-E** | Extiende sin romper Core | Sí, si FER + umbral (repetible / material) |
| **FO-C** | Contradice hipótesis certificada | Sí — casi siempre entra a FER con prioridad |
| **FO-U** | Insuficiente para concluir | No — más observación |

Detalle y plantilla: [03](./03-field-observations.md).

---

## Reglas: cuándo una FO puede escalar a Knowledge Update

Una FO **no** abre KU sola. Debe pasar el [FER](./04-field-evidence-review.md).

Escalado permitido solo si:

1. Clasificación **FO-E** o **FO-C** (no FO-U; FO-V no requiere KU).  
2. FER responde «sí» a *¿merece Knowledge Update?*  
3. Evidencia **repetible** o **material** (no anécdota única sin peso operacional), salvo FO-C estructural evidente.  
4. Se responden las [6 preguntas](../05-knowledge-update.md) antes de tocar `17`.  
5. FO-C sobre Core / Aggregate / Dependency / Lifecycle → VR/MC vía gobierno existente; **nunca** editar Core en caliente en campo.

```text
FO
 ↓
Classification (FO-V/E/C/U)
 ↓
FER (4 preguntas)
 ↓
├─ No KU → archivar / más observación / elevar ECL
└─ Sí KU → KUR → (VR → MC si aplica) → EC
```

---

## Anti-sesgo

- No llevar el modelo al negocio para forzar vocabulario.  
- Preferir preguntas abiertas («¿qué pasa cuando…?») frente a checklist del Core.  
- Registrar también lo **aburrido** que confirma (FO-V) — evidencia negativa de sorpresa.  
- Una campaña sin ningún FO-E / FO-C / comportamiento no previsto debe **justificar** por escrito la suficiencia exploratoria (raro).

---

## Relacionado

- [02 Observation Plan](./02-observation-plan-eatclean.md)  
- [04 FER](./04-field-evidence-review.md)
