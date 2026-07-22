# KU-03 · Knowledge Update Report (KUR)

Cada actualización del conocimiento genera un informe.  
Sin KUR, el cambio **no** existe para FOPEBA.

---

## Plantilla KUR-xxx

```markdown
# KUR-xxx — [Título]

**Fecha:** YYYY-MM-DD  
**Organización / período:** EatClean · …  
**FER:** FER-…  
**KC:** KC-… / —  
**FO de origen:** FO-…  
**Decisión:** Archive · Docs-only · Model Change · Aparcar · Null (sin candidatos)

## 1. Evidencia

| FO | Código | Resumen |
|----|--------|---------|
| FO-… | FO-E / FO-C | … |

## 2. Knowledge State afectado

| Afirmación / elemento | KS antes | KS después |
|-----------------------|----------|------------|
| … | Validated / … | … |

## 3. ECL

| Elemento | ECL antes → después |
|----------|---------------------|
| … | 3 → 4 |

## 4. Stability

| Elemento | S antes → después |
|----------|-------------------|
| … | S2 → S1 |

## 5. Impacto

(resumen del Impact Analysis — objetos, invariants, capabilities)

## 6. Decisión

- [ ] Archive — motivo: …
- [ ] Docs-only — rutas: …
- [ ] Model Change — MC-… · VR-…
- [ ] Aparcar hasta — fecha · owner
- [ ] Null — FER sin candidatos; corpus RC intacto

## 7. Listo para EC

- [ ] Sin FO-C estructural abierto sin decisión
- [ ] Capabilities ancladas al modelo resultante
- [ ] Known Limitations actualizadas si aplica
```

---

## KUR-null

Cuando FER decide «No abrir KU»:

```markdown
# KUR-null-yyy — Sin actualización post-FER

**FER:** …  
**Decisión:** Null  
**Motivo:** FO solo FO-V / FO-U · o FO-E no material  
**Corpus:** RC intacto  
**Listo para EC:** Sí
```

---

## Índice

### Knowledge Candidates

| ID | Título | FO | Estado |
|----|--------|-----|--------|
| — | *(vacío hasta FER)* | | ⏸ |

### Knowledge Update Reports

| ID | Título | Decisión | Estado |
|----|--------|----------|--------|
| — | *(vacío hasta ejecución)* | | ⏸ |

---

## Relacionado

- [01 Policy](./01-policy.md)  
- [02 Workflow](./02-workflow.md)  
- [reports/](../reports/README.md)
