# RI-001 · Functional Completeness Matrix

**Fecha:** 2026-07-24  
**Modo:** **Certificación** — no desarrollo de nuevas capacidades  
**Baseline:** `main` @ post-#52 (EP-002A.2–A.3 · EP-002B.1–B.2 · DICT-072 · Readiness docs)  
**Artefacto primario antes de RI-001**  
**Principio:** [DICT-071 Operational Visibility](../20-evidence-framework/09-operational-visibility-principle.md)  
**Sprint:** [RI001_READINESS_SPRINT](./RI001_READINESS_SPRINT.md)

> Pregunta del momento:  
> **¿Podemos demostrar, con evidencia, que EatClean puede trabajar con YourMeal OS durante una jornada real?**  
> Ya no: «¿Qué falta por construir?»

---

## Cómo usar esta matriz

1. Recorrer **cada pantalla visible** en entorno con migraciones aplicadas.
2. Marcar columnas solo con evidencia (sesión real · rol real · dato real).
3. Si falla → registrar hallazgo en [Evidence log](#log-de-hallazgos) (clasificar **antes** de corregir).
4. Tres salidas válidas por elemento visible: **Completo** · **Oculto (FF)** · **«Próximamente» explícito**.

Leyenda: ✅ OK · 🟡 Parcial / acotado · ⏳ Pendiente de review en vivo · ❌ Fallo / humo · — N/A

---

## Matriz maestra (piloto)

| Pantalla | Ruta / entrada | Visible | Navega | Guarda | Lee | RBAC | Audit | Estado | Notas |
|----------|----------------|:-------:|:------:|:------:|:---:|:----:|:-----:|:------:|-------|
| Landing | `/` | ⏳ | ⏳ | — | — | — | — | ⏳ | Review en vivo |
| Login cliente | `/auth` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | — | ⏳ | |
| Login staff | `/auth/admin` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | — | ⏳ | returnTo / Ops entry |
| Home | `/app` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | — | ⏳ | Próxima entrega |
| Menú semanal | `/app/menu` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | — | ⏳ | |
| Programar pedido | `/app/schedule` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | draft |
| Resumen / confirmar | orders flow | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Historial | `/app/orders` | ⏳ | ⏳ | — | ⏳ | ⏳ | — | ⏳ | EP-002A.2 |
| Detalle + Repetir | `/app/orders/$id` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | RepeatOrderService |
| Favoritos | `/app/favorites` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Sugeridos ≠ auto-mark |
| Settings / perfil | `/app/settings` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | — | ⏳ | Cero humo |
| Centro Ops EatClean | `/admin` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Ver dual surface |
| Cocina · cola | `/admin/kitchen` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Pedidos |
| Kitchen Execution | `/admin/kitchen-execution` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Lotes |
| Hoja de Producción | `/admin/production-sheet` | ⏳ | ⏳ | — | ⏳ | ⏳ | — | ⏳ | Report |
| Reparto / Delivery | `/admin/delivery` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Scope declarado |
| Atención Cliente | `/admin/support` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Administración tenant | `/admin/users` · companies · … | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Branding tenant | `/admin/branding` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| SaaS · plataforma | `/saas/*` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | Solo saas_admin |

*Filas ⏳ = pendientes de evidencia en vivo. No inventar ✅.*

Histórico EP-001 / revisión estática 2026-07-23: [EATCLEAN_PILOT_FUNCTIONAL_COMPLETENESS_REVIEW](./EATCLEAN_PILOT_FUNCTIONAL_COMPLETENESS_REVIEW.md) · [EP001_FUNCTIONAL_COMPLETENESS_SPRINT](./EP001_FUNCTIONAL_COMPLETENESS_SPRINT.md).

---

## Prioridad 2 · Dual Ops Center (hueco arquitectónico)

Ver [OPS_CENTER_DUAL_SURFACE](./OPS_CENTER_DUAL_SURFACE.md).

```text
Customer App
    → Centro de Operaciones EatClean  →  operación diaria del tenant

YourMeal OS
    → Centro de Operaciones SaaS      →  gestión de la plataforma
```

Checklist de certificación (no feature nueva — **Correction** si se toca código):

```text
□ Nav EatClean acotada a departamentos del tenant
□ Entrada SaaS discreta solo saas_admin
□ Company Admin nunca ve /saas
□ homePathForRoles alineado con decideOperationsCenterEntry
□ Sin mezclar branding tenant / plataforma
□ Placeholders SaaS: FF OFF o «Próximamente» (DICT-071)
```

---

## Prioridad 3 · RBAC (positivo y negativo)

Demostrar que **funciona cuando debe** y que **falla / redirige cuando no debe**.

| Perfil | Debe ver | No debe ver |
|--------|----------|-------------|
| Cliente | Customer App | `/admin`, `/saas` |
| Empleado empresa | Solo lo autorizado | SaaS · depts ajenos |
| Cocina | Cocina · hoja · ejecución (si capability) | Finanzas · SaaS · admin tenant completo |
| Reparto | Reparto / delivery | Cocina mutaciones · SaaS |
| Atención Cliente | Support | Cocina ejecución · SaaS |
| Administración tenant | Admin tenant | `/saas` |
| Finanzas | Finanzas | Cocina · SaaS |
| Company Admin | Todo el **tenant** | Plataforma SaaS |
| SaaS Admin | Tenant (según dual-role) + `/saas` | — |

Resultados: registrar en log (Security Finding si permiso excesivo).

---

## Prioridad 4 · Guion E2E (jornada real)

```text
Cliente → Registro → Login → Menú semanal → Pedido → Confirmación
  → Próxima entrega
  → Kitchen Queue → Kitchen Execution → Hoja de Producción
  → Packaging* → Delivery*
  → Entrega → Historial → Repetir pedido
```

\* Packaging / Delivery: **pendientes** — no fingir. Alcance declarado del piloto = hasta Hoja/Ejecución + delivery existente si real; resto FF OFF.

Todo fallo del guion = **Operational Finding** (no “bug aislado”).

---

## Prioridad 5 · Evidence Collection (FOPEBA)

**Clasificar antes de corregir.**

| Tipo | Ejemplo |
|------|---------|
| Operational Finding | Cocina necesita agrupar por temperatura |
| Knowledge Gap | Faltan reglas para pedidos de empresa |
| UX Finding | Cliente no entiende cuándo llega el pedido |
| Engineering Defect | Botón no persiste |
| Data Issue | Estado incorrecto |
| Security Finding | Permiso excesivo |

Cadena:

```text
Hallazgo → Clasificación → Impacto → Evidencia → Decisión → Corrección / KU
```

### Log de hallazgos

| ID | Fecha | Tipo | Superficie | Impacto | Evidencia | Decisión | Estado |
|----|-------|------|------------|---------|-----------|----------|--------|
| — | — | — | — | — | — | — | — |

---

## Definition of Done (certificación)

- [ ] Matriz recorrida en vivo (sin ⏳ críticos en alcance piloto).
- [ ] Dual Ops Center: gap documentado; corrección solo si bloquea evidencia.
- [ ] RBAC positivo + negativo por perfil.
- [ ] Guion E2E ejecutado con datos reales (alcance declarado).
- [ ] Hallazgos clasificados; ninguno “corregido en silencio”.
- [ ] Release Readiness Review ([Fase 9](./RI001_READINESS_SPRINT.md#fase-9--release-readiness-review)) ✅.
- [ ] `main` estable → **listo para iniciar RI-001**.
