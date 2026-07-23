# ENGINEERING REVIEW — Sprint 0 · Repository Health

**Fecha:** 2026-07-23  
**Alcance:** implementación CAP-001…006 (rama `cursor/cap-006-order-confirmation-f54a`)  
**Modo:** solo auditoría — **sin correcciones aplicadas**

> Nota: CAP-006 ya está presente en la rama auditada. Este informe evalúa la salud del repo **antes de tratar CAP-006 / HP-001 como listos para ORR**, y responde al gate pedido: ¿se puede continuar con CAP-006?

---

## Resumen ejecutivo

La arquitectura **Read Pattern** y **Mutation Pattern** está reconocible y, en lo esencial, respetada en Dish / Weekly Menu / Orders. Auth + tenant alimentan los hooks. Las mutaciones `programDraft` y `confirm` emiten `audit_log` e invalidan queries.

Los riesgos más densos no son de UX ni de OM, sino de **integridad de datos y criterios Connected/Operational**: precio confiado al cliente, ausencia de validación oferta⊇platos, filtros `deleted_at` incompletos en menús/pedidos, N+1 en resumen, mocks aún en Home/Orders list, y `featureFlagService` no cableado pese a `MODULE_STATE_CRITERIA`.

**No hay P0 que rompa el login o el RLS customer básico**, pero hay **varios P1 que deben resolverse antes de ORR / piloto real**.

Puertas: **Ready for CAP-006 ✅** · **Ready for ORR ❌**. Engineering Health 74; Operational Health aún no medible.

---

## Incidencias

### INC-01 — `total` y `dishIds` confiados al cliente en `programDraft`

| Campo | Valor |
|-------|--------|
| **Prioridad** | **P1** (antes de ORR / piloto con importe real) |
| **Archivos** | `src/modules/orders/application/order-service.ts` · `src/routes/_authenticated/app.schedule.tsx` · `src/modules/orders/infrastructure/order-repository.ts` |
| **Riesgo** | El UI envía `total` (`selected.length * 990`) y cualquier `dishIds`. El Service no recalcula precio ni verifica pertenencia a la oferta published del día. Integridad económica y de menú forjables. |
| **Recomendación** | Calcular `total` en Service desde datos persistidos; assert `dishIds ⊆` slots published para `dayDate`. |
| **Corrección propuesta** | En `OrderService.programDraft`: cargar WeeklyMenu published + precios Dish; rechazar IDs fuera de oferta; persistir total servidor. |
| **Tiempo estimado** | 2–4 h |

---

### INC-02 — Soft-delete: `deleted_at` en BD, ausente/filtrado incompleto en CAP orders/menus

| Campo | Valor |
|-------|--------|
| **Prioridad** | **P1** |
| **Archivos** | `supabase/migrations/20260720210000_soft_delete_*.sql` · `src/integrations/supabase/types.ts` (`weekly_menus`, `orders`, `order_items` sin `deleted_at` en Row) · `weekly-menu-repository.ts` · `order-repository.ts` |
| **Riesgo** | Menús/pedidos soft-deleted pueden seguir apareciendo. Types desalineados con ADR soft-delete. Criterio Operational exige soft-delete respetado. |
| **Recomendación** | Regenerar types; `.is("deleted_at", null)` en lecturas CAP de `weekly_menus` / `orders` / `order_items`. |
| **Corrección propuesta** | `supabase gen types` + filtros en `findPublishedByWeekStart`, `findByIdWithItems`, `listCatalog` (dishes ya filtra). |
| **Tiempo estimado** | 1–2 h |

---

### INC-03 — Confirm sin bind app-layer order → customer (solo RLS)

| Campo | Valor |
|-------|--------|
| **Prioridad** | **P1** |
| **Archivos** | `order-service.ts` (`confirm`) · `order-repository.ts` (`confirmDraft`) |
| **Riesgo** | Customer protegido por RLS. Staff con `orders.write` puede confirmar cualquier draft del tenant vía el mismo API. Sin defensa en profundidad si cambia el cliente Supabase. |
| **Recomendación** | Para actores customer: exigir `order.customer_id === findCustomerIdForUser(userId)`. Staff: capability/ruta explícita si se desea. |
| **Corrección propuesta** | En `OrderService.confirm`, resolver customer y comparar antes de `confirmDraft`. |
| **Tiempo estimado** | 1 h |

---

### INC-04 — N+1 en `fetchOrderSummary` (un fetch por dish)

| Campo | Valor |
|-------|--------|
| **Prioridad** | **P1** |
| **Archivos** | `src/modules/orders/application/order-queries.ts` |
| **Riesgo** | Latencia y carga crecen con líneas del pedido; se dispara tras cada confirm/invalidate. |
| **Recomendación** | Batch `dishes.in('id', ids)` o join en una query. |
| **Corrección propuesta** | `DishRepository.listCatalogByIds(ids)` + map paralelo único. |
| **Tiempo estimado** | 1–2 h |

---

### INC-05 — Draft write no atómico + audit post-commit

| Campo | Valor |
|-------|--------|
| **Prioridad** | **P1** |
| **Archivos** | `order-repository.ts` (`insertDraft`) · `order-service.ts` · `audit-service.ts` |
| **Riesgo** | Order insertado y fallo en items → borrador huérfano. Si `AuditService.write` falla tras persistir, queda mutación sin evidencia (rompe invariante Connected→Operational). |
| **Recomendación** | RPC/transacción order+items; política explícita si audit falla (retry/outbox o rollback documentado). |
| **Corrección propuesta** | Función Postgres `program_draft_order` + audit en Service con manejo de error documentado. |
| **Tiempo estimado** | 3–5 h |

---

### INC-06 — Mocks en Home y lista `/app/orders` (HP-001 parcial en superficies de lista)

| Campo | Valor |
|-------|--------|
| **Prioridad** | **P1** (antes de ORR si el piloto usa esas pantallas) |
| **Archivos** | `app.index.tsx` · `app.orders.tsx` · `mock-catalog.ts` · `order-card.tsx` |
| **Riesgo** | Tras Confirm real, el usuario sigue viendo `MOCK_ORDERS`. El pedido real no aparece en historial/home. Confunde piloto y debilita “HP-001 sin mocks”. |
| **Recomendación** | Wire mínimo lista de pedidos del customer **o** ocultar/mock-gate esas superficies hasta CAP-007 con copy explícito. |
| **Corrección propuesta** | CAP-007 adelantado mínimo (`useOrders` list) **o** empty-state “sin historial conectado” sin mocks. Preferible no inventar CAP en este sprint de fixes: empty-state sin mock. |
| **Tiempo estimado** | 2–4 h (empty-state) / 4–8 h (lista real) |

---

### INC-07 — `featureFlagService` no usado en CAP-002…006

| Campo | Valor |
|-------|--------|
| **Prioridad** | **P1** (criterio Scaffold→Connected en `MODULE_STATE_CRITERIA`) |
| **Archivos** | `feature-flag-service.ts` · hooks CAP · `order-service.ts` · `MODULE_STATE_CRITERIA.md` |
| **Riesgo** | Sin kill-switch de rollout; Connected formalmente incompleto. |
| **Recomendación** | Gate lectura/mutación con flags existentes o documentar excepción explícita en CAP docs (si OM/ADR lo permiten). |
| **Corrección propuesta** | `FeatureFlagService.isEnabled('…')` en Service/hooks; seed flags CAP si faltan. |
| **Tiempo estimado** | 2–3 h |

---

### INC-08 — Dual DishRepository + `CatalogDish = MockDish`

| Campo | Valor |
|-------|--------|
| **Prioridad** | **P2** |
| **Archivos** | `dish-repository.ts` · `supabase-dish-repository.ts` · `dish-catalog-mapper.ts` · `mock-catalog.ts` |
| **Riesgo** | Dos stacks de persistencia; UI acoplada a tipos scaffold; `ingredients: []` siempre. |
| **Recomendación** | Unificar puerto; DTO catalog independiente de mocks. |
| **Corrección propuesta** | Tipo `CatalogDish` propio; deprecar alias MockDish en CAP paths. |
| **Tiempo estimado** | 3–6 h |

---

### INC-09 — Literales i18n / unidades sin `useFmt`

| Campo | Valor |
|-------|--------|
| **Prioridad** | **P2** |
| **Archivos** | `app.schedule.tsx` (`"Error"`) · `app.orders.$orderId.tsx` (`"Error"`, `` `${kcal} kcal` ``) · `order-summary-mapper.ts` (`currency: "EUR"`, `weekLabel` ISO crudo) |
| **Riesgo** | Viola Master Prompt i18n/useFmt; errores solo EN. |
| **Recomendación** | Claves i18n; `fmt.date` / formato kcal vía useFmt o i18n. |
| **Corrección propuesta** | `t('common:error')`; overline con `fmt.date(weekStart)`; currency desde localization. |
| **Tiempo estimado** | 1–2 h |

---

### INC-10 — Estados de UI inventados (`pending`) / Draft≈Confirmed en pill

| Campo | Valor |
|-------|--------|
| **Prioridad** | **P2** |
| **Archivos** | `order-summary-mapper.ts` · `app.orders.$orderId.tsx` (`pillTone`) · `status-pill.tsx` |
| **Riesgo** | Draft y Confirmed comparten tono “pending”; CAP-006 poco visible; estado `pending` no está en enum BD. |
| **Recomendación** | Extender StatusPill a `draft`/`confirmed` **sin rediseño** (solo mapeo de tono) o mapear confirmed→delivered tone temporal documentado. |
| **Corrección propuesta** | Ampliar `MockOrderStatus` o desacoplar StatusPill de mocks. |
| **Tiempo estimado** | 1–2 h |

---

### INC-11 — Tests delgados en orders (confirm / ownership / audit)

| Campo | Valor |
|-------|--------|
| **Prioridad** | **P2** |
| **Archivos** | `order-service.spec.ts` · ausencia de tests repo/queries/confirm happy path |
| **Riesgo** | Regresión de CAP-006 sin red de seguridad. |
| **Recomendación** | Fake repo: Draft→Confirmed + audit called; reject non-draft; ownership. |
| **Corrección propuesta** | Ampliar `order-service.spec.ts` con dobles. |
| **Tiempo estimado** | 2–3 h |

---

### INC-12 — Nav/copy CAP-004 vs docs (navigate a summary; CTA dice confirmOrder)

| Campo | Valor |
|-------|--------|
| **Prioridad** | **P2** |
| **Archivos** | `app.schedule.tsx` · `CAP-004-order-programming.md` |
| **Riesgo** | Doc dice “sin cambio navegación” / navigate `/app`; código va a `/app/orders/$id`. Label `confirmOrder` en step 3 programa Draft (confunde con CAP-006). |
| **Recomendación** | Alinear doc; clave i18n distinta “guardar borrador” vs “confirmar”. |
| **Corrección propuesta** | Update CAP-004 postconditions; `scheduleSaveDraft` i18n ×6. |
| **Tiempo estimado** | 1 h |

---

### INC-13 — `useAuth` toma primer `tenant_members` (`.limit(1)`)

| Campo | Valor |
|-------|--------|
| **Prioridad** | **P2** |
| **Archivos** | `src/hooks/use-auth.ts` |
| **Riesgo** | Multi-membership → tenant incorrecto en todas las CAP. |
| **Recomendación** | Selector de tenant activo explícito. |
| **Corrección propuesta** | Persistir `activeTenantId` (profile/local) — sin UX grande si ya hay un solo tenant EatClean. |
| **Tiempo estimado** | 2–4 h (si hace falta ahora: documentar “1 tenant” como precondición piloto) |

---

### INC-14 — Query keys: `orderKeys.drafts` muerto; invalidación redundante

| Campo | Valor |
|-------|--------|
| **Prioridad** | **P3** |
| **Archivos** | `order-query-keys.ts` · `use-confirm-order.ts` |
| **Riesgo** | Ruido; no bloquea. |
| **Recomendación** | Usar o eliminar `drafts`; invalidar solo `orderKeys.all`. |
| **Corrección propuesta** | Cleanup menor. |
| **Tiempo estimado** | 15–30 min |

---

### INC-15 — Lecturas CAP sin `requireCapability` (RLS-only)

| Campo | Valor |
|-------|--------|
| **Prioridad** | **P3** |
| **Archivos** | `dish-catalog-queries.ts` · `weekly-menu-queries.ts` · `order-queries.ts` |
| **Riesgo** | Inconsistencia con mutaciones; documentado en parte como intencional. |
| **Recomendación** | Formalizar “RLS-only reads” en CAP docs o añadir check. |
| **Corrección propuesta** | Nota en CAP-002/003/005. |
| **Tiempo estimado** | 30 min |

---

### INC-16 — Casts `as unknown as Record<string, unknown>` en audit payloads

| Campo | Valor |
|-------|--------|
| **Prioridad** | **P3** |
| **Archivos** | `order-service.ts` |
| **Riesgo** | Type safety débil en `newData`/`oldData`. |
| **Recomendación** | Tipar `AuditWriteInput` con `Json` / serializers. |
| **Corrección propuesta** | Helper `toAuditJson(value)`. |
| **Tiempo estimado** | 1 h |

---

## Checklist de patrones (síntesis)

| Patrón | Estado |
|--------|--------|
| Read: OM→Repo→Query→Hook→UI | ✅ CAP-002/003/005 |
| Mutation: UI→Command→Service→Repo→SB→audit→invalidate | ✅ CAP-004/006 |
| Audit en mutaciones CAP orders | ✅ create + status_change |
| Product Skeleton (nav/DS/componentes core) | ✅ sin cambios DS; ⚠️ nav schedule→summary y CTA Confirm en summary |
| i18n / useFmt | ⚠️ gaps P2 |
| featureFlagService | ❌ gap P1 vs MODULE_STATE_CRITERIA |

---

## Repository Health Score

### **74 / 100**

| Dimensión | Score |
|-----------|-------|
| Arquitectura / patrones | 85 |
| TypeScript | 78 |
| TanStack Query | 80 |
| Supabase / datos | 65 |
| Auditoría mutaciones | 82 |
| i18n / useFmt | 70 |
| Feature flags | 40 |
| Tests | 60 |
| Performance | 68 |
| Seguridad (app-layer) | 70 |
| Product Skeleton fidelity | 82 |

---

## Decisión (dos puertas)

| Estado | Resultado |
|--------|-----------|
| Ready for CAP-006 | ✅ |
| Ready for ORR | ❌ |

```text
READY FOR CAP-006   ✅   (implementable; no P0 de arquitectura)
READY FOR ORR       ❌   (P1 de integridad/calidad pendientes)
```

**Motivo CAP-006:** no hay P0 que impida completar Confirm del Happy Path.  
**Motivo ORR:** INC-01…07 bloquean declarar Operational / piloto.

> Distinción operativa: *Ready to implement CAP-006* ≠ *Ready for ORR / FOV*.

### Health dual

| Métrica | Valor |
|---------|-------|
| **Engineering Health** | **74 / 100** |
| **Operational Health** | *no medible* hasta ORR |

Tras ORR → FOV → Evidence → Knowledge Update, Operational Health se mide aparte: un sistema puede tener ingeniería sólida y aún así requerir ajustes de modelo en campo.

---

## Roadmap post–auditoría (actualizado)

```text
Fase A  Merge pila → main
Fase B  Engineering Fix Sprint (P1 only)
Fase C  Verificar CAP-006 / HP-001 estable
Fase D  ORR (sin features)
Fase E  FOV
```

Tablero vivo: [CURRENT_PHASE](./CURRENT_PHASE.md).

### Engineering Integrity (confianza del sistema)

1. INC-01 oferta + total servidor  
2. INC-03 ownership confirm  
3. INC-05 atomicidad draft + audit  

### Engineering Completeness (criterio Operational)

4. INC-02 deleted_at + types  
5. INC-04 N+1  
6. INC-06 mocks home/orders (empty-state o lista)  
7. INC-07 feature flags  

**Engineering Fix Sprint** = un solo PR de hygiene — **no** nuevas Capabilities, **no** UX, **no** OM.  
Capabilities = evolución funcional · Engineering Debt = implementación · la deuda no inventa conocimiento operacional.
