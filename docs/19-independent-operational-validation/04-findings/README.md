# Findings — evidencia IOV

Los tres niveles de IOV generan **tres tipos de evidencia**.  
Ninguno es un Model Change. Ninguno edita `17` por sí solo.

| Nivel | Pregunta | Evidencia | Prefijo |
|-------|----------|-----------|---------|
| IOV-001 | ¿Se entiende? | Documentation Findings | **DF-xxx** |
| IOV-002 | ¿Resiste ataques? | Structural Findings | **SF-xxx** |
| IOV-003 | ¿Se implementa igual? | Interpretation Findings | **IF-xxx** |

```text
Finding (DF / SF / IF)
        ↓
¿Exige cambio estructural del modelo?
        │
        ├─ No → mejorar docs / navegación / ejemplos (opcional)
        └─ Sí → VR → MC → 17 (mismo gobierno que FASE 5)
```

---

## Índices

| Tipo | Archivo |
|------|---------|
| Documentation Findings | [documentation-findings.md](./documentation-findings.md) |
| Structural Findings | [structural-findings.md](./structural-findings.md) |
| Interpretation Findings | [interpretation-findings.md](./interpretation-findings.md) |

---

## Anti-patrones

- Tratar un DF de navegación como «nuevo Core Object».  
- Aplicar MC desde un SF sin VR.  
- Usar IF para elegir «el diseño favorito del autor» como modelo.  
- Mezclar IOV con Discovery (no se buscan features).

---

## Relacionado

- [IOV README](../README.md)  
- [06 Model Changes](../../18-operational-validation/06-model-changes/README.md)
