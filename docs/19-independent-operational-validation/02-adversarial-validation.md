# IOV-002 · Adversarial Validation

**Instrucción al evaluador:**

> **Destruye el modelo.**

No queremos colaboración.  
Queremos **oposición**.

---

## Pregunta que intenta responder

> **¿Cuál es el menor número de escenarios (en el dominio) necesarios para obligar al modelo a ceder estructuralmente?**

«Ceder» significa al menos una de:

- crear un **nuevo Core Object**;  
- **romper** un Invariant;  
- introducir un **Lifecycle completamente nuevo** (no una transición Dynamics);  
- cambiar una **Dependency fundamental** de la espina.

---

## Regla de dominio

No puede inventar un dominio distinto.

Debe permanecer dentro de **alimentación preparada** (comida que se planifica, cocina/ensambla, identifica, mueve y entrega/cobra).

Ejemplos válidos (mismo dominio, contextos distintos):

- Hospitales  
- Comida militar  
- Eventos deportivos  
- Catering aéreo  
- Prisiones / centros penitenciarios  
- Universidades  
- Guarderías · residencias · comedores industriales  

Fuera de dominio (inválido para IOV-002): SaaS genérico, e-commerce de productos secos sin operación de preparación, etc.

---

## Material

Mismo corpus que IOV-001 vía [KCM](./kcm/README.md) (versión propia si el ataque lo requiere).  
Protocolo: [05 Experimental Protocol](./05-experimental-protocol.md).

El evaluador **sí** puede conocer FASE 5 a alto nivel, pero el ataque se formula contra el modelo, no contra los autores. Todo supuesto de dominio debe poder narrarse con el corpus (prohibición de conocimiento implícito de EatClean/autores).

---

## Objetivo de economía

Buscar el **mínimo** de escenarios que fuercen una cesión estructural.

No un catálogo infinito de edge cases.  
Calidad de ataque > volumen.

---

## Evidencia: Structural Findings (SF)

```text
SF-001

Título: …
Ataque: (escenario adversario en 3–8 líneas)
Objetivo forzado: Core nuevo / Invariant / Lifecycle nuevo / Dependency
Resultado: Resisted | Forced concession | Inconclusive
Si Forced: qué habría que cambiar (hipótesis) — sin editar 17
Si Resisted: por qué el modelo ya lo narra (citar objetos / INV / transición)
```

Registro: [04-findings](./04-findings/README.md).

---

## Resultados posibles

```text
No encontré ninguna contradicción estructural.
```

→ Evidencia **extremadamente fuerte** (ataque independiente fallido).

```text
El modelo necesita un nuevo Core Object.
```

→ Primer **Contradicted** realmente independiente → abrir VR → (si procede) MC.

Otros: romper INV-… · Dependency espina · Lifecycle nuevo (no Amend/Hold ya cubiertos por Dynamics).

---

## Relación con FASE 5

| FASE 5 (VS) | IOV-002 |
|-------------|---------|
| Autores diseñan escenarios hostiles | Evaluador **independiente** ataca |
| Extended/Clarified sobre huecos de comportamiento | Busca **cesión estructural** |
| Dynamics absorbe muchos Extended | Dynamics no «salva» un Core ilegítimo |

Un Extended de FASE 5 ≠ victoria adversaria.  
Victoria adversaria = el modelo **no puede** narrar sin violar sus propias reglas o inventar Core.

---

## Protocolo mínimo

1. Evaluador independiente · dominio alimentación preparada.  
2. Brief: «Destruye el modelo; economía de escenarios; sin salir del dominio.»  
3. Informe SF-xxx.  
4. Si Forced concession → VR (no MC directo).

---

## Estado

⏳ No ejecutado.

---

## Relacionado

- [IOV-001 Comprehension](./01-comprehension-validation.md)  
- [IOV-003 Independent Implementation](./03-independent-implementation.md)  
- [05 Validation Reports](../18-operational-validation/05-validation-reports/README.md)
