# CR-CUST-01-HF01 — Production Hotfix Report
## Customer Dietary Profile — operations_manager RLS Authorization

---

## 1. Problema

Tras la certificación y cierre en producción de **CR-CUST-01** (*Customer Dietary Preferences, Restrictions & Allergen Profile*), se detectó que una cuenta con rol operativo `operations_manager` podía visualizar y editar el perfil dietético de un cliente en la interfaz administrativa (`CustomerDietaryEditor`), pero al intentar guardar los cambios recibía un error de violación de políticas de seguridad a nivel de base de datos (**Row-Level Security / RLS**) emitido por Supabase.

---

## 2. Causa Raíz Confirmada

La hipótesis fue **100% confirmada** tras la inspección read-only:

1. **Autorización en Frontend / RBAC de Aplicación**:  
   En `src/permissions/index.ts`, el rol `operations_manager` incluye explícitamente la capability `customers.write`.  
   En `src/routes/_authenticated/admin.customers.tsx`, la interfaz evalúa `canWrite = can("customers.write")` y transmite `canWrite={true}` al componente `CustomerDietaryEditor`, habilitando los controles de edición y el botón de guardado.

2. **Mecanismo de Persistencia**:  
   El componente `CustomerDietaryEditor` ejecuta un `upsert` relacional:
   ```typescript
   supabase.from("customer_dietary_profiles")
     .upsert(payload, { onConflict: "tenant_id,customer_id" });
   ```
   En PostgreSQL, una sentencia `INSERT ... ON CONFLICT (...) DO UPDATE` exige la satisfacción simultánea de las políticas de RLS para `INSERT` (`WITH CHECK`) y para `UPDATE` (`USING`).

3. **Defecto en la Política RLS Base (`20261002100000_cr_cust_01_customer_dietary_profiles.sql`)**:  
   Las políticas de escritura y actualización fueron definidas como:
   ```sql
   CREATE POLICY customer_dietary_profiles_write ON public.customer_dietary_profiles
     FOR INSERT TO authenticated
     WITH CHECK (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));

   CREATE POLICY customer_dietary_profiles_update ON public.customer_dietary_profiles
     FOR UPDATE TO authenticated
     USING (public.has_any_staff_role(auth.uid(), tenant_id) OR public.is_saas_admin(auth.uid()));
   ```
4. **Desconexión con `has_any_staff_role`**:  
   La función de seguridad canónica `has_any_staff_role` (creada en la migración fundacional `20260720164312`) evalúa únicamente los roles originales:
   `'company_admin','kitchen','purchasing','inventory','production','support','accounting','logistics'`.  
   El rol `operations_manager` fue introducido posteriormente en el ciclo del proyecto y **no** forma parte de `has_any_staff_role`.  
   En consecuencia, cuando un `operations_manager` intenta realizar el upsert, la política RLS evalúa a `FALSE`, bloqueando la persistencia.

---

## 3. Archivos Inspeccionados

| Archivo | Rol en el Diagnóstico | Hallazgo Clave |
| :--- | :--- | :--- |
| `src/permissions/index.ts` | Matriz RBAC central | `operations_manager` posee legítimamente `customers.write`. |
| `src/routes/_authenticated/admin.customers.tsx` | Hub administrativo de clientes | Evalúa `can("customers.write")` y habilita `CustomerDietaryEditor`. |
| `src/components/admin/customer-dietary-editor.tsx` | Editor UI de perfil dietético | Realiza `upsert` directo a `customer_dietary_profiles`. |
| `src/modules/customer-directory/application/customer-dietary-service.ts` | Servicio canónico de dominio | Valida `customers.write` y ejecuta `upsert` con auditoría. |
| `supabase/migrations/20260720164312_9137d8ab-e998-4e02-816c-63bda5634159.sql` | Definición de funciones de seguridad | `has_any_staff_role` excluye `operations_manager`. |
| `supabase/migrations/20261002100000_cr_cust_01_customer_dietary_profiles.sql` | Migración base de CR-CUST-01 | Políticas RLS de INSERT/UPDATE restringen a `has_any_staff_role`. |

---

## 4. Cambios Realizados

Se aplicó estrictamente el principio de **corrección mínima, acotada y segura**:

1. **Nueva Migración Aditiva RLS**:  
   `supabase/migrations/20261002110000_cr_cust_01_hf01_customer_dietary_profiles_operations_manager_rls.sql`
2. **Migración de Rollback Inmediato**:  
   `supabase/migrations/rollback/20261002110000_cr_cust_01_hf01_customer_dietary_profiles_operations_manager_rls_down.sql`
3. **Suite de Pruebas de Políticas RLS**:  
   `src/modules/customer-directory/infrastructure/customer-dietary-profiles-rls.spec.ts`
4. **Ampliación de Tests de Servicio**:  
   `src/modules/customer-directory/application/customer-dietary-service.spec.ts`

---

## 5. Políticas RLS Afectadas

Únicamente se reemplazaron las políticas de `INSERT` y `UPDATE` de la tabla `customer_dietary_profiles`:

```sql
-- INSERT
DROP POLICY IF EXISTS customer_dietary_profiles_write ON public.customer_dietary_profiles;

CREATE POLICY customer_dietary_profiles_write ON public.customer_dietary_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.has_role(auth.uid(), tenant_id, 'operations_manager')
    OR public.is_saas_admin(auth.uid())
  );

-- UPDATE
DROP POLICY IF EXISTS customer_dietary_profiles_update ON public.customer_dietary_profiles;

CREATE POLICY customer_dietary_profiles_update ON public.customer_dietary_profiles
  FOR UPDATE TO authenticated
  USING (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.has_role(auth.uid(), tenant_id, 'operations_manager')
    OR public.is_saas_admin(auth.uid())
  )
  WITH CHECK (
    public.has_any_staff_role(auth.uid(), tenant_id)
    OR public.has_role(auth.uid(), tenant_id, 'operations_manager')
    OR public.is_saas_admin(auth.uid())
  );
```

**Políticas que permanecen intactas:**
- `SELECT` (`customer_dietary_profiles_read`): Intacta. Ya permitía `is_tenant_member(tenant_id)`.
- `DELETE` (`customer_dietary_profiles_delete`): Intacta.
- `has_any_staff_role`: **NO MODIFICADA GLOBALMENTE** (cumplimiento estricto de la Regla de Seguridad 3).

---

## 6. Tests Añadidos / Modificados

Se implementaron y ejecutaron los 6 tests obligatorios requeridos:

- **TEST 1**: `operations_manager` puede crear un perfil dietético dentro de su tenant (`evaluateInsertPolicy` → `true`).
- **TEST 2**: `operations_manager` puede actualizar un perfil dietético dentro de su tenant (`evaluateUpdatePolicy` → `true`).
- **TEST 3**: `operations_manager` **NO** puede escribir ni actualizar un perfil de otro tenant, ni reasignar un perfil a otro tenant (`cross-tenant check` → `false`).
- **TEST 4**: Roles previamente autorizados (`company_admin`, `saas_admin`, roles base de cocina/soporte) mantienen su comportamiento intacto.
- **TEST 5**: Usuarios sin autorización de escritura (`driver`, `customer`, usuarios anónimos o no miembros) continúan siendo rechazados.
- **TEST 6**: Se verifican los contratos estructurales de la tabla, inmutabilidad de snapshots en `orders` y existencia de rollback.
- **Service Tests**: Se verificó la ejecución de `CustomerDietaryService.saveDietaryProfile` bajo contexto de `operations_manager` y el rechazo por falta de capability `customers.write`.

---

## 7. Resultados de Tests

### Suite Local Específica
```bash
npx vitest run src/modules/customer-directory/
```
- **Test Files**: 6 passed (6)
- **Tests**: 55 passed (55)
- **Duration**: 362ms

### Suite Completa del Proyecto
```bash
npx vitest run
```
- **Test Files**: 267 passed (267)
- **Tests**: 1468 passed (1468)
- **Fails**: 0
- **Regresiones**: Ninguna

---

## 8. Verificación TypeScript

```bash
npx tsc --noEmit
```
- **Resultado**: Exit code 0 (Cero errores de tipado).

---

## 9. Verificación de Build

```bash
npm run build
```
- **Resultado**: Exit code 0.
- Compilación de TanStack Router, Nitro SSR y Cloudflare Workers completada exitosamente sin advertencias críticas ni errores.

---

## 10. Impacto de Seguridad

- **Scope acotado**: El permiso se limita exclusivamente a `customer_dietary_profiles`.
- **Cero propagación**: No se modificó la función global `has_any_staff_role`, protegiendo la superficie de autorización de todas las demás tablas del sistema (`dishes`, `inventory`, `recipes`, etc.).
- **Auditoría**: Los registros de `AuditService` y `updated_at` continúan registrando al actor y la operación.

---

## 11. Tenant Isolation

La cláusula de autorización utiliza la función `public.has_role(auth.uid(), tenant_id, 'operations_manager')`.
Dado que `has_role` evalúa estrictamente:
```sql
SELECT EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = _user_id AND role = _role AND tenant_id = _tenant_id
)
```
un usuario con rol `operations_manager` en el Tenant A tiene garantizado por el motor relacional de PostgreSQL que **no** puede realizar INSERT ni UPDATE en filas pertenecientes al Tenant B.

---

## 12. Decisión sobre `CustomerDietaryService`

**Clasificación: B. Recomendable pero fuera del Hotfix.**

- `CustomerDietaryEditor` realiza actualmente un `upsert` directo a través del cliente Supabase del navegador en lugar de invocar `CustomerDietaryService.saveDietaryProfile`.
- Esta llamada directa **no** fue la causa del defecto; el defecto residía exclusivamente en la política RLS del backend.
- Migrar el componente React para instanciar `ServiceContext` y auditar desde el cliente requeriría refactorizar el flujo de estados y dependencias de la UI administrativa, lo cual excede el alcance de un hotfix de producción y añadiría riesgo no forzado.
- Conforme a las instrucciones del mandato (*"Si NO es necesaria para solucionar el bug, NO la implementes en este Hotfix"*), se mantiene intacta la implementación de la UI y se documenta como deuda técnica recomendada para un próximo sprint de consolidación.

---

## 13. Migración Propuesta

**Ruta**: `supabase/migrations/20261002110000_cr_cust_01_hf01_customer_dietary_profiles_operations_manager_rls.sql`
**Rollback**: `supabase/migrations/rollback/20261002110000_cr_cust_01_hf01_customer_dietary_profiles_operations_manager_rls_down.sql`

Ambos archivos han sido creados localmente y validados sintáctica y lógicamente.

---

## 14. Gates Siguientes

Conforme al protocolo de gobernanza:
```text
DISCOVERY    ✅ Completado
DIAGNOSIS    ✅ Completado
IMPLEMENTATION ✅ Completado
TEST         ✅ 1468/1468 PASS
───────────────────────────────────
PRE-COMMIT   ⏸️ PENDIENTE AUTORIZACIÓN
DB MIGRATION ⏸️ PENDIENTE AUTORIZACIÓN
DEPLOY       ⏸️ PENDIENTE AUTORIZACIÓN
PROD E2E     ⏸️ PENDIENTE AUTORIZACIÓN
```

---

## 15. Riesgo Residual

- **Riesgo Operativo / Regresión**: **NULO**. Los tests demuestran que las autorizaciones previas (`company_admin`, `saas_admin`, roles staff) operan de manera idéntica.
- **Riesgo de Datos**: **NULO**. La migración no añade columnas, no modifica datos existentes y no altera `dietary_snapshot` ni órdenes históricas.
- **Riesgo de Rollback**: **NULO**. En caso de reversión, el script de rollback restaura exactamente las políticas previas de CR-CUST-01.

---

**ESTADO ACTUAL: STOP → REPORT → WAIT.**  
Esperando autorización humana para proceder al gate de **PRE-COMMIT** o **DB MIGRATION**.
