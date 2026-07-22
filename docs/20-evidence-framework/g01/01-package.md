# G-01 Package

Expediente único. Sin package completo **no** hay sesión de gate.

---

## Contenido obligatorio

| # | Componente | Artefacto | Estado típico pre-campo |
|---|------------|-----------|-------------------------|
| 1 | **Operational Model RC** | [02-operational-model-rc](../../00-status/02-operational-model-rc.md) · tag | ✅ |
| 2 | **FOV Report** | Índice FO + resumen de campaña ([fov/](../fov/README.md)) | ⏳ ejecución |
| 3 | **Field Evidence Review** | FER-xxx | ⏳ |
| 4 | **Knowledge Update Report** | KUR-xxx o KUR-null ([ku/](../ku/README.md)) | ⏳ |
| 5 | **Economic Confirmation Report** | ECR de campaña ([ec/](../ec/README.md)) | ⏳ |
| 6 | **Open Risks** | Registro de riesgos críticos / materiales | ⏳ |
| 7 | **Known Limitations** | [03-known-limitations-rc](../../00-status/03-known-limitations-rc.md) actualizado post-FOV/KU | ✅ base |

Opcional de soporte (no sustituyen lo anterior):

- IVR-001 · 002 · 003  
- Acta Dual Track / Carril B scope  

---

## Checklist de integridad del package

- [ ] RC tag / commit ancla legible  
- [ ] FO clasificadas (incluye FO-V; no solo sorpresas)  
- [ ] FER con las 4 preguntas respondidas  
- [ ] KUR o KUR-null cerrado  
- [ ] ECR con dictamen Sí / Parcial / No  
- [ ] Open Risks: lista explícita (puede ser vacía)  
- [ ] Known Limitations alineadas al estado post-campo  

Si falta **uno** de los siete componentes → package **incompleto** → no se deliberar decisión APPROVED.

---

## Open Risks (plantilla)

```markdown
# Open Risks — G-01 Package

| ID | Riesgo | Severidad | Mitigación | ¿Bloquea APPROVED? |
|----|--------|-----------|------------|--------------------|
| OR-… | … | Critical / Material / Minor | … | Sí / No |
```

**Critical** abierto → solo **REJECTED** (o remediar antes).  
**Material** puede alimentar **APPROVED WITH CONDITIONS** si hay plan fechado.  
**Minor** se lista; no bloquea.

---

## Relacionado

- [02 Decision](./02-decision.md)
