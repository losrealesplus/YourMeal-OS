# CR-COST-01: MIGRATION & ROLLBACK PLAN
**Fecha:** 26 de Septiembre de 2026  
**Autoridad:** Human Product Authority & Agency Council  
**Conformidad:** `YOURMEAL_OS_PLATFORM_CONSTITUTION.md` (L1)

---

## 1. Plan de Migración (Forward DDL)

**Archivo:** `supabase/migrations/20260926170000_procurement_cost_foundation.sql`  
*(Copia simétrica en `instances/yourmeal-eatclean/supabase/migrations/`)*

### Operaciones DDL:
1. Crear tabla `public.purchase_invoices`.
2. Crear tabla `public.purchase_invoice_items`.
3. Crear tabla `public.item_cost_history`.
4. Habilitar `ROW LEVEL SECURITY` en todas las nuevas tablas.
5. Crear políticas RLS vinculadas a `tenant_id` y `has_any_staff_role`.
6. Añadir constraints `CHECK`:
   - `CHECK (quantity > 0)`
   - `CHECK (unit_price >= 0)`
   - `CHECK (discount_amount >= 0)`
   - `CHECK (additional_costs >= 0)`
   - `CHECK (effective_unit_cost >= 0)`
7. Crear índices compuestos para optimizar consultas de inventario e historial.

---

## 2. Plan de Rollback (Reversible DDL)

En caso de reversión autorizada, el siguiente script elimina limpiamente los objetos creados sin afectar a tablas preexistentes:

```sql
-- ROLLBACK SCRIPT FOR CR-COST-01
DROP TABLE IF EXISTS public.item_cost_history CASCADE;
DROP TABLE IF EXISTS public.purchase_invoice_items CASCADE;
DROP TABLE IF EXISTS public.purchase_invoices CASCADE;
```

---

## 3. Garantía de Cero Impacto en Datos Previos

- La migración **NO modifica ninguna columna preexistente** en `suppliers`, `ingredients`, `dishes`, `orders` ni `invoices`.
- Las nuevas tablas nacen vacías con relaciones de clave foránea seguras (`ON DELETE RESTRICT` en proveedores de facturas para proteger integridad referencial).
