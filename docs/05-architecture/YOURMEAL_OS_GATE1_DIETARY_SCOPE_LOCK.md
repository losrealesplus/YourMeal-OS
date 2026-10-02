# YOURMEAL OS — GATE 1 SCOPE LOCK
## Línea 1: Bucle Dietético Integral (P2 Alertas en OrdersTable + P1 Autoservicio del Cliente)
**Fecha**: 2 Octubre 2026  
**Autoridad de Decisión**: Human Product Authority  
**Fase de Gobernanza**: Gate 1 — Discovery & Scope Lock (NO IMPLEMENTATION)  
**Estado del Repositorio**: `main` en `70952483` (STOP absoluto preservado · 0 mutaciones)  

---

## 1. Executive Summary

El presente documento constituye el **Scope Lock formal de Gate 1** para la **Línea de Intervención 1: Bucle Dietético Integral**, compuesto por:
1. **P2 — Alertas de Alérgenos y Restricciones en OrdersTable (`/admin/orders`)**: Visibilidad inmediata y directa de condiciones dietéticas en la superficie donde se toman las decisiones operativas diarias de cocina y despacho.
2. **P1 — Autoservicio Dietético del Cliente & Verificación del Snapshot (`/app/settings` y `/app/orders/$orderId`)**: Habilitación del registro y edición autónoma por el cliente de sus alérgenos (UE-14 + personalizados), restricciones, preferencias y notas, asegurando la captura automática del `dietary_snapshot` inmutable en cada pedido y su visualización de verificación por el consumidor.

Este Scope Lock se apoya en los cimientos consolidados en **CR-CUST-01** (tabla `customer_dietary_profiles` y columna `orders.dietary_snapshot` activas en base de datos), resolviendo la desconexión existente: la información ya se almacena en base de datos, pero el cliente no puede introducirla por sí mismo y el operador no la ve sin abrir cada pedido individualmente.

**Principio Rector de Gobernanza**:
> *"El perfil dietético informa exclusivamente sobre las condiciones declaradas por el cliente; no certifica por sí mismo la ausencia de alérgenos ni la seguridad alimentaria de un plato."*

---

## 2. Current State (Estado Factual del Repositorio)

### A. Customer App (`src/routes/_authenticated/app.*`)
- **Visualización de perfil**: `app.settings.profile.tsx` muestra Nombre, Email y Teléfono. El botón `PrimaryCTA` ("Editar perfil") está hardcodeado como `disabled` con el mensaje `t("common:comingSoon")`.
- **Configuración dietética**: En `app.settings.tsx` (líneas 68-73), bajo la sección `groupFood`, el ítem `allergies` no tiene propiedad `to` ni handler `onClick`. Es un botón muerto. El ítem `preferences` redirige a `/app/favorites` (platos favoritos), no a preferencias dietéticas.
- **Detalle de pedido**: `app.orders.$orderId.tsx` consume `useOrder(orderId)` y `OrderSummaryView`. No referencia ni renderiza `dietary_snapshot`.
- **Resolución de identidad**: Existe el hook canónico `useCurrentCustomerId()` (`src/hooks/use-current-customer-id.ts`) que resuelve en una sola consulta reactiva el `customer_id` asociado a `auth.uid()`.

### B. Orders Domain (`src/modules/orders/`)
- **Estructura DB**: `orders` cuenta con la columna `dietary_snapshot jsonb` (añadida en migración `20261002100000`).
- **Captura actual**: `staff-order-capture-service.ts` (línea 313) captura el snapshot invocando `buildOrderDietarySnapshot()`. 
- **Brecha descubierta**: En `OrderService.programDraftItems()` (`order-service.ts`, líneas 261-272) —que es el motor utilizado por la Customer App cuando el cliente programa sus pedidos— **NO se inyecta `dietary_snapshot`**. Los pedidos autogestionados por el cliente nacen actualmente con `dietary_snapshot = null`.
- **Inmutabilidad**: El snapshot una vez persistido en `orders.dietary_snapshot` no es alterado por cambios posteriores en `customer_dietary_profiles`.

### C. OrdersTable & Operations (`src/routes/_authenticated/admin.orders.tsx`)
- **Columnas actuales**: `Cliente | Estado | Nº raciones | Fecha | Acción`.
- **Carga de datos**: `OperationsRepository.listOrders()` (línea 74) **ya mapea y carga en memoria** `dietarySnapshot: (row.dietary_snapshot as OrderDietarySnapshot | null) ?? null`.
- **Visualización actual**: La información dietética existe en el objeto `o.dietarySnapshot` de cada fila, pero **solo se renderiza si el operador hace clic y abre el `Sheet` lateral de Ficha de Pedido** (`DietaryBadges` en línea 240+).
- **Componente**: `DietaryBadges` (`src/components/operations/dietary-badges.tsx`) ya implementa un modo compacto (`compact={true}`) optimizado para badges inline (`ShieldAlert` en rojo para alérgenos, `AlertTriangle` en ámbar para restricciones, `Sparkles` en morado para overrides).

### D. Dietary Domain & Permissions (`src/modules/customer-directory/`, `src/types/dietary.ts`)
- **Modelos**: `CustomerDietaryProfile`, `OrderDietarySnapshot`, `EU_ALLERGENS` (14 catálogo estándar), `STANDARD_RESTRICTIONS`, `STANDARD_PREFERENCES` definidos y probados al 100% de cobertura en Vitest.
- **Brecha de RLS descubierta en Gate 1**: La migración `20261002110000` solo permite `INSERT` y `UPDATE` en `customer_dietary_profiles` a roles de staff (`has_any_staff_role`, `operations_manager`, `saas_admin`). **Un usuario con rol `customer` es bloqueado por RLS al intentar guardar su propio perfil**.

---

## 3. Data Flow (Mapa Completo de Datos)

```text
[ CLIENTE EN PORTAL WEB ]
  │
  ├─ 1. Navega a /app/settings/dietary
  │    └─ Consume: CustomerDietaryService.getOwnDietaryProfile()
  │    └─ Source: public.customer_dietary_profiles (WHERE customer_id = my_customer_id)
  │
  ├─ 2. Modifica alérgenos/preferencias y acepta Disclaimer Constitucional
  │    └─ Mutación: CustomerDietaryService.saveOwnDietaryProfile()
  │    └─ DB Target: public.customer_dietary_profiles (UPSERT tenant_id, customer_id)
  │    └─ RLS: Policy customer_dietary_profiles_own_write
  │
  ▼
[ CREACIÓN / PROGRAMACIÓN DE PEDIDO ]
  │
  ├─ 3. Cliente programa menú semanal (/app/schedule)
  │    └─ Service: OrderService.programDraftItems()
  │    └─ Resolución: Consulta customer_dietary_profiles del customer_id
  │    └─ Invocación: buildOrderDietarySnapshot({ customerProfile, override: null })
  │    └─ DB Target: public.orders.dietary_snapshot = JSONB
  │    └─ INMUTABILIDAD CONGELADA: El pedido guarda una foto fija en este instante.
  │
  ▼
[ VISUALIZACIÓN CONSUMIDOR ]
  │
  ├─ 4. Cliente consulta su pedido (/app/orders/$orderId)
  │    └─ Query: useOrder(orderId) -> fetchOrderSummary() -> mapOrderToSummaryView()
  │    └─ Render: <DietaryBadges snapshot={order.dietarySnapshot} />
  │    └─ Verificación: El cliente comprueba qué perfil se aplicó a su comida.
  │
  ▼
[ VISUALIZACIÓN OPERACIONAL ]
  │
  ├─ 5. Centro de Operaciones (/admin/orders)
  │    └─ Query: OperationsRepository.listOrders() -> o.dietarySnapshot
  │    └─ Render en OrdersTable: Columna Cliente muestra <DietaryBadges snapshot={o.dietarySnapshot} compact />
  │    └─ ALERTA VISUAL DIRECTA: 🔴 Alérgeno visible sin necesidad de abrir el drawer.
  │
  ▼
[ COCINA / PACKING ]
  │
  └─ 6. Hoja de Producción y Mesa de Empaquetado (/admin/production-sheet)
       └─ Render: Nivel 1 Cocina (Modificaciones y Alérgenos) + Nivel 2 Packing por Bolsa
       └─ Source: El mismo orders.dietary_snapshot.
```

---

## 4. P2 Functional Specification (Alertas en OrdersTable)

### 4.1 Definición de Alerta Operativa
Una alerta dietética en tabla es una señalética visual de alta prioridad que advierte al operador sobre requerimientos alimentarios especiales que exigen aislamiento o manipulación específica.

### 4.2 Jerarquía de Severidad Visual
1. **Nivel 1: Alérgeno Crítico (Rojo / Destructive)**:
   - Presencia de cualquier alérgeno UE-14 o personalizado.
   - Icono `ShieldAlert` + badge rojo (`bg-rose-600`).
   - Muestra las etiquetas (ej. `🔴 Gluten, Frutos de cáscara`). Si hay más de 2 alérgenos, muestra los 2 primeros y `+N` con tooltip explicativo.
2. **Nivel 2: Restricción Severa (Ámbar / Warning)**:
   - Celíaco estricto, bajo en sodio, diabético.
   - Icono `AlertTriangle` + badge ámbar (`bg-amber-500/10 text-amber-500 border-amber-500/30`).
3. **Nivel 3: Preferencia Culinaria (Verde / Neutral)**:
   - Vegano, vegetariano, sin cerdo, etc.
   - Badge neutro o sólo visible en hover/drawer para no saturar la tabla.
4. **Nivel 4: Override Operacional (Púrpura / Special)**:
   - Pedido donde staff modificó las condiciones dietéticas sólo para esta orden.
   - Badge `Override` + motivo al pasar el ratón.

### 4.3 Reglas de Negocio en OrdersTable
- **Fuente estricta**: Lee exclusivamente de `o.dietarySnapshot`. **NUNCA** hace join dinámico en la tabla con `customer_dietary_profiles` (evita falsos estados si el cliente cambió su perfil después de cocinar o despachar el pedido).
- **Pedido sin restricciones**: Si `dietarySnapshot` es `null` o está vacío, no renderiza ningún badge (espacio limpio).
- **Ubicación en tabla**: Directamente debajo del nombre del cliente en la columna `Cliente`, garantizando que el operador lo asocie de inmediato con la identidad del comensal.

---

## 5. P1 Functional Specification (Autoservicio del Cliente)

### 5.1 Pantalla de Configuración Dietética (`/app/settings/dietary`)
- **Acceso**: Desde `/app/settings`, sección `Alimentación` (`groupFood`) -> `Alergias y Preferencias`.
- **Contenido**:
  1. **Banner Constitucional**: Mensaje legal explicativo permanente:
     > *"El perfil dietético informa a cocina sobre tus condiciones alimentarias declaradas. No certifica por sí mismo la ausencia total de trazas ni la seguridad de un plato. Revisa siempre los alérgenos específicos de cada plato al pedir."*
  2. **Selector de Alérgenos Oficiales (UE-14)**: Grid táctil de 14 botones toggle con iconos y nombres claros (Gluten, Crustáceos, Huevos, Pescado, Cacahuetes, Soja, Lácteos, Frutos de cáscara, Apio, Mostaza, Sésamo, Sulfitos, Altramuces, Moluscos).
  3. **Alérgenos Personalizados**: Campo tag-input para añadir intolerancias específicas (ej. "Kiwi", "Fresa", "Marisco").
  4. **Restricciones Médicas/Nutricionales**: Chips seleccionables (Celíaco, Intolerancia a la Lactosa, Bajo en Sodio, Diabético, Fructosa).
  5. **Preferencias Culinarias**: Chips seleccionables (Vegetariano, Vegano, Pescetariano, Sin Cerdo, Sin Cebolla, etc.).
  6. **Notas Adicionales para Cocina**: Textarea libre para observaciones de preparación.
  7. **Botón Guardar Perfil**: CTA primario con estado de carga, confirmación toast y feedback de guardado exitoso.

### 5.2 Desacoplamiento Temporal: Perfil Actual vs Snapshot de Pedido
```text
LÍNEA TEMPORAL:
[Día 1] Cliente crea Pedido #101 con perfil: [Gluten, Lácteos]
        → orders.dietary_snapshot congelado con [Gluten, Lácteos].

[Día 3] Cliente entra a /app/settings/dietary y elimina Lácteos y añade Cacahuetes.
        → public.customer_dietary_profiles actualizado a [Gluten, Cacahuetes].

RESULTADO:
- Pedido #101 en OrdersTable y Cocina SIGUE MOSTRANDO: [Gluten, Lácteos].
- Próximo Pedido #102 que se cree capturará: [Gluten, Cacahuetes].
```
*Garantía Técnica*: Ningún update en `customer_dietary_profiles` emite triggers ni actualiza `orders.dietary_snapshot`. La inmutabilidad del pedido es absoluta.

### 5.3 Verificación en Resumen de Pedido (`/app/orders/$orderId`)
- Se añade sección en la tarjeta del pedido: `"Condiciones dietéticas aplicadas a este pedido"`.
- Muestra los badges del snapshot congelado.
- Si el snapshot no tenía alérgenos: muestra *"Sin alérgenos declarados en este pedido"*.
- Incluye el disclaimer constitucional en tipografía pequeña.

---

## 6. Data Model

### Tabla Existente: `public.customer_dietary_profiles`
```sql
-- DDL ya presente en producción (Migración 20261002100000)
id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
tenant_id                   uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
customer_id                 uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
allergens                   jsonb NOT NULL DEFAULT '[]'::jsonb,      -- IDs de UE_ALLERGENS
custom_allergens            jsonb NOT NULL DEFAULT '[]'::jsonb,      -- Strings libres
restrictions                jsonb NOT NULL DEFAULT '[]'::jsonb,      -- IDs de STANDARD_RESTRICTIONS
preferences                 jsonb NOT NULL DEFAULT '[]'::jsonb,      -- IDs de STANDARD_PREFERENCES
dietary_notes               text,                                     -- Texto libre
created_at                  timestamptz NOT NULL DEFAULT now(),
updated_at                  timestamptz NOT NULL DEFAULT now(),
CONSTRAINT uq_customer_dietary_tenant UNIQUE (tenant_id, customer_id)
```

### Tabla Existente: `public.orders`
```sql
-- Columna ya presente en producción (Migración 20261002100000)
dietary_snapshot            jsonb DEFAULT NULL
-- Estructura de OrderDietarySnapshot:
-- {
--   "capturedAt": "2026-10-02T10:00:00.000Z",
--   "allergens": ["gluten", "milk"],
--   "customAllergens": ["kiwi"],
--   "restrictions": ["celiac"],
--   "preferences": ["no_pork"],
--   "dietaryNotes": "Separar salsas",
--   "isOverride": false,
--   "overrideReason": null,
--   "authorUserId": "uuid"
-- }
```

---

## 7. Technical Contract

### Elementos Clasificados por Acción:

| Componente / Archivo | Clasificación | Justificación |
|---|:---:|---|
| `supabase/migrations/20261002120000_customer_dietary_self_service_rls.sql` | `[CREATE]` | Permite al cliente autenticado (`auth.uid()`) hacer SELECT, INSERT y UPDATE de su propio `customer_dietary_profile`. |
| `src/routes/_authenticated/app.settings.dietary.tsx` | `[CREATE]` | Nueva ruta canónica para el autoservicio de configuración dietética del cliente. |
| `src/routes/_authenticated/app.settings.tsx` | `[MODIFY]` | Enlazar `allergies` a `/app/settings/dietary`. |
| `src/routes/_authenticated/app.orders.$orderId.tsx` | `[MODIFY]` | Renderizar `DietaryBadges` con el snapshot del pedido en el resumen del consumidor. |
| `src/routes/_authenticated/admin.orders.tsx` | `[MODIFY]` | Insertar `<DietaryBadges snapshot={o.dietarySnapshot} compact />` en la columna Cliente de `OrdersTable`. |
| `src/modules/orders/application/order-service.ts` | `[MODIFY]` | En `programDraftItems()`, resolver el `customer_dietary_profiles` del cliente y grabarlo en `orders.dietary_snapshot`. |
| `src/modules/orders/application/order-summary-mapper.ts` | `[MODIFY]` | Añadir `dietarySnapshot: order.dietary_snapshot` al view model `OrderSummaryView`. |
| `src/modules/customer-directory/application/customer-dietary-service.ts` | `[MODIFY]` | Añadir `getOwnDietaryProfile(ctx)` y `saveOwnDietaryProfile(ctx, input)` con validación de identidad. |
| `src/components/operations/dietary-badges.tsx` | `[REUSE]` | Componente UI ya preparado con modo `compact` e iconos visuales. |
| `src/types/dietary.ts` | `[REUSE]` | Tipos, catálogos UE-14, helpers y `buildOrderDietarySnapshot()` al 100% compatibles. |
| `src/hooks/use-current-customer-id.ts` | `[REUSE]` | Hook para resolución segura del `customerId` propio. |

---

## 8. Core vs Vertical Food vs Instance

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ PLATFORM CORE                                                               │
│ - orders.dietary_snapshot: Columna JSONB genérica en tabla orders.         │
│ - OrdersTable: Capacidad de renderizar badges informativos de metadatos.    │
│ - OrderService: Hook de captura de snapshot al persistir borradores.       │
│ - Identity / useCurrentCustomerId: Resolución de auth.uid() a customer_id.   │
├─────────────────────────────────────────────────────────────────────────────┤
│ VERTICAL PACK: FOOD & CATERING                                              │
│ - Catálogo oficial UE-14 (EU_ALLERGENS).                                    │
│ - customer_dietary_profiles: Esquema de almacenamiento de preferencias.     │
│ - CustomerDietaryService: Lógica de validación de alérgenos y restricciones.│
│ - DietaryBadges: Componente visual semántico de seguridad alimentaria.     │
│ - Interfaz /app/settings/dietary: Formulario especializado de nutrición.    │
├─────────────────────────────────────────────────────────────────────────────┤
│ INSTANCE LAYER (EatClean Tenerife)                                          │
│ - Textos legales localizados (ES-es).                                       │
│ - Identificador de tenant en runtime.                                       │
│ - Cero lógica hardcodeada en Core ni en Vertical Pack.                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Tenant #2 Test (Validación Multi-Tenant Conceptual)

*Escenario de prueba*: Mañana se provisiona un nuevo tenant de catering saludable: `healthy-bites.yourmealos.com` (Tenant ID: `t-hb-002`).

- ¿Requiere cambiar código de la Customer App?: **NO**. `/app/settings/dietary` usa `useAuth().tenantId` y `useCurrentCustomerId()`.
- ¿Requiere cambiar lógica en OrdersTable?: **NO**. `OperationsRepository` filtra estrictamente por `tenant_id`.
- ¿Existe algún slug hardcodeado de EatClean en el dominio dietético?: **NO**. `src/types/dietary.ts`, `customer-dietary-service.ts` y las tablas de base de datos están 100% aisladas por `tenant_id`.
- **Dictamen Tenant #2**: **APROBADO (Cero Leaks en Dominio Dietético)**.

---

## 10. Edge Cases Analizados

1. **Cliente sin ninguna restricción**: `dietary_snapshot` se guarda como `null` (o con arrays vacíos). Ni `OrdersTable` ni el resumen del pedido muestran advertencias ruidosas.
2. **Cliente con múltiples alergias (ej. 7 alérgenos)**: `DietaryBadges` en modo `compact` renderiza las 2 primeras etiquetas y `+5 más` con popover descriptivo para no deformar la fila de la tabla.
3. **Modificación de perfil con pedido en curso**: Un cliente cambia su perfil el martes tras haber confirmado un pedido el lunes. El pedido del lunes mantiene inalterado su snapshot original. Si cocina necesita saber el nuevo perfil, la Ficha de Pedido en drawer muestra el snapshot del pedido y un badge secundario `"Perfil actual del cliente actualizado posteriormente"`.
4. **Pedido creado por Administrador vía Universal Intake vs por Cliente en Web**: Ambos terminan invocando `buildOrderDietarySnapshot()`. El intake de admin permite `override` con motivo obligatorio (≥5 caracteres). El autoservicio del cliente toma automáticamente su perfil sin override.
5. **Cliente perteneciente a múltiples compañías (B2B)**: El `customer_dietary_profile` está ligado a `(tenant_id, customer_id)`, no a la empresa. Las alergias del individuo viajan con él independientemente de la sede o empresa desde la que ordene.
6. **Snapshot corrupto o JSON incompleto**: `DietaryBadges` y `hasAllergenAlerts` validan con defensas `Array.isArray()` contra nulos/indefinidos sin provocar pantalla blanca (White Screen of Death).
7. **Pérdida de conectividad al guardar perfil**: Manejo de errores con Sonner toast y botón de reintento.

---

## 11. Security / RLS (Auditoría de Acceso)

### Hallazgo de Gate 1:
La política actual `customer_dietary_profiles_write` requiere roles de staff. Para habilitar P1 sin comprometer la seguridad:

```sql
-- DDL para Migración de Scope Lock en Gate 6:
-- 1. Política de lectura propia para el cliente
CREATE POLICY customer_dietary_profiles_client_read ON public.customer_dietary_profiles
  FOR SELECT TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM public.customers 
      WHERE user_id = auth.uid() AND tenant_id = customer_dietary_profiles.tenant_id
    )
  );

-- 2. Política de escritura propia para el cliente
CREATE POLICY customer_dietary_profiles_client_write ON public.customer_dietary_profiles
  FOR INSERT TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.customers 
      WHERE user_id = auth.uid() AND tenant_id = customer_dietary_profiles.tenant_id
    )
  );

-- 3. Política de actualización propia para el cliente
CREATE POLICY customer_dietary_profiles_client_update ON public.customer_dietary_profiles
  FOR UPDATE TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM public.customers 
      WHERE user_id = auth.uid() AND tenant_id = customer_dietary_profiles.tenant_id
    )
  )
  WITH CHECK (
    customer_id IN (
      SELECT id FROM public.customers 
      WHERE user_id = auth.uid() AND tenant_id = customer_dietary_profiles.tenant_id
    )
  );
```
*Invariante de Aislamiento*: Un cliente autenticado jamás puede leer ni mutar el perfil dietético de otro cliente ni de otro tenant.

---

## 12. Test Plan (Matriz de Verificación para Implementación)

### 1. Tests Unitarios (Vitest)
- [ ] Validación de `resolveAllergenLabels` con arrays mixtos (estándar + custom).
- [ ] Validación de `OrderService.programDraftItems` asegurando que persiste `dietary_snapshot`.
- [ ] Validación de `mapOrderToSummaryView` mapeando correctamente `dietarySnapshot`.

### 2. Tests de Integración RLS (Supabase Local / Multi-tenant)
- [ ] Test: Cliente autenticado guarda exitosamente su perfil dietético.
- [ ] Test: Cliente A intenta modificar el perfil dietético del Cliente B -> RECHAZADO por RLS (0 rows affected / error).
- [ ] Test: Cliente intenta inyectar `tenant_id` de otro tenant -> RECHAZADO por RLS.

### 3. Tests E2E en Navegador Real (Chromium Headless)
- [ ] Flujo 1: Login de cliente -> `/app/settings` -> clic en Alergias -> marcar "Gluten" y "Lácteos" -> Guardar -> Ver toast de éxito -> Recarga y verificar persistencia.
- [ ] Flujo 2: Cliente con perfil realiza pedido semanal -> Verificar en `/app/orders/$orderId` que aparecen los badges de Gluten y Lácteos en el resumen.
- [ ] Flujo 3: Login como Administrador/Operaciones -> Navegar a `/admin/orders` -> Verificar que la fila de dicho pedido muestra los badges 🔴 en `OrdersTable`.

---

## 13. Dependencies

- **Pre-requisitos completados**: CR-CUST-01 (Commit `70952483`, Supabase DDL migrado en producción, tipos en `src/types/dietary.ts`).
- **Dependencias de esta línea**: Migración RLS para autoservicio de cliente (`customer_dietary_profiles_client_*`).
- **Bloqueos a otras líneas**: Esta línea **desbloquea P7 (Multi-fecha)** y **P3 (Batch Operations)** porque dota a la tabla de órdenes de la semántica dietética completa antes de las acciones masivas.

---

## 14. IN SCOPE

- [x] Nueva pantalla de autoservicio dietético en `/app/settings/dietary`.
- [x] Enlace activo en `/app/settings` hacia `/app/settings/dietary`.
- [x] Migración RLS en Supabase para permitir a clientes editar su propio perfil dietético.
- [x] Captura automática de `dietary_snapshot` en pedidos generados desde la Customer App (`OrderService.programDraftItems`).
- [x] Visualización del `dietary_snapshot` en la pantalla de resumen del pedido del cliente (`/app/orders/$orderId`).
- [x] Renderizado de badges dietéticos compactos (`DietaryBadges compact`) en la columna Cliente de `OrdersTable` en `/admin/orders`.
- [x] Tratamiento de alérgenos UE-14 + personalizados + restricciones estándar + preferencias culinarias + notas.

---

## 15. OUT OF SCOPE

- [ ] Motor automático de cruce receta -> ingredientes -> alérgenos (se mantiene para fase posterior).
- [ ] Bloqueo prohibitivo de pedidos por incompatibilidad de alérgenos (V1 es exclusivamente informativo y preventivo).
- [ ] Algoritmos de recomendación médica o diagnósticos nutricionales por IA.
- [ ] Rediseño general de la Customer App o del Centro de Operaciones.
- [ ] Acciones masivas por lotes (pertenece a P3).
- [ ] Reestructuración logística de rutas (pertenece a P5).

---

## 16. Risks & Mitigation

| Riesgo Identificado | Severidad | Mitigación Arquitectónica |
|---|:---:|---|
| **Falsa garantía de seguridad alimentaria** (cliente asume que declarar su alergia garantiza plato estéril) | **Alta** | Presencia obligatoria del Disclaimer Constitucional en la pantalla de perfil y en el resumen de pedido. |
| **Escritura no autorizada en perfiles ajenos** | **Alta** | RLS a nivel de fila verificado por `user_id = auth.uid()` en base de datos PostgreSQL, no en cliente. |
| **Saturación visual de OrdersTable** con clientes de múltiples alérgenos | **Media** | Badges truncados con contador `+N` y popover en modo `compact`. |
| **Desincronización de pedidos históricos** si el cliente borra su alérgeno | **Media** | Inmutabilidad forzada: `orders.dietary_snapshot` no se recalcula en updates de perfil. |

---

## 17. Estimated Complexity (Escala 1 a 5)

- **Database / RLS**: `2.0` (Políticas de seguridad bien delimitadas para `auth.uid()`).
- **Backend / Services**: `1.5` (Conectar `OrderService.programDraftItems` al snapshot builder ya probado).
- **Frontend Customer App**: `2.5` (Pantalla accesible, táctil y limpia con componentes existentes de Shadcn/Tailwind).
- **Frontend OrdersTable**: `1.5` (Incrustar `<DietaryBadges compact />` en celda existente).
- **QA & E2E Verification**: `2.0` (Scripts automatizados en Chromium ya estandarizados).
- **Complejidad Global P2 + P1**: **`2.0 / 5.0` (Baja-Media · Alto Retorno / Bajo Riesgo)**.

---

## 18. Acceptance Criteria (Criterios de Aceptación para Gates Posteriores)

1. **AC-1 (Autoservicio)**: Un cliente logueado en `/app/settings/dietary` puede seleccionar "Gluten" y "Lácteos", escribir notas y pulsar Guardar. Al recargar la página, los datos permanecen intactos.
2. **AC-2 (Seguridad RLS)**: Una petición simulada de un cliente intentando insertar un registro para otro `customer_id` es rechazada con error de política RLS por Supabase.
3. **AC-3 (Captura Snapshot)**: Cuando el cliente confirma un pedido desde `/app`, el registro correspondiente en la tabla `orders` contiene `dietary_snapshot` con los datos declarados en ese momento.
4. **AC-4 (Verificación Cliente)**: En `/app/orders/$orderId`, el cliente visualiza con claridad qué alérgenos y notas quedaron asociados a su pedido.
5. **AC-5 (Alerta Operativa)**: En `/admin/orders`, la fila de dicho pedido muestra inmediatamente el badge rojo con icono de escudo y las etiquetas de alérgenos sin necesidad de abrir el drawer.
6. **AC-6 (Inmutabilidad)**: Si el cliente modifica su perfil a "Sin alérgenos", el pedido anterior en `/admin/orders` sigue mostrando "Gluten y Lácteos".

---

## 19. Implementation Sequence (Secuencia de Gates de Ejecución)

```text
Gate 1 — Discovery & Scope Lock           🟢 [ESTADO ACTUAL · APROBACIÓN PENDIENTE]
Gate 2 — Scope Lock Ratification          🔒 Esperando confirmación de Human Product Authority
Gate 3 — Implementation Worktree Setup   🔒 Apertura de rama aislada sin tocar main
Gate 4 — Hardening & Component Build     🔒 Código de P2 + P1 y suite de tests unitarios
Gate 5 — Pre-commit Packaging & Audit    🔒 Revisión de diff, linters y build en verde
Gate 6 — Database Migration              🔒 Aplicación de RLS customer-own en Supabase
Gate 7 — Deployment Pipeline             🔒 Despliegue en Cloudflare Worker
Gate 8 — E2E Production Verification    🔒 Verificación en navegador real con capturas
```

---

## 20. Open Questions (Decisiones Técnicas Menores Resueltas)
- *¿Dónde ubicar la pantalla dietética?*: En `/app/settings/dietary`, vinculada desde el ítem `Alérgenos` en `/app/settings`, manteniendo `/app/settings/profile` estrictamente para datos personales (nombre, email, teléfono).
- *¿Cómo tratar los pedidos sin alérgenos?*: Silencio visual en tabla de órdenes para preservar la ergonomía limpia y destacar únicamente las excepciones que exigen atención.

---

## 21. Gate 1 Exit Criteria Checklist

- [x] Current State documentado exhaustivamente con archivos y líneas de código.
- [x] Data Flow documentado desde el cliente hasta la mesa de operaciones.
- [x] P1 cerrado funcional y técnicamente (autoservicio y verificación).
- [x] P2 cerrado funcional y técnicamente (alertas visuales en tabla).
- [x] Data Model y columnas identificadas.
- [x] Separación Core / Vertical Food / Instance definida.
- [x] Tenant #2 Test conceptual ejecutado con veredicto APROBADO.
- [x] 7 Edge Cases críticos documentados y mitigados.
- [x] Auditoría de Seguridad / RLS completada con DDL propuesto.
- [x] Test Plan de 3 niveles (Unit, RLS, E2E) definido.
- [x] IN SCOPE y OUT OF SCOPE cerrados formalmente.
- [x] Dependencias y riesgos identificados.
- [x] Criterios de Aceptación (AC-1 a AC-6) fijados.
- [x] Repositorio 100% intacto, en STOP y sin mutaciones.

---

## 🚨 DECISIONES QUE REQUIEREN HUMAN PRODUCT AUTHORITY

Para emitir la ratificación del Scope Lock y proceder a las siguientes fases, se somete a la decisión de Human Product Authority únicamente las dos decisiones estratégicas fundamentales:

1. **Ubicación del Enlace en la Customer App**:
   - **Opción A (Recomendada)**: Crear `/app/settings/dietary` y activarlo como enlace en la sección `Alimentación` de `/app/settings` (donde hoy existe el botón inerte `Alergias`).
   - **Opción B**: Integrar la selección dietética dentro de `/app/settings/profile` debajo del nombre y teléfono.
2. **Autorización del Scope Lock**:
   - ¿Ratifica formalmente Human Product Authority el alcance aquí delimitado para **P2 + P1** como `CR-OPS-DIET-01`, manteniendo el repositorio congelado hasta recibir la instrucción explícita de apertura de Gate 3/4?

---
*Fin del Documento de Scope Lock de Gate 1 · El repositorio permanece en STOP absoluto.*
