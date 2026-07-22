# Findings — evidencia IOV

Los tres niveles de IOV generan evidencia.  
Ninguno es un Model Change. Ninguno edita `17` por sí solo.

| Nivel | Pregunta | Evidencia | Prefijo |
|-------|----------|-----------|---------|
| IOV-001 | ¿Se entiende? | Documentation Findings | **DF-xxx** |
| IOV-001 | ¿Interrupción total? | Impossible Findings | **IFD-xxx** |
| IOV-002 | ¿Resiste ataques? | Structural Findings | **SF-xxx** |
| IOV-003 | ¿Se implementa igual? | Interpretation Findings | **IF-xxx** |

---

## Filtro obligatorio

```text
Finding
    ↓
Classification
    ↓
    ├─ Navigation / Missing cross-link / Timing
    │      → docs only (reorganizar · enlazar) — SIN VR
    ├─ Ambiguity / Overloaded term / False friend / Implicit assumption
    │      → valorar VR
    ├─ Impossible Finding (IFD)
    │      → VR (casi siempre)
    └─ Structural (SF) / Interpretation grave (IF)
           → VR → MC si procede
```

**No todos los Findings llegan a Validation Report.**  
Reduce ruido; protege el gobierno VR→MC.

---

## Impossible Finding

El evaluador no puede completar el escenario porque **el corpus no contiene información suficiente** (y lo declara).

Severidad: **Critical**.  
No es un fallo de navegación: es fallo de transferencia completa.

Plantilla en [documentation-findings.md](./documentation-findings.md) (sección IFD).

---

## Índices

| Tipo | Archivo |
|------|---------|
| Documentation Findings | [documentation-findings.md](./documentation-findings.md) |
| Structural Findings | [structural-findings.md](./structural-findings.md) |
| Interpretation Findings | [interpretation-findings.md](./interpretation-findings.md) |

---

## Anti-patrones

- DF de Navigation → inventar Core Object.  
- Todo Finding → VR automático.  
- SF → MC sin VR.  
- Ignorar evidencia negativa (aciertos).  
- Evaluar sin [KCM](../kcm/README.md).

---

## Relacionado

- [05 Experimental Protocol](../05-experimental-protocol.md)  
- [06 Model Changes](../../18-operational-validation/06-model-changes/README.md)
