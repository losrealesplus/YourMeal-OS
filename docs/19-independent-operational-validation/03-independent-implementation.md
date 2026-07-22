# IOV-003 · Independent Implementation

**Pregunta que intenta responder:**

> **¿Dos arquitecturas técnicas independientes representan el mismo Operational Model?**

Aquí desaparece la teoría: solo queda si el modelo es **interpretable de forma consistente**.

---

## Material

Exactamente el [KCM](./kcm/README.md) de la sesión (típicamente el mismo que IOV-001 o un KCM-00x versionado).

Sin código de producto como plantilla obligatoria.  
Sin que los autores «corrijan» el diseño a mitad.  
Protocolo: [05](./05-experimental-protocol.md).

---

## Tarea

**Dos desarrolladores** (o dos equipos) distintos.

Sin hablar entre ellos.

Diseñan una **arquitectura técnica** que traduzca el Operational Model.

- **No** implementan.  
- **Solo** diseñan (módulos, agregados, límites, eventos, máquinas de estado técnicas, persistencia a alto nivel).

Entregable típico: diagrama + 1–3 páginas de decisiones de mapeo Modelo → diseño.

---

## Qué medimos

**No** calidad técnica (ni Clean Architecture «mejor»).

Medimos **Consistency of Interpretation**:

| Señal | Ejemplo |
|-------|---------|
| Misma espina | Ambos: Order → Plan → Batch → Packaging → Route → Delivery → Payment |
| Divergencia de eslabón | Uno: Order → Batch; otro: Order → Recipe → Batch |
| Core inventado | Uno introduce «MealWave» como agregado raíz |
| Supporting mal promovido | Lot o Location tratados como eslabón de espina |
| Invariant ignorado | Packaging sin Batch |

Una divergencia es una **señal** — no necesariamente culpa del modelo.  
Puede ser de su **expresividad** (ambigüedad) o del diseñador (sesgo).

---

## Evidencia: Interpretation Findings (IF)

```text
IF-001

Título: Order→Batch vs Order→Recipe→Batch
Diseño A: …
Diseño B: …
Divergencia: eslabón / cardinalidad / estado / verbo
¿El modelo lo permite explícitamente? Sí / No / Ambiguo
Tipo: Ambiguity | Over-interpretation | Under-specification | Designer bias
Seguimiento: DF (docs) · VR (estructura) · ninguno
```

Registro: [04-findings](./04-findings/README.md).

---

## Resultado posible

| Resultado | Significado |
|-----------|------------|
| Arquitecturas alineadas en espina + INV | Alta consistencia de interpretación |
| Divergencias locales en Supporting | Aceptable si Taxonomy / level-2 lo anticipa |
| Divergencia en Dependency fundamental | Señal fuerte — expresividad o hueco → VR/DF |
| Un diseño inventa Core | Falla de transferibilidad estructural |

---

## Protocolo mínimo

1. Dos diseñadores independientes · mismo brief · mismo corpus.  
2. Tiempo acotado (p.ej. media jornada).  
3. Comparación ciega por facilitador (puede ser autor **solo** en la comparación, no durante el diseño).  
4. Cerrar IF-xxx.  
5. Sin merge de diseños «promedio» como verdad — la verdad sigue siendo el modelo.

---

## Estado

⏳ No ejecutado.

---

## Relacionado

- [Knowledge Validation Pyramid](./00-knowledge-validation-pyramid.md)  
- [Findings](./04-findings/README.md)
