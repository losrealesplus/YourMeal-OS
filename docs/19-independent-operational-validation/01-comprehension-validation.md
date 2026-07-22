# IOV-001 · Comprehension Validation

**Pregunta que intenta responder:**

> **¿Un ingeniero independiente entiende el modelo sin ayuda?**

No queremos que lo critique.  
Queremos saber si puede **utilizarlo**.

Protocolo completo: [05 Experimental Protocol](./05-experimental-protocol.md).  
Corpus: [KCM](./kcm/README.md) — sin KCM no se ejecuta.

---

## Material permitido

**Solo** lo listado en el Knowledge Corpus Manifest de la sesión (p.ej. [KCM-001](./kcm/KCM-001-iov001-pilot.md)).

Típicamente: gramática del Operational Model bajo `docs/17-operational-model/`.

**Nada más.**  
Sin Discovery, VS/VR/MC, Diario, PRs, explicaciones orales.

---

## Reglas P0

### Silencio de autores

Los autores **no responden** preguntas. Atascarse es dato.

### Prohibición de conocimiento implícito

Solo información del corpus.  
Todo supuesto cita ruta del KCM.  
Sin cita → DF (`Implicit assumption`).

---

## Tarea

Resolver un **escenario operacional sencillo** (no hostil).

Narrar solo con vocabulario y transiciones del modelo.

---

## Qué medimos

| Señal | Dónde |
|-------|-------|
| Dudas / malas interpretaciones / no encontrado | DF |
| Aciertos sin preguntar | Evidencia negativa |
| Tiempos de localización | Protocolo P2 |
| Confianza 0–100% vs acierto | Calibración / falsa claridad |
| Interrupción total | Impossible Finding (IFD) |
| Score agregado | Transferability Score |

**No** medimos solo si «acertó el final».

---

## Evidencia

- Documentation Findings (DF)  
- Impossible Findings (IFD)  
- Transferability Score + hoja de cierre  

Registro: [04-findings](./04-findings/README.md).

---

## Classification → ¿VR?

| Tipo DF | ¿VR? |
|---------|------|
| Navigation · Missing cross-link | No — docs |
| Ambiguity · Overloaded · False friend | Valorar VR |
| Implicit assumption | Docs o VR si estructural |
| Impossible | Casi siempre VR |

---

## Protocolo de sesión (checklist)

1. Congelar y firmar **KCM**.  
2. Preferible: **piloto IA ciego** antes de humano.  
3. Entregar solo corpus + escenario.  
4. Cronometrar localización · anotar aciertos y dudas · silencio total.  
5. Pregunta de confianza 0–100%.  
6. Classification de Findings · Transferability Score.  
7. Sin MC en la misma sesión.

---

## Estado

⏳ No ejecutado — protocolo listo · KCM-001 pendiente de commit ancla al lanzar piloto.

---

## Relacionado

- [05 Experimental Protocol](./05-experimental-protocol.md)  
- [IOV-002](./02-adversarial-validation.md)
