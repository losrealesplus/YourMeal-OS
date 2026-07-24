# Sprint · RI-001 Readiness → Certification Mode

**Fecha:** 2026-07-24 (actualizado post-#52)  
**Tipo:** Gobernanza operativa · **certificación** — **prohibido** abrir PRs de nuevas capacidades  
**Objetivo:** Demostrar con evidencia que EatClean puede operar una jornada real en YourMeal OS.  
**Distinción clave:** terminar funcionalidades ≠ certificar que el sistema está listo para operar.

> Pregunta anterior: ¿Qué falta por construir?  
> Pregunta ahora: **¿Podemos demostrar, con evidencia, que EatClean puede trabajar con YourMeal OS durante una jornada real?**

Artefacto primario (ahora): [EP-OPS-001 Operational Center Readiness](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md)  
Matriz (bloque Ops primero): [RI001_FUNCTIONAL_COMPLETENESS_MATRIX](./RI001_FUNCTIONAL_COMPLETENESS_MATRIX.md)  
Patrón: [DICT-072](../05-architecture/OPERATIONAL_REPRESENTATION_PATTERN.md) · Visibilidad: [DICT-071](../20-evidence-framework/09-operational-visibility-principle.md)

Packaging (EP-002B.3) y Delivery (EP-002B.4) permanecen **en cola**.  
FCR del resto de módulos: **en pausa** hasta Ops Center PASS.

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

## Prioridades (orden estricto)

### 0 · EP-OPS-001 · Operational Center Readiness ← **AHORA**

El Centro de Operaciones es **requisito de certificación**, no una feature más.  
Spec: [EP_OPS_001_OPERATIONAL_CENTER_READINESS](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md) · Gap: [OPS_CENTER_DUAL_SURFACE](./OPS_CENTER_DUAL_SURFACE.md).

Hasta PASS del hub: no continuar FCR amplio ni E2E completo.

### 1 · Functional Completeness Review (resto)

Matriz viva: [RI001_FUNCTIONAL_COMPLETENESS_MATRIX](./RI001_FUNCTIONAL_COMPLETENESS_MATRIX.md) — filas no-hub **⏸** hasta Ops PASS.

Por pantalla: Visible · Navega · Guarda · Lee · RBAC · Audit · Estado.

### 2 · Dual surface (incluido en EP-OPS-001)

EatClean `/admin` vs YourMeal OS `/saas` — sin mezclar nav, branding ni permisos.

### 3 · Validación RBAC

Positivo **y** negativo por perfil — evidencia en EP-OPS-001 y matriz.

### 4 · Recorrido E2E (guion)

Tras hub PASS:

```text
Cliente → … → Kitchen Queue → Kitchen Execution → Hoja
  → Packaging* → Delivery* → Entrega → Historial → Repetir
```

### 5 · Evidence Collection

Clasificar antes de corregir (tabla en la matriz).

---

## Fase 9 · Release Readiness Review

Última puerta antes de declarar listo para RI-001:

```text
□ main compila sin errores
□ Migraciones aplicadas (favorites + kitchen_production_batches)
□ Variables de entorno documentadas
□ Feature Flags revisadas
□ RLS/RBAC validado (positivo + negativo)
□ Cero PRs funcionales abiertos
□ Matriz de completitud sin ⏳ críticos en alcance
□ Docs EP / CURRENT_PHASE = estado real
□ Roadmap: Packaging/Delivery en cola (honesto)
```

---

## Definition of Done

- [ ] Certificación ejecutada (prioridades 1–5).
- [ ] Hallazgos clasificados FOPEBA.
- [ ] Release Readiness Review ✅.
- [ ] `main` estable → **iniciar RI-001** como consecuencia natural, no como salto de fe.
