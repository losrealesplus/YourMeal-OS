# 05 · Experimental Protocol (IOV)

Fortalece el **protocolo experimental** sin cambiar la arquitectura de IOV-001…003.

Arquitectura: [README](./README.md).  
Corpus: [KCM](./kcm/README.md).

---

## Espíritu de la fase

> **Si un evaluador necesita preguntar al autor para completar correctamente un escenario, el conocimiento todavía reside parcialmente en las personas y no completamente en el modelo.**

---

## P0 — Congelar el corpus

Antes de IOV-001: publicar [Knowledge Corpus Manifest](./kcm/README.md) (p.ej. [KCM-001](./kcm/KCM-001-iov001-pilot.md)).

Sin KCM → no hay experimento reproducible.

---

## P0 — Prohibición de conocimiento implícito

> El evaluador **solo** puede utilizar información presente en el corpus entregado.

**No puede asumir:**

- cómo funciona EatClean;
- cómo piensa un autor del modelo;
- cómo funcionan otros ERPs / kitchens software.

Todo supuesto debe **citar una fuente del corpus** (ruta + sección).

Si no puede citarse → registrar **DF** (tipo `Implicit assumption` o `Missing source`).

---

## P1 — Transferability Score

Tras la sesión, el facilitador calcula una puntuación comparable entre años:

```text
Transferability Score
─────────────────────
Comprensión:         ___%
Interpretación:      ___%
Consistencia:        ___%
Ambigüedad:          ___%   (menor = mejor)
Información perdida: ___%   (menor = mejor)
```

| Dimensión | Cómo estimar (IOV-001) |
|-----------|-------------------------|
| Comprensión | % del escenario narrado con objetos/transiciones correctos |
| Interpretación | % de términos usados en sentido canónico |
| Consistencia | Alineación interna del relato (sin contradicciones propias) |
| Ambigüedad | Fracción de pasos con duda / doble lectura |
| Información perdida | Pasos que requirieron inventar o omitir sin fuente |

No es marketing. Es **comparabilidad** IOV-001 ↔ IOV-001+1 año.

Plantilla de cierre: sección al final de este doc.

---

## P1 — Evidencia negativa (lo que funcionó)

No registrar únicamente dudas.

Registrar también lo que el evaluador **resolvió correctamente sin preguntar**:

```text
No necesitó preguntar / citó corpus con acierto:

✓ Amend Order
✓ Packaging
✓ Payment
✓ Route
…
```

La **ausencia de fricción** también es evidencia de transferencia.

---

## P2 — Tiempo de localización

Medir tiempos (cronómetro o log):

```text
Tiempo hasta localizar:
Lifecycle ............ ___ s
Invariant ............ ___ s
Core Object .......... ___ s
Supporting ........... ___ s
Dynamics / Checks 2.0  ___ s
```

No porque el tiempo sea el KPI.  
Porque revela **organización documental** (Navigation DFs).

---

## P2 — Confianza del evaluador

Al cerrar, **una** pregunta:

> ¿Qué nivel de confianza tienes en que tu solución es correcta? (0–100%)

Comparar con el dictamen del facilitador (DF / aciertos).

| Patrón | Lectura |
|--------|---------|
| Confianza alta + muchos DF | **Falsa claridad** — docs parecen claras y no lo son |
| Confianza baja + pocos DF | Modelo usable pero intimidante / denso |
| Confianza ≈ acierto | Calibración sana |

---

## P3 — Impossible Finding

Categoría de máxima gravedad:

```text
Impossible Finding (IFD)
```

El evaluador declara:

> «No puedo responder porque el modelo no contiene suficiente información.»

No es un DF de navegación.  
Es **interrupción completa** de la transferencia.

| Campo | Valor |
|-------|-------|
| Prefijo | **IFD-xxx** (o DF tipo `Impossible`) |
| Severidad | Critical |
| Seguimiento | Casi siempre → Classification → posible VR |

Registro: [04-findings](./04-findings/README.md).

---

## Filtro Finding → Classification → VR → MC

```text
Finding
    ↓
Classification
    ↓
    ├─ Navigation / Missing cross-link / Timing
    │      → docs only (sin VR)
    ├─ Ambiguity / Overloaded term / False friend
    │      → valorar VR
    ├─ Impossible Finding
    │      → VR (casi siempre)
    └─ Structural (SF) / Interpretation grave (IF)
           → VR → MC si procede
```

**No todos los Findings llegan a Validation Report.**  
Eso reduce ruido y protege el gobierno VR→MC.

Detalle: [04-findings](./04-findings/README.md).

---

## Orden de ejecución recomendado

### 1. Piloto IA (ciego) — antes del humano

> No usar todavía un ingeniero humano para depurar el protocolo.

1. Conversación **nueva**, sin memoria del proyecto.  
2. Entregar **solo** el corpus del KCM + escenario sencillo.  
3. Aplicar silencio de autores · citas obligatorias · tiempos · confianza.  
4. Ajustar clasificación DF / KCM / organización docs.

Si el protocolo funciona en ciego → entonces ingeniero independiente.

### 2. IOV-001 humano

Mismo KCM (o KCM-00x nuevo versionado) · mismo protocolo.

### 3. IOV-002 / IOV-003

Tras protocolo estable.

---

## Hoja de cierre de sesión (plantilla)

```markdown
# IOV Session Close — [KCM-xxx · fecha]

## Transferability Score
| Dimensión | % |
|-----------|---|
| Comprensión | |
| Interpretación | |
| Consistencia | |
| Ambigüedad | |
| Información perdida | |

## Evidencia negativa (aciertos sin fricción)
- ✓ …

## Tiempos de localización
| Artefacto | s |
|-----------|---|
| Lifecycle | |
| Invariant | |
| Core Object | |
| Supporting | |

## Confianza del evaluador
__ % · Calibración: sana / falsa claridad / intimidación

## Findings
DF-… · IFD-… · (clasificación → docs / VR)

## Decisión
- [ ] Solo docs
- [ ] Abrir VR
- [ ] Repetir piloto tras ajuste de corpus
```

---

## Relacionado

- [KCM](./kcm/README.md)  
- [IOV-001](./01-comprehension-validation.md)  
- [Findings](./04-findings/README.md)
