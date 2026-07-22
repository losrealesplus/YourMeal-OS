# 05 · Gate G-01 · Operational Readiness

Parte del [Evidence Framework](./README.md).

Criterio **formal** para abrir la **Etapa 2 · Producto**.

Hasta ahora el umbral informal era «Operational Model Beta».  
Eso valida estabilidad del modelo en mesa — **no** la promesa de FOPEBA de producir mejores productos.

---

## Gate G-01 — Operational Readiness

Solo se supera si:

| # | Criterio | Evidencia |
|---|----------|-----------|
| 1 | ✅ Operational Model **Beta** | [validation-coverage](../18-operational-validation/05-validation-reports/validation-coverage.md) |
| 2 | ✅ Operational Validation completada | VS + VR + gap + Dynamics/MC |
| 3 | ✅ **FOV** completado | FOR + Field Validation Report · sin Contradicted crítico abierto |
| 4 | ✅ **EC** (Economic Confirmation) completado | Matriz Capabilities · impacto medido |
| 5 | ✅ Riesgos críticos documentados | SF Forced · Contradicted · waivers |
| 6 | ✅ Roadmap **repriorizado según evidencia** | salida de EC · ECL visibles |

Recomendado (Etapa 1 madura / Certified):

| # | Criterio | Evidencia |
|---|----------|-----------|
| 7 | IOV ejecutado (001…003) | [19 IOV](../19-independent-operational-validation/README.md) |
| 8 | Capabilities críticas en **ECL-4+**; priorizadas en **ECL-5** donde EC aplica | [02 ECL](./02-evidence-confidence-levels.md) |

Solo entonces:

```text
Etapa 2 — Implementation
```

---

## Qué desbloquea G-01

- Diseño visual / UX anclado al modelo  
- Capabilities de producto  
- Código de dominio/aplicación de la espina  
- Roadmap ejecutado por prioridad EC  

Qué **no** desbloquea: reinventar el dominio, saltarse VR→MC, bajar ECL por conveniencia.

---

## Acta (plantilla)

```markdown
# Gate G-01 — Operational Readiness

**Fecha:** YYYY-MM-DD  
**Organización de referencia:** …  
**Resultado:** PASS · FAIL · PASS con waiver (detalle)

## Checklist

- [ ] Model Beta
- [ ] Operational Validation
- [ ] FOV (FVR)
- [ ] EC (matriz + Economic Confirmation Report)
- [ ] Riesgos críticos
- [ ] Roadmap por evidencia
- [ ] IOV (si exigido en esta versión del gate)
- [ ] ECL umbral

## Declaración

Se autoriza / no se autoriza el inicio de Etapa 2 bajo FOPEBA.

## Firmas / sesión

…
```

Índice de actas: [reports/](./reports/README.md).

---

## Estado (YourMeal OS)

| Elemento | Estado |
|----------|--------|
| G-01 | ⏳ **No superado** |
| Bloqueantes | FOV · EC · (IOV recomendado) |
| Etapa 2 | 🔒 Cerrada |

---

## Relacionado

- [Evidence Framework](./README.md)  
- [07 Certification](../18-operational-validation/07-certification.md)  
- [Estado](../00-status/README.md)
