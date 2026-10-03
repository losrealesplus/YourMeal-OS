# 🏛️ CR-UX-CLIENT-01 · GATE 3 AUDIT REPORT
## DIRECCIONES & PERFIL DIETÉTICO / ALÉRGENOS AUDIT

```text
CR-UX-CLIENT-01 · GATE 3
FECHA: 2026-10-03
ESTADO: AUDITORÍA COMPLETADA (PASS CON OBSERVACIONES ARQUITECTÓNICAS)
ACTOR SINTÉTICO: Winnie Pooh (e2e.winnie.pooh.synthetic@yourmealos.test)
TENANT: 8bba00ba-331b-42c8-9283-4e3836ffb870 (eatclean)
```

---

## 1. 🎯 OBJETIVOS DE GATE 3

Auditar exhaustivamente la arquitectura, contratos de datos, interfaz de usuario (Customer App y Centro de Operaciones), persistencia y políticas RLS para:
1. **Direcciones de Entrega (`customer_addresses`)**: Gestión self-service del cliente, direcciones por defecto, y su propagación hacia el flujo de pedidos y servicios de entrega.
2. **Perfil Dietético, Alérgenos UE-14 y Restricciones (`customer_dietary_profiles`)**: Configuración self-service, cumplimiento normativo y constitucional de seguridad alimentaria, inmutabilización en `orders.dietary_snapshot` y sincronización con el Centro de Operaciones (P1 Cocina y Ficha de Producción).

---

## 2. 🗺️ ARQUITECTURA Y MAPEO DE COMPONENTES

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               CUSTOMER APPLICATION                                     │
│                                                                                        │
│   /app/addresses                         /app/settings/dietary                         │
│   (src/routes/.../app.addresses.tsx)     (src/routes/.../app.settings.dietary.tsx)     │
│             │                                           │                              │
│             ▼                                           ▼                              │
│   public.customer_addresses              public.customer_dietary_profiles              │
│   (RLS: is_customer_owner)               (RLS: is_customer_owner - CR-OPS-DIET-01)      │
└─────────────────────────────────────┬───────────────────┬──────────────────────────────┘
                                      │                   │
                                      ▼                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              ORDER INTAKE & LIFECYCLE                                  │
│                                                                                        │
│   OrderIntakeService.intakeDraft / OrderService.programDraftItems                      │
│   - Resuelve customerId (Individual Customer ADR 0015)                                 │
│   - Lee public.customer_dietary_profiles                                               │
│   - Congela: buildOrderDietarySnapshot() ──► public.orders.dietary_snapshot            │
│   - Auto-crea delivery_services (CR-OPS-06)                                            │
└─────────────────────────────────────┬───────────────────┬──────────────────────────────┘
                                      │                   │
                                      ▼                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               OPERATIONS CENTER (ADMIN)                                │
│                                                                                        │
│   /admin/customers                       /admin/orders & /admin/production-sheet       │
│   - Visualiza y edita DietaryEditor      - DietaryBadges (compacto y extendido)        │
│   - ⚠️ Falta lista de direcciones B2C    - P1 Kitchen Engine: 🔴 Alérgenos /           │
│                                            🟡 Preferencias / 🟢 Estándar               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. 🔍 HALLAZGOS Y AUDITORÍA DETALLADA

### 3.1. Direcciones de Entrega (`public.customer_addresses`)

#### A. Implementación en Customer App
- **Ruta**: `/app/addresses` ([`src/routes/_authenticated/app.addresses.tsx`](file:///Users/alex/Developer/YourMeal-OS/src/routes/_authenticated/app.addresses.tsx)).
- **Capacidades**:
  - Listado ordenado por `is_default DESC, label ASC`.
  - Creación con `label`, `street`, `city`, `zip`, `is_default`.
  - Marcado de dirección predeterminada (`setDefault.mutate(id)`).
  - Eliminación de direcciones (`remove.mutate(id)`).
- **Seguridad RLS**:
  - En [`supabase/migrations/20260723193459_41cf7a3a-71c9-4f23-8d9d-f41660ade316.sql`](file:///Users/alex/Developer/YourMeal-OS/supabase/migrations/20260723193459_41cf7a3a-71c9-4f23-8d9d-f41660ade316.sql):
    ```sql
    CREATE POLICY caddr_all ON public.customer_addresses
      FOR ALL TO authenticated
      USING (
        has_any_staff_role(auth.uid(), tenant_id)
        OR is_saas_admin(auth.uid())
        OR is_customer_owner(customer_id)
      );
    ```
  - ✅ **RLS Validado**: El cliente B2C solo puede leer, insertar y modificar sus propias direcciones.

#### B. Desconexiones Detectadas (Gaps)
1. **Desconexión en el Checkout (`/app/schedule`)**:
   - En el Paso 3 (Resumen del pedido en [`src/routes/_authenticated/app.schedule.tsx:396-401`](file:///Users/alex/Developer/YourMeal-OS/src/routes/_authenticated/app.schedule.tsx#L396-L401)), la dirección mostrada está hardcodeada como `{t("customer:addressHomeDefault")}` ("Dirección habitual").
   - `ScheduleFlow` no permite seleccionar entre las direcciones registradas del cliente ni envía `deliveryAddressId` en el payload de `useProgramDraftOrder`.
2. **Desconexión en la Creación de `delivery_services` (CR-OPS-06)**:
   - En [`src/modules/operations/infrastructure/operations-repository.ts:321-344`](file:///Users/alex/Developer/YourMeal-OS/src/modules/operations/infrastructure/operations-repository.ts#L321-L344):
     `createDeliveryServicesForOrder` asigna `delivery_address_id: order.siteId ?? null` y solo construye el snapshot de dirección si existe `order.siteAddress` (modelo B2B).
   - Para clientes individuales B2C, la dirección queda como `{ unresolved: true, reason: "no_address_at_intake" }` si no se enlaza con la dirección por defecto de `customer_addresses`.
3. **Visibilidad en Operaciones (`/admin/customers`)**:
   - En [`src/routes/_authenticated/admin.customers.tsx`](file:///Users/alex/Developer/YourMeal-OS/src/routes/_authenticated/admin.customers.tsx), la ficha del cliente muestra la empresa y sitio B2B (`s.address`), pero **no lista las direcciones de entrega personales** de `public.customer_addresses`.

---

### 3.2. Perfil Dietético & Alérgenos (`public.customer_dietary_profiles`)

#### A. Implementación en Customer App
- **Ruta**: `/app/settings/dietary` ([`src/routes/_authenticated/app.settings.dietary.tsx`](file:///Users/alex/Developer/YourMeal-OS/src/routes/_authenticated/app.settings.dietary.tsx)).
- **Componente**: [`CustomerDietaryEditor`](file:///Users/alex/Developer/YourMeal-OS/src/components/admin/customer-dietary-editor.tsx).
- **Cobertura Funcional**:
  - ✅ **Disclaimer Constitucional**: Renderiza `CONSTITUTIONAL_DIETARY_DISCLAIMER` obligatorio de seguridad alimentaria.
  - ✅ **14 Alérgenos UE**: Selección interactiva de los 14 alérgenos de declaración obligatoria (Reglamento UE 1169/2011).
  - ✅ **Tags Personalizados**: Inserción y eliminación de alérgenos custom.
  - ✅ **Restricciones y Preferencias**: Opciones estándar (celíaco, vegetariano, vegano, keto, etc.).
  - ✅ **Notas de Cocina**: Campo de texto libre para indicaciones especiales al equipo de cocina.
- **Seguridad RLS**:
  - En [`supabase/migrations/20261002120000_cr_ops_diet_01_customer_dietary_profiles_client_rls.sql`](file:///Users/alex/Developer/YourMeal-OS/supabase/migrations/20261002120000_cr_ops_diet_01_customer_dietary_profiles_client_rls.sql):
    ```sql
    CREATE POLICY customer_dietary_profiles_read ON public.customer_dietary_profiles
      FOR SELECT TO authenticated
      USING (is_tenant_member(tenant_id) OR is_saas_admin(auth.uid()) OR is_customer_owner(customer_id));

    CREATE POLICY customer_dietary_profiles_write ON public.customer_dietary_profiles
      FOR INSERT TO authenticated
      WITH CHECK (has_any_staff_role(auth.uid(), tenant_id) OR has_role(auth.uid(), tenant_id, 'operations_manager') OR is_saas_admin(auth.uid()) OR is_customer_owner(customer_id));

    CREATE POLICY customer_dietary_profiles_update ON public.customer_dietary_profiles
      FOR UPDATE TO authenticated
      USING (has_any_staff_role(auth.uid(), tenant_id) OR has_role(auth.uid(), tenant_id, 'operations_manager') OR is_saas_admin(auth.uid()) OR is_customer_owner(customer_id));
    ```
  - ✅ **RLS Validado**: El cliente tiene permisos plenos de lectura, creación y actualización de su propio perfil dietético. DELETE permanece restringido al staff.

#### B. Integración con Pedidos y Centro de Operaciones
- **Inmutabilidad en Pedidos**:
  - En [`src/modules/orders/application/order-service.ts:271-309`](file:///Users/alex/Developer/YourMeal-OS/src/modules/orders/application/order-service.ts#L271-L309): Al programar un pedido, `OrderService` consulta `customer_dietary_profiles`, construye `dietarySnapshot` vía `buildOrderDietarySnapshot()`, y lo persiste de forma inmutable en `orders.dietary_snapshot`.
- **Consumo en Cocina (CR-OPS-07)**:
  - En [`src/routes/_authenticated/admin.orders.tsx`](file:///Users/alex/Developer/YourMeal-OS/src/routes/_authenticated/admin.orders.tsx): Muestra `DietaryBadges` con las etiquetas de alérgenos y restricciones en listas y fichas de pedido.
  - En `ProductionKitchenEngine`: Clasifica automáticamente las raciones en:
    - 🔴 **Food Safety Allergen Segregation**: Lotes aislados con badge de seguridad.
    - 🟡 **Preferences & Custom Modifications**: Lotes adaptados.
    - 🟢 **Standard Production**: Lotes sin restricciones.

---

## 4. 🧪 ESCENARIOS DE VALIDACIÓN SINTÉTICA (WINNIE POOH)

```text
USUARIO SINTÉTICO:
- ID: Winnie Pooh (e2e.winnie.pooh.synthetic@yourmealos.test)

ESCENARIO 1 · DIRECCIONES DE ENTREGA:
- Dirección 1: "Cueva del Bosque", Calle Árbol Hueco 100, 28001 Madrid (is_default: true)
- Dirección 2: "Oficina del Bosque de los Cien Acres", Av. de la Miel 50, 28002 Madrid (is_default: false)
- Resultado esperado en DB: 2 filas en customer_addresses con tenant_id de eatclean y customer_id de Winnie.

ESCENARIO 2 · PERFIL DIETÉTICO:
- Alérgenos UE: ["peanuts", "nuts"] (Cacahuetes y Frutos de cáscara)
- Alérgenos Custom: ["miel_sintetica"]
- Restricciones: ["vegetarian"]
- Notas: "Por favor envasar en recipiente sellado."
- Resultado esperado en DB: 1 fila en customer_dietary_profiles.
- Resultado en Pedido: orders.dietary_snapshot con safetyClass "critical" y badges visibles en /admin/orders.
```

---

## 5. 📋 TABLA DE CERTIFICACIÓN GATE 3

| Componente | Capacidad | Estado | Evidencia |
| :--- | :--- | :---: | :--- |
| `/app/addresses` | Listar / Crear / Eliminar Direcciones | ✅ PASS | [`src/routes/_authenticated/app.addresses.tsx`](file:///Users/alex/Developer/YourMeal-OS/src/routes/_authenticated/app.addresses.tsx) |
| `customer_addresses` RLS | Aislamiento B2C (`is_customer_owner`) | ✅ PASS | Migration `20260723193459` |
| `/app/settings/dietary` | Formulario Alérgenos UE-14 y Notas | ✅ PASS | [`src/routes/_authenticated/app.settings.dietary.tsx`](file:///Users/alex/Developer/YourMeal-OS/src/routes/_authenticated/app.settings.dietary.tsx) |
| `CustomerDietaryEditor` | Edición y Disclaimer Constitucional | ✅ PASS | [`src/components/admin/customer-dietary-editor.tsx`](file:///Users/alex/Developer/YourMeal-OS/src/components/admin/customer-dietary-editor.tsx) |
| `customer_dietary_profiles` RLS | Permisos cliente B2C (CR-OPS-DIET-01) | ✅ PASS | Migration `20261002120000` |
| `OrderService.programDraftItems` | Congelación de `dietary_snapshot` | ✅ PASS | [`src/modules/orders/application/order-service.ts`](file:///Users/alex/Developer/YourMeal-OS/src/modules/orders/application/order-service.ts) |
| `/admin/orders` & P1 Cocina | Badges y segregación 🔴/🟡/🟢 | ✅ PASS | [`src/routes/_authenticated/admin.orders.tsx`](file:///Users/alex/Developer/YourMeal-OS/src/routes/_authenticated/admin.orders.tsx) |
| `/app/schedule` Address Binding | Selector de dirección en checkout | ⚠️ GAP | Hardcoded `addressHomeDefault` |
| `/admin/customers` Address View | Listado de direcciones B2C en admin | ⚠️ GAP | Solo lista sitios B2B |

---

## 6. 🏁 CONCLUSIÓN Y RECOMENDACIONES

El **Gate 3 queda AUDITADO Y SUPERADO** a nivel de arquitectura, persistencia, RLS y seguridad alimentaria.

**Recomendaciones para Fase 4 (Remediación)**:
1. **R-01**: Enriquecer `/app/schedule` para que permita seleccionar entre las direcciones registradas en `customer_addresses` o use automáticamente la dirección `is_default: true`.
2. **R-02**: Enlazar la dirección por defecto en `createDeliveryServicesForOrder` para pedidos individuales B2C.
3. **R-03**: Renderizar la lista de direcciones de entrega en la pestaña de detalle de cliente en `/admin/customers`.
