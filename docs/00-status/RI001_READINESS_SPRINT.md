# Sprint · RI-001 Readiness

**Fecha:** 2026-07-24  
**Tipo:** Gobernanza operativa · **no** desarrollo de nuevas capacidades  
**Objetivo:** Cerrar la primera versión operacional de EatClean y dejar `main` listo para iniciar **RI-001**.  
**Distinción clave:** terminar funcionalidades ≠ certificar que el sistema está listo para operar.

> Packaging (EP-002B.3) y Delivery (EP-002B.4) quedan **en cola** hasta completar este sprint.  
> Patrón reutilizable: [DICT-072 Operational Representation](../05-architecture/OPERATIONAL_REPRESENTATION_PATTERN.md).

---

## Resultado del día

Al cerrar la jornada debe saberse exactamente:

- qué quedó **validado** para RI-001;
- qué queda **pendiente** (con clasificación FOPEBA);
- que `main` está **estable** y sin PRs funcionales bloqueantes.

---

## Fase 1 · Cerrar implementación (prioridad máxima)

### PRs a cerrar

| PR | Tema | Mergeable (2026-07-24) | Nota |
|----|------|------------------------|------|
| [#45](https://github.com/losrealesplus/YourMeal-OS/pull/45) | EP-002A.2 Historial + Repetir | CONFLICTING | Solo docs (`CURRENT_PHASE`, `EP002A_…`) — resolver y merge |
| [#46](https://github.com/losrealesplus/YourMeal-OS/pull/46) | EP-002B.1 Hoja de Producción | CONFLICTING | Código **ya incluido** en #48 (cherry-pick). Preferir: **cerrar #46** tras merge de #48, o resolver solo docs si se mergea antes |
| [#47](https://github.com/losrealesplus/YourMeal-OS/pull/47) | EP-002A.3 Preferencias / Favoritos | CLEAN | Merge tras #45 si hay solape Customer App |
| [#48](https://github.com/losrealesplus/YourMeal-OS/pull/48) | EP-002B.2 Kitchen Execution (+ B.1) | CLEAN | Incluye Hoja de Producción + Ejecución |
| [#49](https://github.com/losrealesplus/YourMeal-OS/pull/49) | DICT-072 + brief Packaging | CLEAN (base #48) | Docs; merge después de #48 |

### Orden recomendado de merge

```text
#45 → #47 → #48 → #49
         ↘ cerrar #46 como superseded por #48
```

### Checklist por PR

```text
□ Review técnico
□ Review funcional
□ Revisar migraciones
□ Resolver conflictos
□ Merge en main
□ Confirmar main estable (tsc / tests críticos)
```

**Resultado esperado:** no quedan PRs funcionales abiertos que bloqueen RI-001.

---

## Fase 2 · Functional Completeness Review

Recorrer **todas** las pantallas visibles. Por cada una:

| Chequeo | Criterio |
|---------|----------|
| Navega | Sin 404 / bucles |
| Guarda | CREATE real |
| Actualiza | UPDATE real |
| Elimina | Soft delete cuando aplica |
| Lee | Datos reales |
| RBAC | Rol correcto |
| Cero humo | Sin botones muertos, enlaces rotos ni datos ficticios |

Matriz viva:

- [EATCLEAN_PILOT_FUNCTIONAL_COMPLETENESS_REVIEW](./EATCLEAN_PILOT_FUNCTIONAL_COMPLETENESS_REVIEW.md)
- [EP001_FUNCTIONAL_COMPLETENESS_SPRINT](./EP001_FUNCTIONAL_COMPLETENESS_SPRINT.md)
- [PILOT_ACCEPTANCE_CHECKLIST](./PILOT_ACCEPTANCE_CHECKLIST.md)

Actualizar estados ✅ / 🟡 / ❌ solo con evidencia en entorno con migraciones aplicadas.

---

## Fase 3 · Dos Centros de Operaciones

Separación obligatoria antes de un segundo tenant.

### Centro de Operaciones EatClean (tenant)

Uso diario del negocio. Solo módulos del tenant. Ejemplo IA:

```text
Dashboard · Cocina · Producción · Reparto
Atención al Cliente · Administración · Configuración
```

### Centro de Operaciones YourMeal OS (plataforma)

Acceso discreto (p. ej. bajo *Powered by YourMeal OS*). **Solo `saas_admin`.**  
Administra la plataforma, no EatClean:

```text
Tenants · Administradores · Licencias · Branding
Auditoría global · Feature Flags · Config SaaS · Monitoring
```

```text
EatClean     →  Opera el negocio
YourMeal OS  →  Administra la plataforma
```

**Gap actual (código):** ver [OPS_CENTER_DUAL_SURFACE](./OPS_CENTER_DUAL_SURFACE.md).  
Corregir la separación es **Readiness / Correction**, no feature nueva de cocina.

---

## Fase 4 · Eliminación de humo (DICT-071)

Eliminar o Feature Flag OFF:

- botones sin función;
- menús sin contenido;
- acciones sin persistencia;
- gráficos con datos ficticios;
- pantallas vacías que parecen live.

---

## Fase 5 · Persistencia

Verificar en módulos del piloto: **CREATE · READ · UPDATE · DELETE (soft)**.

---

## Fase 6 · Validación RBAC

| Perfil | Debe ver |
|--------|----------|
| Cliente | Solo Customer App |
| Empleado empresa | Solo lo autorizado |
| Cocina | Solo Cocina (+ hoja / ejecución si capability) |
| Reparto | Solo Reparto |
| Atención al Cliente | Solo Support |
| Administración tenant | Admin tenant |
| Finanzas | Solo Finanzas |
| Company Admin | Todos los módulos **tenant** — nunca SaaS |
| SaaS Admin | Completo + Centro YourMeal OS |

---

## Fase 7 · Recorrido End-to-End (datos reales)

```text
Cliente → Programa → Confirma
  → Kitchen Queue → Kitchen Execution
  → Packaging* → Delivery* → Entrega
  → Historial → Repetir pedido
```

\* Packaging / Delivery: si aún no están implementados, el E2E del piloto **declara el alcance** (Kitchen → Delivery existente en `/admin/delivery`) y no finge Packaging. DICT-071.

---

## Fase 8 · Evidence Collection (FOPEBA)

Todo hallazgo:

```text
Hallazgo → Clasificación → Impacto → Evidencia → Corrección → Knowledge Update
```

Nunca corregir sin registrar. Taxonomía post G-02: Evidence · KU · Correction · Pilot Fix · Operational Finding.

---

## Fase 9 · Release Readiness Review

Última puerta antes de declarar listo para RI-001:

```text
□ main compila sin errores
□ Migraciones aplicadas y verificadas
  (incl. 20260724170000_kitchen_production_batches.sql si #48 merged)
□ Variables de entorno documentadas
□ BD sin migraciones pendientes
□ Feature Flags revisadas
□ Seguridad RLS/RBAC validada
□ No hay PRs abiertos que bloqueen RI-001
□ Docs de últimos EP actualizadas
□ Roadmap = estado real (CURRENT_PHASE)
```

---

## Definition of Done del sprint

- [ ] PRs funcionales fusionados (o explícitamente superseded).
- [ ] Sin botones muertos / pantallas vacías / datos ficticios en superficie piloto.
- [ ] Persistencia validada en módulos del alcance.
- [ ] RBAC verificado por perfil.
- [ ] E2E del alcance declarado con datos reales.
- [ ] Hallazgos clasificados FOPEBA.
- [ ] Fase 9 Release Readiness Review ✅.
- [ ] `main` estable → **listo para iniciar RI-001 con EatClean**.

---

## Relacionado

- [CURRENT_PHASE](./CURRENT_PHASE.md)
- [PILOT_ACCEPTANCE_CHECKLIST](./PILOT_ACCEPTANCE_CHECKLIST.md)
- [G-02](../20-evidence-framework/08-gate-g02-pilot-readiness.md)
- [DICT-071](../20-evidence-framework/09-operational-visibility-principle.md)
- [DICT-070 RI](../99-reference/PROJECT_DICTIONARY.md#reference-implementation-ri)
