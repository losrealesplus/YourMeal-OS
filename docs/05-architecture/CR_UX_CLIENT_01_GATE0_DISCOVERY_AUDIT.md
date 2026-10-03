# CR-UX-CLIENT-01 · GATE 0: DISCOVERY & CUSTOMER EXPERIENCE ARCHITECTURE AUDIT

**Fecha:** 2026-10-03  
**Estado:** 🟢 GATE 0 COMPLETADO — MAPA DE ARQUITECTURA Y AUDITORÍA DE INTEGRACIÓN  
**Régimen de Gobernanza:** CR-GOV-01R (Auditoría E2E antes de cualquier modificación)  
**Objetivo:** Mapear la arquitectura integral del Customer Experience de YourMeal OS / EatClean y su integración real con Supabase y el Centro de Operaciones.

---

## 1. Mapa General de Arquitectura (Customer App ↔ Supabase ↔ Centro de Operaciones)

```text
                                CUSTOMER EXPERIENCE LAYER
                                ─────────────────────────
             ┌──────────────────────────────────────────────────────────────┐
             │                         /auth                                │
             │  ├── Email / Password Form (signIn / signUp)                 │
             │  ├── Phone OTP Form (signInWithOtpPhone - disabled by flag)   │
             │  └── SocialAuthButtons (Google / Apple - disabled by flag)   │
             └──────────────────────────────┬───────────────────────────────┘
                                            │
                                            ▼
                                 SESSION & TENANT RESOLUTION
             ┌──────────────────────────────────────────────────────────────┐
             │  • getSession() → resolveHomePath() → /app                   │
             │  • associateDeploymentAfterAuth()                            │
             │  • CustomerMaterializationService → ensure_individual_customer│
             └──────────────────────────────┬───────────────────────────────┘
                                            │
               ┌────────────────────────────┼────────────────────────────┐
               ▼                            ▼                            ▼
        CUSTOMER PROFILE             WEEKLY MENU & SCHEDULING      ADDRESSES & DIETARY
  ┌─────────────────────────┐  ┌─────────────────────────────┐  ┌────────────────────────┐
  │ /app/settings/profile   │  │ /app/menu                   │  │ /app/addresses         │
  │ • user_metadata display │  │ • useWeeklyMenu(weekStart)  │  │ • customer_addresses   │
  │ • [Edit button disabled]│  │ /app/schedule (3-Step Flow) │  │ /app/settings/dietary  │
  └────────────┬────────────┘  │ • DayPicker + Stepper       │  │ • CustomerDietaryEditor│
               │               │ • OrderIntakeService        │  │ • EU-14 + Custom Tags  │
               │               │ • OrderService.programDraft │  └───────────┬────────────┘
               │               └──────────────┬──────────────┘              │
               │                              │                             │
               └──────────────────────────────┼─────────────────────────────┘
                                              │
                                              ▼
                                 SUPABASE RELATIONAL STORAGE
             ┌──────────────────────────────────────────────────────────────┐
             │ • auth.users (ID, email, metadata)                           │
             │ • public.customers (id, user_id, tenant_id, name, email)     │
             │ • public.customer_dietary_profiles (allergens, preferences)   │
             │ • public.customer_addresses (street, city, zip, is_default)  │
             │ • public.weekly_menus & weekly_menu_slots (dishes catalog)   │
             │ • public.orders & order_items (status, pricing, snapshot)    │
             │ • public.delivery_services (multi-day fulfillment)           │
             └──────────────────────────────┬───────────────────────────────┘
                                            │
                                            ▼
                                  CENTRO DE OPERACIONES
             ┌──────────────────────────────────────────────────────────────┐
             │ /admin/customers                                             │
             │   ├── Directorio de Clientes (Individuales & Corporativos)    │
             │   └── Ficha 360° (Perfil, Direcciones, Alérgenos, Pedidos)   │
             │ /admin/orders                                                │
             │   └── Listado y Detalle Canónico de Pedidos                  │
             │ /admin/production-sheet (CR-OPS-07)                          │
             │   ├── P1 Cocina & Marmitas (Segregación 🔴/🟡/🟢)             │
             │   └── P2 Packing Jerárquico (8 niveles con orderId explícito)│
             └──────────────────────────────────────────────────────────────┘
```

---

## 2. Inventario Detallado de Rutas, Componentes, Hooks y Servicios

### 2.1. Rutas de Autenticación y Entrada
| Ruta | Archivo Fuente | Componentes Principales | Responsabilidad & Estado Actual |
|---|---|---|---|
| `/auth` | `src/routes/auth.tsx` | `AuthPage`, `EmailForm`, `PhoneForm`, `SocialAuthButtons`, `TenantBrandScope` | Login/Registro unificado. **Hallazgo:** Google/Apple Social Auth está condicionado por `isGoogleOAuthEnabled()` (`features.ts`), el cual devuelve `false` si no existe la variable `VITE_AUTH_GOOGLE_ENABLED=true`. |
| `/auth/callback` | `src/routes/auth_.callback.tsx` | `AuthCallbackPage` | Intercambio de tokens PKCE de OAuth y redirección mediante `resolveHomePath()`. |
| `/reset-password` | `src/routes/reset-password.tsx` | `ResetPasswordPage` | Recuperación de credenciales mediante email con magic link de Supabase. |
| `/auth/admin` | `src/routes/auth_.admin.tsx` | `AdminAuthPage` | Acceso directo para personal administrativo / staff. |

---

### 2.2. Rutas del Customer Experience Portal (`/_authenticated/app/*`)
| Ruta | Archivo Fuente | Hooks / Servicios | Estado / Hallazgo de Auditoría |
|---|---|---|---|
| `/app` (Dashboard) | `src/routes/_authenticated/app.index.tsx` | `useAuth`, `useCurrentCustomerId`, `useWeeklyMenu` | Portal principal de cliente con acceso a menú, pedidos recientes y estado. |
| `/app/menu` | `src/routes/_authenticated/app.menu.tsx` | `useWeeklyMenu(weekStart)` | Vista de catálogo semanal con pestañas por día (Lunes a Domingo), fotos y macronutrientes. |
| `/app/menu/$dishId` | `src/routes/_authenticated/app.menu.$dishId.tsx` | `useDishDetails` | Ficha detallada de plato con alérgenos e ingredientes. |
| `/app/schedule` | `src/routes/_authenticated/app.schedule.tsx` | `useWeeklyMenu`, `useProgramDraftOrder`, `CommercialPricingEngine` | **Flujo E2E de Pedido:** Selección de día → Stepper de raciones → Resumen con pricing comercial e ingesta mediante `OrderIntakeService`. |
| `/app/orders` | `src/routes/_authenticated/app.orders.tsx` | `useQuery(["orders"])` | Listado histórico y pedidos activos del cliente. |
| `/app/orders/$orderId` | `src/routes/_authenticated/app.orders.$orderId.tsx` | `useOrderDetails` | Detalle del pedido, desglose de platos, estado y acciones de cancelación/modificación. |
| `/app/settings/profile` | `src/routes/_authenticated/app.settings.profile.tsx` | `useAuth()` | **Hallazgo Crítico:** Muestra datos de `user.user_metadata` en modo lectura; el botón de edición está marcado como `disabled` (`comingSoon`). No escribe directamente en `customers`. |
| `/app/settings/dietary` | `src/routes/_authenticated/app.settings.dietary.tsx` | `useCurrentCustomerId`, `CustomerDietaryEditor` | Editor dietético interactivo. Escribe en `customer_dietary_profiles` (14 alérgenos EU, custom tags, restricciones y notas). |
| `/app/addresses` | `src/routes/_authenticated/app.addresses.tsx` | `useCurrentCustomerId`, `supabase.from("customer_addresses")` | Gestión de direcciones (crear, listar, eliminar, marcar por defecto). |

---

### 2.3. Centro de Operaciones (`/_authenticated/admin/*`)
| Ruta | Archivo Fuente | Servicios / Repositorios | Conexión con Datos de Cliente |
|---|---|---|---|
| `/admin/customers` | `src/routes/_authenticated/admin.customers.tsx` | `CustomerDirectoryService`, `CompanyAccountService` | Consulta unificada de `customers`, perfiles dietéticos (`customer_dietary_profiles`), direcciones y pedidos históricos. |
| `/admin/orders` | `src/routes/_authenticated/admin.orders.tsx` | `OrderFacade`, `OrderService` | Gestión de pedidos, estados de entrega y filtrado operativo. |
| `/admin/production-sheet` | `src/routes/_authenticated/admin.production-sheet.tsx` | `ProductionReportService`, `ProductionKitchenEngine`, `PackingHierarchyEngine` | Motor CR-OPS-07: Proyección de cocina con segregación de seguridad 🔴/🟡/🟢 y packing jerárquico de 8 niveles. |

---

## 3. Hallazgos Clave y Desconexiones Detectadas (Pre-Fix)

### 3.1. Google OAuth no expuesto en UI
- **Causa Raíz:** En `src/auth/features.ts`, `isGoogleOAuthEnabled()` requiere explícitamente `VITE_AUTH_GOOGLE_ENABLED=true` o `VITE_AUTH_OAUTH_SOCIAL_ENABLED=true`. De lo contrario, `<SocialAuthButtons />` retorna `null`.
- **Backend Supabase:** El proveedor Google OAuth está contemplado en el cliente y en `/auth/callback`, pero requiere verificar la configuración del proveedor en el dashboard de Supabase (Client ID / Secret / Redirect URLs autorizadas).

### 3.2. Edición de Perfil de Cliente en App
- **Causa Raíz:** `src/routes/_authenticated/app.settings.profile.tsx` muestra los datos personales en modo sólo lectura y el botón de edición está deshabilitado con la etiqueta `comingSoon`. No existe un formulario activo para actualizar nombre, teléfono o datos de contacto en `public.customers`.

### 3.3. Trazabilidad de Creación de Cliente (`ensure_individual_customer`)
- Cuando un cliente se registra vía Email/Password o OAuth, el RPC `ensure_individual_customer` garantiza la inserción/vinculación de la fila en `public.customers` bajo el `tenant_id` activo de EatClean (`8bba00ba-331b-42c8-9283-4e3836ffb870`).
- Debe auditarse que las modificaciones posteriores en la Customer App impacten directamente en la fila de `customers` y no únicamente en el JWT/metadatos locales.

---

## 4. Próximos Pasos y Plan de Trabajo para los Siguientes Gates

```text
GATE 0 · Discovery & Architecture Audit     ✅ COMPLETADO (Este documento)
GATE 1 · Autenticación & Google OAuth Audit ⏳ SIGUIENTE PASO
GATE 2 · Registro Manual & Perfil Sintético 🔒
GATE 3 · Direcciones & Perfil Dietético     🔒
GATE 4 · Menú Semanal & Pedido E2E          🔒
GATE 5 · Centro de Operaciones Sync         🔒
GATE 6 · Modificación & Cancelación E2E     🔒
GATE 7 · RLS & Seguridad Multi-tenant       🔒
GATE 8 · Matriz de Tests & Evidencias       🔒
GATE 9 · Certificación Visual & Cierre      🔒
```

> **Gobernanza:** No se aplicarán correcciones de código ni mutaciones de datos reales. Toda prueba E2E se ejecutará utilizando exclusivamente el usuario sintético autorizado `Winnie Pooh`.
