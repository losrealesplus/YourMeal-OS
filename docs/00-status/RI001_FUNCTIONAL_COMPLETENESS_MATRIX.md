# RI-001 · Functional Completeness Matrix

**Fecha:** 2026-07-24  
**Modo:** **Certificación** — Correction de hub permitida; no Packaging/features nuevas  
**Baseline:** `main` @ post-#52 (EP-002A.2–A.3 · EP-002B.1–B.2 · DICT-072 · Readiness docs)  
**Secuencia:** primero [EP-OPS-001](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md) (bloque Ops Center en verde) → luego resto de filas  
**Principio:** [DICT-071 Operational Visibility](../20-evidence-framework/09-operational-visibility-principle.md)  
**Sprint:** [RI001_READINESS_SPRINT](./RI001_READINESS_SPRINT.md)

> Pregunta del momento:  
> **¿Podemos demostrar, con evidencia, que EatClean puede trabajar con YourMeal OS durante una jornada real?**  
> Ya no: «¿Qué falta por construir?»

> **Pausa:** no avanzar filas Customer App / módulos no-hub hasta que el bloque Centro de Operaciones esté PASS (EP-OPS-001). Auditar sobre navegación inestable contaminaría la evidencia.

---

## Cómo usar esta matriz

1. **Ahora:** completar solo el [bloque Centro de Operaciones](#bloque--centro-de-operaciones-ep-ops-001).
2. Tras Ops PASS: recorrer el resto de pantallas visibles.
3. Marcar columnas solo con evidencia (sesión real · rol real · dato real).
4. Si falla → registrar hallazgo en [Evidence log](#log-de-hallazgos) (clasificar **antes** de corregir).
5. Tres salidas válidas: **Completo** · **Oculto (FF)** · **«Próximamente» explícito**.

Leyenda: ✅ OK · 🟡 Parcial / acotado · ⏳ Pendiente de review en vivo · ❌ Fallo / humo · — N/A · ⏸ Pausado

---

## Bloque · Centro de Operaciones (EP-OPS-001)

| Pantalla | Ruta / entrada | Visible | Navega | Guarda | Lee | RBAC | Audit | Estado | Notas |
|----------|----------------|:-------:|:------:|:------:|:---:|:----:|:-----:|:------:|-------|
| Login staff | `/auth/admin` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | — | ⏳ | Entrada al hub |
| Dashboard Ops | `/admin` | ⏳ | ⏳ | — | ⏳ | ⏳ | — | ⏳ | Sin mocks |
| Cocina · cola | `/admin/kitchen` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Kitchen Execution | `/admin/kitchen-execution` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Hoja de Producción | `/admin/production-sheet` | ⏳ | ⏳ | — | ⏳ | ⏳ | — | ⏳ | Report |
| Reparto | `/admin/delivery` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Atención Cliente | `/admin/support` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Clientes | `/admin/customers` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Empresas | `/admin/companies` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Administración | `/admin/users` · … | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| Finanzas | `/admin/accounting` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | FF si no listo |
| Configuración | `/admin/settings` · branding | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | |
| SaaS plataforma | `/saas/*` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | WP-5: admins/roles |
| Separación admin/saas | entry discreta | ⏳ | ⏳ | — | — | ⏳ | — | ⏳ | WP-3 Dual |
| Gestión Company Admin | SaaS → tenant | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | WP-5 puente |

PASS del bloque = todas las filas visibles en ✅ (o ocultas honestamente) + RBAC ± documentado. Ver [EP-OPS-001 DoD](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md#definition-of-done).

---

## Matriz maestra (resto — pausada hasta Ops PASS)

| Pantalla | Ruta / entrada | Visible | Navega | Guarda | Lee | RBAC | Audit | Estado | Notas |
|----------|----------------|:-------:|:------:|:------:|:---:|:----:|:-----:|:------:|-------|
| Landing | `/` | ⏸ | ⏸ | — | — | — | — | ⏸ | Tras EP-OPS-001 |
| Login cliente | `/auth` | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | — | ⏸ | |
| Home | `/app` | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | — | ⏸ | |
| Menú semanal | `/app/menu` | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | — | ⏸ | |
| Programar pedido | `/app/schedule` | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | |
| Resumen / confirmar | orders flow | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | |
| Historial | `/app/orders` | ⏸ | ⏸ | — | ⏸ | ⏸ | — | ⏸ | |
| Detalle + Repetir | `/app/orders/$id` | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | |
| Favoritos | `/app/favorites` | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | |
| Settings / perfil | `/app/settings` | ⏸ | ⏸ | ⏸ | ⏸ | ⏸ | — | ⏸ | |

Histórico EP-001 / revisión estática 2026-07-23: [EATCLEAN_PILOT_FUNCTIONAL_COMPLETENESS_REVIEW](./EATCLEAN_PILOT_FUNCTIONAL_COMPLETENESS_REVIEW.md) · [EP001_FUNCTIONAL_COMPLETENESS_SPRINT](./EP001_FUNCTIONAL_COMPLETENESS_SPRINT.md).

---

## Dual Ops + RBAC + E2E + Evidence

Cubiertos por [EP-OPS-001](./EP_OPS_001_OPERATIONAL_CENTER_READINESS.md) mientras el hub no esté PASS.  
Tras PASS: reanudar prioridades 1–5 del [Readiness sprint](./RI001_READINESS_SPRINT.md).

### Log de hallazgos

| ID | Fecha | Tipo | Superficie | Impacto | Evidencia | Decisión | Estado |
|----|-------|------|------------|---------|-----------|----------|--------|
| — | — | — | — | — | — | — | — |

---

## Definition of Done (certificación)

- [ ] **EP-OPS-001 PASS** (hub operacional).
- [ ] Matriz resto recorrida en vivo (sin ⏳ críticos en alcance piloto).
- [ ] RBAC positivo + negativo por perfil.
- [ ] Guion E2E ejecutado con datos reales (alcance declarado).
- [ ] Hallazgos clasificados; ninguno “corregido en silencio”.
- [ ] Release Readiness Review ([Fase 9](./RI001_READINESS_SPRINT.md#fase-9--release-readiness-review)) ✅.
- [ ] `main` estable → **listo para iniciar RI-001**.
