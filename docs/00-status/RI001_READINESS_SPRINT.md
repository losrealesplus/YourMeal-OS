# Sprint · RI-001 Readiness → Certification Mode

**Fecha:** 2026-07-24 (actualizado post-#52)  
**Tipo:** Gobernanza operativa · **certificación** — **prohibido** abrir PRs de nuevas capacidades  
**Objetivo:** Demostrar con evidencia que EatClean puede operar una jornada real en YourMeal OS.  
**Distinción clave:** terminar funcionalidades ≠ certificar que el sistema está listo para operar.

> Pregunta anterior: ¿Qué falta por construir?  
> Pregunta ahora: **¿Podemos demostrar, con evidencia, que EatClean puede trabajar con YourMeal OS durante una jornada real?**

**Artefacto diario:** [Release Board · EP-OPS-001](./EP_OPS_001_RELEASE_BOARD.md) — eliminar bloqueos, no roadmap  
Spec de corrección: [EP_OPS_001_OPERATIONAL_CENTER_READINESS](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md)  
Matriz (bloque Ops primero): [RI001_FUNCTIONAL_COMPLETENESS_MATRIX](./RI001_FUNCTIONAL_COMPLETENESS_MATRIX.md)  
Patrón: [DICT-072](../05-architecture/OPERATIONAL_REPRESENTATION_PATTERN.md) · Visibilidad: [DICT-071](../20-evidence-framework/09-operational-visibility-principle.md) · Autonomía: [DICT-073](../05-architecture/TENANT_OPERATIONAL_AUTONOMY.md)

Packaging (EP-002B.3) y Delivery (EP-002B.4) permanecen **en cola**.  
FCR del resto: **en pausa** hasta Ops PASS.  
Tras Ops PASS: **Architecture Freeze** → FCR → RBAC → E2E → Evidence → RRR → RI-001.

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

Board: [EP_OPS_001_RELEASE_BOARD](./EP_OPS_001_RELEASE_BOARD.md)

| Bloqueador | Contenido |
|------------|-----------|
| 🔴 B1 | Centro de Operaciones EatClean `/admin` |
| 🔴 B2 | Centro de Gobierno YourMeal OS `/saas` (DICT-073) |
| 🔴 B3 | Jornada Operativa Completa |
| Day-0 | Tenant vacío → ciclo operativo autónomo (demo pública) |

WPs de corrección (detalle): [EP-OPS-001](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md) · Gap: [OPS_CENTER_DUAL_SURFACE](./OPS_CENTER_DUAL_SURFACE.md)

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
