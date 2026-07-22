# IOV-002 · Adversarial Validation

**Paso 1 · Campaña de certificación** — [01](../00-status/01-certification-campaign.md)

Mentalidad: **certificar**, no construir.  
No colaborar. **Oposición.**

---

## Pregunta única

> **¿Puede un tercero obligarnos a cambiar la estructura del modelo?**

---

## Instrucción oficial (entregar literal)

> Tu misión no es comprender el modelo ni ayudar a mejorarlo.
>
> Tu objetivo es demostrar que el Operational Model es insuficiente.
>
> Intenta obligar al equipo a:
>
> * crear un nuevo Core Object;
> * romper un Invariant;
> * introducir una nueva Dependency estructural;
> * redefinir un Lifecycle completo.
>
> Toda propuesta deberá justificarse exclusivamente mediante escenarios pertenecientes al dominio de alimentación preparada.

---

## Quién participa

Evaluador independiente: sin FOPEBA, sin YourMeal OS, sin contexto previo.  
Primera aproximación válida: **IA en conversación nueva** (piloto).

Autores: silencio · no co-diseñan el ataque.

---

## Material

Exactamente el [KCM](./kcm/README.md) de la sesión (p.ej. KCM-002).  
Nada más. Prohibición de conocimiento implícito.

Dominio: **alimentación preparada** únicamente (hospitales · militar · aéreo · prisiones · universidades · eventos · residencias…).

---

## Evidencia

| Artefacto | Contenido |
|-----------|-----------|
| **SF-xxx** | Structural Findings |
| IVR-002 | Informe de sesión |

Cada ataque declara objetivo forzado: Core · Invariant · Dependency · Lifecycle.

Resultado por ataque: **Resisted** · **Clarified** · **Extended** · **Contradicted** (Forced concession).

---

## Criterio de salida

IOV-002 **termina** cuando **todas** las propuestas están clasificadas:

- Rechazadas (Resisted)  
- Clarified  
- Extended  
- Contradicted  

**No quedan hallazgos abiertos.**

Si hay Contradicted → VR → MC **antes** de RC (rompe mentalidad de “añadir por gusto”: solo evidencia).

---

## Plantilla SF

```markdown
## SF-xxx — [Título]

| Campo | Valor |
|-------|-------|
| Objetivo forzado | Core nuevo · Invariant · Dependency · Lifecycle |
| Escenario (dominio) | 3–8 líneas |
| Resultado | Resisted · Clarified · Extended · Contradicted |
| Cita corpus (si Resisted) | ruta |
| Hipótesis de cambio (si Forced) | sin editar 17 aquí |
```

Registro: [structural-findings](./04-findings/structural-findings.md).

---

## Estado

| IOV-002 | ⏳ / ✅ ver [IVR](./ivr/README.md) |

---

## Relacionado

- [IOV-003](./03-independent-implementation.md)  
- [05 Protocol](./05-experimental-protocol.md)
