# Dish Management — trazabilidad

**Estado:** ✅ implementada (Foundation → Product)  
**Asistente(s):** Menu · Production (catálogo)  
**Evidencia Discovery:** catálogo base — no sustituye Observation del día operativo  

> El gerente no «abre Dish Management por la mañana».  
> Es el **catálogo** que Menu y Production consumen.

---

## 1. Core Objects

| Objeto | Rol |
|--------|-----|
| **Dish** | Objeto principal — unidad comercializable |
| Recipe | Relación futura (composición); no gestionada aún por esta Capability |
| Weekly Menu | Consumidor downstream — solo Dishes **Active** |
| Order Item | Referencia histórica — archivar sin romper pedidos |

Supporting: categorías, tags (Nivel 2/3).

---

## 2. Operational Dependencies

| Verbo | Desde → Hacia | Notas |
|-------|---------------|-------|
| `defines` | Recipe → Dish | Futuro Recipe Builder |
| `offers` | Weekly Menu → Dish | Menu elige del catálogo |
| `contains` | Order → Dish (vía Item) | Demanda sobre Dish activo |
| `produces` | Production Batch → Dish | Producción referencia Dish |

Esta Capability **mantiene** el catálogo Dish; no recorre la espina completa.

---

## 3. Transiciones

Objeto: **Dish** — [support-transitions](../04-lifecycles/support-transitions.md).

| Transición | Evento | Responsable |
|------------|--------|-------------|
| `Draft` → `Active` | Activate Dish | Cocina / producto |
| `Active` → `Inactive` | Deactivate Dish | Cocina / producto |
| `Inactive` → `Active` | Reactivate Dish | Cocina / producto |
| `*` → `Archived` | Archive Dish | Cocina / producto |

Use Cases técnicos: UC-001…UC-008 (`docs/14-application/DISH_USE_CASES.md`).

---

## 4. Operational Checks (en transición)

| Transición | Pregunta | Notas |
|------------|----------|-------|
| → `Active` | ¿**Puede activarse** este Dish para Weekly Menu? | Completitud mínima del catálogo |
| → `Archived` | ¿**Puede archivarse** sin romper Orders históricos? | Trazabilidad de demanda |

Checks de nutrición / repetición viven en **Menu**, no en Dish Management.

---

## 5. Invariants que respeta

| ID | Invariante |
|----|------------|
| INV-001 | Identidad única del Dish por Organization |
| INV-002 | Dish ≠ Recipe ≠ Batch (lenguaje canónico) |
| INV-003 | Archive ≠ Purge |
| INV-010 | Pertenencia a Organization |
| INV-020 | Transiciones explícitas (state machine) |
| INV-043 | Check no decide — usuario confirma |
| INV-044 | Capability no define leyes |
| INV-055 | Invariant > Capability |

**Confirmación:** los UC de Dish no autorizan transiciones que violen la Constitución.

---

## 6. Lo que NO hace

- No es el Production Assistant ni el día 04:00.  
- No gestiona Stock, Plan, Batch ni Delivery.  
- No inventa «cliente» — la demanda es Order con actor explícito.  
- No publica Weekly Menu ni confirma Orders.

---

## Implementación técnica (referencia)

| Capa | Artefacto |
|------|-----------|
| Application | UC-001…UC-008 |
| Domain | `Dish` entity + state machine |
| Infrastructure | `SupabaseDishRepository` |

Ver [CAPABILITY_ROADMAP](../../15-product/CAPABILITY_ROADMAP.md).
