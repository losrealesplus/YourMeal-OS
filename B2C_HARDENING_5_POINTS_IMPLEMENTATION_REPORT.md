# Informe de Hardening y Sello de Calidad B2C (5 Puntos Críticos)

**Fecha:** 18 de octubre de 2026  
**Rama:** `fix/b2c-hardening-5-points`  
**Base:** `origin/main` (`34d588de` tras merge de PR #542)  
**Estado:** ✅ **100 % Certificado (0 errores TypeScript, 2.229/2.229 tests pasando en 335 suites)**  

---

## 📋 Resumen Ejecutivo

Siguiendo la evaluación experta y la autorización del usuario para aplicar el **Sello de Calidad y Hardening**, hemos implementado con precisión quirúrgica las 5 protecciones esenciales sobre el monorepo de YourMeal OS:

1. **P0 · Validación Estricta de Corte en Servidor (`WEEKLY_ORDER_CUTOFF_PASSED`):**
   - El backend ya no confía exclusivamente en el cliente.
   - En `CanonicalOrderWriteService` (`capture` y `modify`), en `OrderIntakeService.intakeDraft` y en `OrderService.confirm`, se evalúa la fecha del servidor en la zona horaria del tenant (`Atlantic/Canary` para EatClean).
   - Si la petición de pedido corresponde a una semana cuyo corte comercial (Viernes 14:00h) ya ha vencido, el servidor rechaza la transacción con el error canónico tipado `WEEKLY_ORDER_CUTOFF_PASSED`.

2. **P1 · Multi-tenancy en Configuración de Calendarios y Horarios:**
   - Se eliminó el hardcoding de reglas de EatClean como valor global de YourMeal OS.
   - `DEFAULT_SCHEDULE_CONFIG` adopta la configuración peninsular estándar (`Europe/Madrid`, L–V, corte viernes 14:00h).
   - `getTenantScheduleConfig()` acepta `tenantSlug`, `tenantTimezone` y `scheduleConfig` dinámicos, aislando las particularidades canarias a los tenants `eatclean` y `eatclean-staging`, permitiendo que cualquier otro tenant configure su propia zona horaria y días de entrega.

3. **P1 · Alérgenos Oficiales de la Unión Europea (UE-14) en el Onboarding:**
   - El paso 4 del modal de bienvenida (`CustomerWelcomeModal`) fue transformado de una pantalla puramente informativa a un selector interactivo completo de los 14 alérgenos de la Directiva UE (Reglamento UE 1169/2011).
   - Incorpora el botón exclusivo "Sin alérgenos conocidos" (que limpia selecciones).
   - Al pulsar "Guardar y empezar a programar", hace `upsert` directo a la tabla `customer_dietary_profiles`.
   - Incorpora el botón "Saltar por ahora" para no bloquear la experiencia de compra.

4. **P1 · Erradicación Definitiva de "Las Palmas de Gran Canaria":**
   - El input de ciudad/municipio en `CustomerWelcomeModal` nace ahora completamente vacío (`""`), sin forzar datos geográficos erróneos.
   - Placeholders ajustados a la realidad operativa de Tenerife: `"Santa Cruz de Tenerife, La Laguna..."` y código postal `"38001"`.

5. **P1 · Manejo Fino de Errores de Permisos (`PERMISSION_DENIED` vs `EXPLICIT_ONBOARDING_REQUIRED`):**
   - En `/app/schedule.tsx`, se disociaron completamente las causas de error:
     - `EXPLICIT_ONBOARDING_REQUIRED`: Único caso que abre el modal de onboarding para crear la ficha en `public.customers`.
     - `WEEKLY_ORDER_CUTOFF_PASSED`: Muestra toast de advertencia informando del cierre del plazo comercial de esa semana.
     - `PERMISSION_DENIED`: Muestra toast de error de autorización sin atrapar al usuario en un bucle repetitivo de onboarding.

---

## 🔍 Detalle de Cambios en Código

### 1. `src/domain/errors.ts`
- Añadido `"WEEKLY_ORDER_CUTOFF_PASSED"` al tipo unión canónico `DomainErrorCode`.

### 2. `src/modules/weekly-menu/application/week-dates.ts`
- `DEFAULT_SCHEDULE_CONFIG`: Configurado con `timezone: "Europe/Madrid"`.
- `getTenantScheduleConfig()`: Soporta objeto `TenantScheduleConfigOptions` (`tenantSlug`, `tenantTimezone`, `scheduleConfig`).
- `resolveTenantActiveWeek()`: Recibe `tenantTimezone` y `scheduleConfig` opcionales.
- `isWeeklyOrderCutoffPassed(weekStart, options)`: Nueva función pura que valida si una semana ha superado el corte del tenant.

### 3. `src/modules/orders/application/canonical-order-write-service.ts`
- Validación de corte en `capture()` y `modify()`:
  ```typescript
  if (!hasStaffAccess(ctx.roles) && ctx.tenantSlug) {
    if (isWeeklyOrderCutoffPassed(parsed.command.weekStart, { tenantSlug: ctx.tenantSlug })) {
      throw new DomainError(
        "WEEKLY_ORDER_CUTOFF_PASSED",
        `El plazo para realizar pedidos de la semana ${parsed.command.weekStart} ha finalizado.`,
        { weekStart: parsed.command.weekStart, tenantSlug: ctx.tenantSlug },
      );
    }
  }
  ```

### 4. `src/modules/order-intake/application/order-intake-service.ts`
- En `intakeDraft()`: Se evalúa `options?.validateCutoff` y se rechaza con `WEEKLY_ORDER_CUTOFF_PASSED` si ha vencido.

### 5. `src/modules/orders/application/order-service.ts`
- `ProgramDraftItemsOptions`: Añadido campo `validateCutoff?: boolean`.
- En `confirm()`: Añadido parámetro `validateCutoff?: boolean`. Si está activo y el usuario no es staff, valida el corte comercial antes de ejecutar la confirmación.

### 6. `src/hooks/use-program-draft-order.ts` y `src/hooks/use-confirm-order.ts`
- Ambos hooks transmiten `validateCutoff: true` hacia el backend en las operaciones de self-service de clientes.

### 7. `src/components/consumer/customer-welcome-modal.tsx`
- Estado de ciudad inicializado en `""`.
- Placeholders de Tenerife (`Santa Cruz de Tenerife`, `38001`).
- Paso 4 integrado con `EU_ALLERGENS` de `@/types/dietary`, botón "Sin alérgenos conocidos", persistencia a `customer_dietary_profiles` y opción de salto.

### 8. `src/routes/_authenticated/app.schedule.tsx`
- Separación estricta de `PERMISSION_DENIED` frente a `EXPLICIT_ONBOARDING_REQUIRED` y `WEEKLY_ORDER_CUTOFF_PASSED`.
- Verificación de seguridad de cuenta (`customerQuery.isError`).

---

## 🧪 Matriz de Certificación y Tests

| Área / Prueba | Resultado | Métrica |
|---|---|---|
| **TypeScript Typecheck** (`tsc --noEmit`) | ✅ **0 errores** | Limpio al 100 % |
| **`week-dates.spec.ts`** | ✅ **19 / 19 PASS** | Incluye multi-tenancy y cutoff tests |
| **`canonical-order-write-service.spec.ts`** | ✅ **12 / 12 PASS** | Incluye test de rechazo de corte |
| **`customer-welcome-modal.spec.tsx`** | ✅ **4 / 4 PASS** | Valida ausencia de Las Palmas y alérgenos UE |
| **`use-confirm-order.spec.tsx`** | ✅ **1 / 1 PASS** | Valida paso de `validateCutoff: true` |
| **`use-program-draft-order.spec.tsx`** | ✅ **1 / 1 PASS** | Valida paso de `validateCutoff: true` |
| **`app.schedule.spec.tsx`** | ✅ **1 / 1 PASS** | Carrito multidía verificado |
| **Monorepo Suite Completa** | ✅ **2.229 / 2.229 PASS** | **335 test files ejecutados en 7,39s** |

---

## 🚦 Cumplimiento de Gobernanza (STRICT STOP)

- **Producción intacta:** No se han realizado modificaciones, conexiones ni migraciones a entornos productivos.
- **Rama aislada:** Todo el trabajo reside localmente en `fix/b2c-hardening-5-points`.
- **Siguiente paso:** Crear el commit convencional y subir la rama a GitHub para revisión en Pull Request.
