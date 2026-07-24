# Sprint · RI-001 Readiness → Certification Mode

**Fecha:** 2026-07-24 (actualizado post-#52)  
**Tipo:** Gobernanza operativa · **certificación** — **prohibido** abrir PRs de nuevas capacidades  
**Objetivo:** Completar [Certification Sprint](./CERTIFICATION_SPRINT.md) y emitir [RI-001 Certification Report](./RI001_CERTIFICATION_REPORT.md).  
**Fase:** Certificación operacional · [CG-RI-001](./RI001_CERTIFICATION_GATE.md)  
**CHECK-IT:** [04 PASS](./CHECK_IT_04_RBAC_HARDENING.md) · [05 NOT READY](./CHECK_IT_05_EVIDENCE_AUDIT.md)  
**Congelación:** no nuevos principios / DICT / EP metodológicos hasta cerrar RI-001.

> Antes: ¿Qué falta por implementar?  
> Ahora: **¿Qué evidencia falta para decidir RI-001?** (CHECK-IT 05 lo confirma)

Diario: [cierre 2026-07-24](../99-internal/development-journal/2026-07-24-cierre-jornada-certificacion.md)  
**Gate / Sprint / Report:** [CG-RI-001](./RI001_CERTIFICATION_GATE.md) · [CERTIFICATION_SPRINT](./CERTIFICATION_SPRINT.md) · [Report](./RI001_CERTIFICATION_REPORT.md)  
**Board:** [EP_OPS_001_RELEASE_BOARD](./EP_OPS_001_RELEASE_BOARD.md) · **ORS / OCM:** [ORS-001](./ORS_001_OPERATIONAL_REFERENCE_SCENARIO.md) · [OCM-001](./EATCLEAN_OPERATIONAL_STRUCTURE.md)

Capas: FON AI → FOPEBA → Knowledge → YourMeal OS → CG-RI-001 → EatClean.  
Implementación RI-001: ✅ · Evidencia: 🟡 · Certificación: 🟡.

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
