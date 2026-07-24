# Sprint · RI-001 Readiness → Certification Mode

**Fecha:** 2026-07-24 (actualizado post-#52)  
**Tipo:** Gobernanza operativa · **certificación** — **prohibido** abrir PRs de nuevas capacidades  
**Objetivo:** Demostrar con evidencia que EatClean puede operar una jornada real en YourMeal OS.  
**Distinción clave:** terminar funcionalidades ≠ certificar que el sistema está listo para operar.

> Pregunta anterior: ¿Qué falta por construir?  
> Pregunta ahora: **¿Podemos demostrar, con evidencia, que EatClean puede trabajar con YourMeal OS durante una jornada real?**

Artefacto primario: [RI001_FUNCTIONAL_COMPLETENESS_MATRIX](./RI001_FUNCTIONAL_COMPLETENESS_MATRIX.md)  
Patrón: [DICT-072](../05-architecture/OPERATIONAL_REPRESENTATION_PATTERN.md) · Visibilidad: [DICT-071](../20-evidence-framework/09-operational-visibility-principle.md)

Packaging (EP-002B.3) y Delivery (EP-002B.4) permanecen **en cola** hasta cerrar certificación.

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

### 1 · Functional Completeness Review

Matriz viva: [RI001_FUNCTIONAL_COMPLETENESS_MATRIX](./RI001_FUNCTIONAL_COMPLETENESS_MATRIX.md).

Por pantalla: Visible · Navega · Guarda · Lee · RBAC · Audit · Estado.

### 2 · Centro de Operaciones (único hueco arquitectónico visible)

[OPS_CENTER_DUAL_SURFACE](./OPS_CENTER_DUAL_SURFACE.md)

```text
EatClean Ops  →  opera el negocio (tenant)
YourMeal OS   →  administra la plataforma (SaaS)
```

Sin mezclar navegación, branding ni permisos.

### 3 · Validación RBAC

Positivo **y** negativo por perfil (Cliente · Empresa · Cocina · Reparto · Support · Admin · Finanzas · Company Admin · SaaS Admin). Ver matriz.

### 4 · Recorrido E2E (guion)

```text
Cliente → Registro → Login → Menú → Pedido → Confirmación → Próxima entrega
  → Kitchen Queue → Kitchen Execution → Hoja Producción
  → Packaging* → Delivery* → Entrega → Historial → Repetir
```

\* Pendiente — no fingir. Fallo = Operational Finding.

### 5 · Evidence Collection

Clasificar antes de corregir:

| Tipo | Ejemplo |
|------|---------|
| Operational Finding | Cocina necesita agrupar por temperatura |
| Knowledge Gap | Faltan reglas para pedidos de empresa |
| UX Finding | Cliente no entiende cuándo llega el pedido |
| Engineering Defect | Botón no persiste |
| Data Issue | Estado incorrecto |
| Security Finding | Permiso excesivo |

Log en la matriz de completitud.

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
