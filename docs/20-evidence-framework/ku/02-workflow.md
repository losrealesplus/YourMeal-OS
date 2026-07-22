# KU-02 · Knowledge Update Workflow

```text
Field Observation (FO)
        ↓
Evidence Review (FER)
        ↓
Knowledge Candidate (KC)
        ↓
Impact Analysis
        ↓
    MC Required?
      ↓         ↓
     No         Sí
      ↓          ↓
   Archive    Model Change
   (KUR)      (VR → MC → KUR)
```

---

## Pasos

### 1. Field Observation

Clasificar FO-V / FO-E / FO-C / FO-U ([fov/03](../fov/03-field-observations.md)).

### 2. Evidence Review

FER responde las 4 preguntas ([fov/04](../fov/04-field-evidence-review.md)).  
Solo FO-E / FO-C con «sí a KU» pasan a candidato.

### 3. Knowledge Candidate (KC-xxx)

```markdown
# KC-xxx — [Título]

**FO:** …  
**FER:** …  
**Código FO:** FO-E / FO-C  
**Propuesta:** Extended · Clarified · Contradicted → ¿MC?

## 6 preguntas
1. ¿Qué observamos?
2. ¿Qué evidencia (FO / repetición)?
3. ¿Qué Knowledge State cambia?
4. ¿Qué ECL obtiene?
5. ¿Qué Stability tiene / tendrá?
6. ¿Necesita MC?
```

Índice de candidatos: en [03-kur](./03-kur.md) (tabla KC) hasta existir carpeta propia.

### 4. Impact Analysis

Antes de MC:

| Área | ¿Tocado? | Nota |
|------|----------|------|
| Core Objects | | |
| Supporting / Config | | |
| Aggregates | | |
| Dependencies | | |
| Lifecycles / Dynamics | | |
| Invariants / Checks | | |
| Capabilities / roadmap | | |
| Known Limitations RC | | |

Si el impacto es solo documental (navegación, naming) → Archive / docs-only en KUR, **sin** MC.

### 5. Decisión

| Decisión | Acción |
|----------|--------|
| **Archive** | KUR registra rechazo o «no material»; corpus intacto |
| **Docs-only** | KUR + cambio fuera de `17` (índices, Known Limitations nota) |
| **Model Change** | VR → MC → actualizar `17` → KUR cita MC |
| **Aparcar** | Fecha de revisión + owner; bloquea EC si es FO-C estructural |

### 6. Cierre

Emitir **KUR-xxx** (o **KUR-null** si FER no abrió candidatos).  
Actualizar KS / ECL / Stability tocados.  
Solo entonces → [Economic Confirmation](../06-economic-confirmation.md).

---

## Anti-patrones

- Editar `17` desde una FO suelta.  
- Saltar FER.  
- Usar EC para «arreglar» el modelo.  
- KUR vacío sin decisión explícita.

---

## Relacionado

- [01 Policy](./01-policy.md)  
- [06 Model Changes](../../18-operational-validation/06-model-changes/README.md)
