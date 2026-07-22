# IOV-001 · Comprehension Validation

**Pregunta que intenta responder:**

> **¿Un ingeniero independiente entiende el modelo sin ayuda?**

No queremos que lo critique.  
Queremos saber si puede **utilizarlo**.

---

## Material permitido

Únicamente el [Operational Model](../17-operational-model/) y su gramática:

- Ubiquitous Language  
- Core Objects  
- Supporting Objects  
- Dependencies  
- Lifecycles (incl. Dynamics si forma parte del modelo publicado)  
- Invariants  

**Nada más.**  
Sin Discovery, sin VR de la batería, sin Diario, sin explicaciones orales, sin PRs de contexto.

---

## Regla de silencio

Los **autores permanecen completamente en silencio**.

No pueden responder preguntas.  
No pueden «aclarar un poco».  
Si el evaluador se atasca, eso **es** el dato.

---

## Tarea

Resolver un **escenario operacional sencillo**.

No uno hostil.  
Algo cotidiano (p.ej. confirmar un Order B2B, planificar el día, empaquetar y entregar una ruta corta).

El evaluador narra el escenario **solo** con el vocabulario y las transiciones del modelo.

---

## Qué medimos

**No** si «acierta».

Sí:

| Señal | Ejemplo |
|-------|---------|
| Dónde duda | Pausa larga ante Amend vs Cancel |
| Qué interpreta mal | Cree que Batch es Core de Stock |
| Qué busca y no encuentra | Índice de estados vs transiciones |
| Cuánto tarda | Tiempo hasta narrar el ciclo completo |

---

## Evidencia: Documentation Findings (DF)

IOV-001 **no** produce Model Changes.

Produce **Documentation Findings**:

```text
DF-001

Título: Lifecycle difícil de localizar
Tipo: Navigation
Severidad: Medium
Contexto: IOV-001 · escenario cotidiano X
Observación: …
Impacto en uso: …
¿Sugiere cambio de docs? Sí / No (sin editar 17 aquí)
```

Tipos típicos: `Navigation` · `Ambiguity` · `Missing cross-link` · `Overloaded term` · `False friend` · `Gap in example`.

Registro: [04-findings](./04-findings/README.md).

---

## Resultado posible

| Resultado | Significado |
|-----------|------------|
| Escenario narrado con fricción localizada | Modelo usable; DF abiertos para mejorar docs |
| Escenario imposible sin ayuda de autores | Transferibilidad débil — no listo para Certified |
| Malentendidos sistemáticos de un concepto | Señal fuerte de UL / Lifecycle / Naming |

Los DF pueden motivar mejoras de **navegación y claridad** (docs) o, si revelan ambigüedad estructural, un VR — nunca un parche silencioso.

---

## Protocolo mínimo (checklist)

1. Elegir evaluador **no autor** del modelo.  
2. Entregar solo rutas `docs/17-operational-model/` (y Dynamics bajo 17).  
3. Entregar escenario cotidiano por escrito.  
4. Cronometrar · anotar dudas · no intervenir.  
5. Cerrar con DF-xxx · sin MC en la misma sesión.

---

## Estado

⏳ No ejecutado (YourMeal OS · post-Beta).

---

## Relacionado

- [IOV-002 Adversarial](./02-adversarial-validation.md)  
- [Findings](./04-findings/README.md)
