# 07 · Gate G-01 · Operational Readiness

Parte del [Evidence Framework](./README.md).

Criterio **formal** para abrir la **Etapa 2 · Producto**.

---

## El matiz de gobernanza

> **G-01 no aprueba código.**  
> **Aprueba conocimiento suficiente para justificar código.**

No es un checklist de ingeniería de software.  
Es una decisión de **gobernanza del conocimiento**: ¿hemos reducido la incertidumbre lo bastante como para gastar implementación?

---

## Gate G-01 — Operational Readiness

Solo se supera si:

| # | Criterio | Evidencia |
|---|----------|-----------|
| 1 | ✅ Operational Model **Beta** | validation-coverage |
| 2 | ✅ Operational Validation completada | VS + VR + gap + Dynamics/MC |
| 3 | ✅ **FOV** completado (incl. intento de sorpresa) | FOR + FVR |
| 4 | ✅ **Knowledge Update** cerrado | KUR · sin Contradicted crítico abierto |
| 5 | ✅ **EC** completado | Matriz · impacto medido |
| 6 | ✅ Riesgos críticos documentados | SF · Contradicted · waivers |
| 7 | ✅ Roadmap **repriorizado según evidencia** | salida EC · ECL × Stability visibles |

Recomendado:

| # | Criterio | Evidencia |
|---|----------|-----------|
| 8 | IOV ejecutado | [19 IOV](../19-independent-operational-validation/README.md) |
| 9 | Críticos en **ECL-4+**; priorizados en **ECL-5**; evitar S0 en espina | [02](./02-evidence-confidence-levels.md) · [03](./03-stability-index.md) |

Solo entonces:

```text
Etapa 2 — Implementation
```

---

## Qué desbloquea / qué no

**Desbloquea:** UX · Capabilities de producto · código de espina · ejecución del roadmap por evidencia.

**No desbloquea:** reinventar el dominio · saltarse VR→MC · bajar ECL por conveniencia · “aprobar” un stack técnico concreto.

G-01 autoriza **gastar implementación** sobre conocimiento listo — no certifica la calidad del código futuro.

---

## Acta (extracto)

```markdown
# Gate G-01 — Operational Readiness

**Resultado:** PASS · FAIL · PASS con waiver

## Declaración de gobernanza

Este gate **no aprueba código**.
Aprueba que existe conocimiento suficiente (ECL / Stability / FOV / EC)
para justificar el inicio de Etapa 2.

- [ ] Model Beta
- [ ] Validation
- [ ] FOV + sorpresa documentada
- [ ] Knowledge Update (KUR)
- [ ] EC
- [ ] Riesgos
- [ ] Roadmap por evidencia
- [ ] IOV / umbrales ECL×S (si exigidos)
```

---

## Estado (YourMeal OS)

| Elemento | Estado |
|----------|--------|
| G-01 | 🔒 **No superado** |
| Etapa 2 | 🔒 Cerrada |

---

## Relacionado

- [Evidence Framework](./README.md)  
- [05 Knowledge Update](./05-knowledge-update.md)  
- [Estado](../00-status/README.md)
