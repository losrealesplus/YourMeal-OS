# Sprint · RI-001 Readiness → Certification Mode

**Fecha:** 2026-07-24 (actualizado post-#52)  
**Tipo:** Gobernanza operativa · **certificación** — **prohibido** abrir PRs de nuevas capacidades  
**Objetivo:** Demostrar que YourMeal OS puede operar una empresa real de alimentación **sin intervención del equipo de ingeniería**.  
**Distinción clave:** construir ≠ demostrar · arquitectura ya cerrada · cuello de botella = evidencia.

> Antes: ¿Qué falta por construir?  
> Ahora: **¿Puede operar EatClean? ¿Puede gobernarse YourMeal OS? ¿Puede completarse una jornada real?**

**Artefacto diario:** [Release Board · EP-OPS-001](./EP_OPS_001_RELEASE_BOARD.md) — 3 preguntas + Observability  
**Canon:** [OCM-001](./EATCLEAN_OPERATIONAL_STRUCTURE.md) (DICT-074) · ORS-001  
Spec: [EP_OPS_001_OPERATIONAL_CENTER_READINESS](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md)  
Matriz: [RI001_FUNCTIONAL_COMPLETENESS_MATRIX](./RI001_FUNCTIONAL_COMPLETENESS_MATRIX.md)  
DICT: [071](../20-evidence-framework/09-operational-visibility-principle.md) · [072](../05-architecture/OPERATIONAL_REPRESENTATION_PATTERN.md) · [073](../05-architecture/TENANT_OPERATIONAL_AUTONOMY.md) · [074](./EATCLEAN_OPERATIONAL_STRUCTURE.md)

Packaging / Delivery **en cola**. FCR **en pausa** hasta Ops PASS.  
Tras PASS: Architecture Freeze (lista explícita en Release Board) → FCR → RBAC → E2E (ORS-001) → Evidence → RRR → RI-001.

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

## Release Board · ahora (bloquea RI-001)

> **RI-001 está temporalmente bloqueado por EP-OPS-001.**  
> No por falta de módulos — por falta de operación certificable.

Board: [EP_OPS_001_RELEASE_BOARD](./EP_OPS_001_RELEASE_BOARD.md) · Canon: [OCM-001](./EATCLEAN_OPERATIONAL_STRUCTURE.md)

| Pregunta / elemento | Contenido |
|---------------------|-----------|
| 1 | ¿Puede operar EatClean? (Company Admin · `/admin`) |
| 2 | ¿Puede gobernarse YourMeal OS? (SaaS Admin · `/saas` · DICT-073) |
| 3 | ¿Puede completarse una jornada real? (ORS-001) |
| Transversal | Operational Observability (7 preguntas · no WP-7) |
| Day-0 | Tenant vacío → ciclo autónomo + Observability |

WPs: [EP-OPS-001](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md) · Gap: [OPS_CENTER_DUAL_SURFACE](./OPS_CENTER_DUAL_SURFACE.md)

Hasta PASS: no FCR amplio ni E2E completo.

---

## Secuencia post-PASS (estabilizada)

```text
EP-OPS-001 PASS
        │
        ▼
🔒 Architecture Freeze
        │
        ▼
Functional Completeness Review
        │
        ▼
RBAC Certification
        │
        ▼
End-to-End Operational Journey
        │
        ▼
Evidence Collection
        │
        ▼
Release Readiness Review
        │
        ▼
RI-001 Decision
```

Durante Freeze: ❌ módulos / patrones / capacidades nuevas · ✅ defectos · evidencia · certificación.

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

- [ ] EP-OPS-001 PASS (tabla DoD del Release Board).
- [ ] Architecture Freeze activo.
- [ ] FCR · RBAC · E2E · Evidence ejecutados.
- [ ] Release Readiness Review ✅.
- [ ] `main` estable → **iniciar RI-001** como consecuencia natural, no como salto de fe.
