# Sprint · RI-001 Readiness → Certification Mode

**Fecha:** 2026-07-24 (actualizado post-#52)  
**Tipo:** Gobernanza operativa · **certificación** — **prohibido** abrir PRs de nuevas capacidades  
**Objetivo:** Emitir [RI-001 Certification Report](./RI001_CERTIFICATION_REPORT.md) con decisión READY / RWO / NOT READY.  
**Fase:** Certificación operacional · [CG-RI-001](./RI001_CERTIFICATION_GATE.md)  
**Congelación:** no nuevos principios / DICT / EP metodológicos hasta cerrar RI-001.

> Antes: ¿Qué falta por implementar?  
> En el Gate: **¿Qué evidencia falta para decidir RI-001?**  
> Evidencia (DICT-006): escenario operacional ejecutado y documentado — no opinión ni código solo.

**Gate:** [RI001_CERTIFICATION_GATE](./RI001_CERTIFICATION_GATE.md) · salidas objetivas READY / RWO / NOT READY  
**Informe:** [RI001_CERTIFICATION_REPORT](./RI001_CERTIFICATION_REPORT.md) ← siguiente gran entregable  
**Board:** [EP_OPS_001_RELEASE_BOARD](./EP_OPS_001_RELEASE_BOARD.md)  
**ORS / OCM:** [ORS-001](./ORS_001_OPERATIONAL_REFERENCE_SCENARIO.md) · [OCM-001](./EATCLEAN_OPERATIONAL_STRUCTURE.md)  
Spec hub: [EP_OPS_001](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md) · Matriz: [FCR](./RI001_FUNCTIONAL_COMPLETENESS_MATRIX.md)

Capas: FON AI → FOPEBA → Knowledge → YourMeal OS → CG-RI-001 → EatClean.  
EP-OPS-001 = entrada al Gate. Tras PASS: Freeze → carriles → **Certification Report** → cosecha FOPEBA.

---

## Estado de la pila de ingeniería (saneada)

| PR | Tema | Decisión |
|----|------|----------|
| #45 | Historial + Repetir | ✅ Merged |
| #46 | Hoja de Producción | ✅ Merged |
| #47 | Customer Preferences | ✅ Merged |
| #48 | Kitchen Execution | ✅ Merged — aplicar migración `kitchen_production_batches` |
| #49 | DICT-072 (stack antigua) | ✅ Merged / superseded por #52 |
| #50 | Readiness (stack) | ❌ Closed superseded |
| #51 | DICT-072 → main | ❌ Closed superseded |
| #52 | Readiness + DICT-072 | ✅ Merged — docs de certificación en `main` |

**No quedan PRs funcionales abiertos.** No abrir más features hasta Release Readiness Review.

---

## Release Board · eliminar bloqueadores (entrada al Gate)

Board: [EP_OPS_001_RELEASE_BOARD](./EP_OPS_001_RELEASE_BOARD.md) · Gate: [CG-RI-001](./RI001_CERTIFICATION_GATE.md)

| Bloqueador | Evidencia | Estado |
|------------|-----------|:------:|
| `/admin` Operativo | FCR + EP-OPS-001 | 🔴 |
| `/saas` Gobierno | Tenant Provisioning | 🔴 |
| Jornada completa | ORS-001 ejecutado | 🔴 |
| Observability | KPIs + auditoría | 🔴 |
| RRR | Checklist | ⚪ |

Pregunta diaria: **¿qué bloqueador eliminamos hoy?**

Hasta EP-OPS-001 PASS: no FCR amplio ni E2E completo del Gate.

---

## Secuencia · Certification Gate

```text
EP-OPS-001 PASS → Architecture Freeze
        │
        ▼
RI-001 CERTIFICATION GATE
  FCR · RBAC · Observability · ORS-001 · Evidence · RRR
        │
        ▼
READY | READY WITH OBSERVATIONS | NOT READY
```

Durante Freeze: ❌ módulos / patrones / capacidades nuevas · ✅ defectos que producen evidencia · certificación.

Detalle: [RI001_CERTIFICATION_GATE](./RI001_CERTIFICATION_GATE.md) · cosecha FOPEBA post-decisión.

---

## Release Readiness Review

Última puerta antes de declarar listo para RI-001:

```text
□ main compila sin errores
□ Migraciones aplicadas (favorites + kitchen_production_batches)
□ Variables de entorno documentadas
□ Feature Flags revisadas
□ RLS/RBAC validado (positivo + negativo)
□ Cero PRs funcionales abiertos
□ Matriz de completitud sin ⏳ críticos en alcance
□ Docs EP / CURRENT_PHASE / Release Board = estado real
□ Packaging/Delivery en cola (honesto)
□ Day-0 Provisioning Scenario PASS (o evidencia de bloqueo clasificada)
```

---

## Definition of Done

- [ ] EP-OPS-001 PASS · Architecture Freeze activo.
- [ ] Carriles del Gate ejecutados con evidencia (DICT-006).
- [ ] ORS-001 PASS (o NOT READY documentado).
- [ ] [RI-001 Certification Report](./RI001_CERTIFICATION_REPORT.md) emitido (decisión + rationale + evidence).
- [ ] Decisión firmada (READY / RWO / NOT READY).
- [ ] Knowledge Harvest incorporado a FOPEBA (cierre formal RI-001).
- [ ] Congelación metodológica respetada durante la certificación.
