# CR-UX-CLIENT-01 · GATE 2: AUDITORÍA DE REGISTRO Y PERFIL SINTÉTICO

**Fecha:** 2026-10-03  
**Estado:** 🟢 AUDITORÍA DE GATE 2 COMPLETADA (AUDIT & E2E SPECIFICATION)  
**Usuario Sintético Autorizado:** `Winnie Pooh` (`e2e.winnie.pooh.synthetic@yourmealos.test`)  
**Régimen de Gobernanza:** CR-GOV-01R

---

## 1. Mapeo del Modelo de Datos de Cliente y Entidades

```text
                               auth.users
                             (ID, email, JWT)
                                    │
                                    ▼
                          public.customers
               (id, tenant_id, user_id, display_name, email, kind)
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                        ▼
public.customer_phones   public.customer_addresses  public.customer_dietary_profiles
 (phone, is_primary)      (street, city, zip, def)   (allergens, preferences, notes)
```

| Ento / Campo | Tabla PostgreSQL | Lectura en Customer App | Lectura en Centro de Operaciones | Capacidad de Escritura |
|---|---|---|---|---|
| **Nombre Completo** | `public.customers.display_name` | ⚠️ Solo lee `user_metadata.full_name` | ✅ `CustomerDirectoryRepository` | ❌ UI de edición bloqueada (`comingSoon`) |
| **Email** | `public.customers.email` | ✅ `user.email` | ✅ `CustomerDirectoryRepository` | Controlado por Supabase Auth |
| **Teléfono** | `public.customer_phones.phone` | ⚠️ Solo lee `user_metadata.phone` | ✅ `CustomerDirectoryRepository` | ❌ No existe formulario en `/app/settings/profile` |
| **Direcciones** | `public.customer_addresses` | ✅ `/app/addresses` | ✅ Ficha del cliente en `/admin/customers` | ✅ `supabase.from("customer_addresses")` |
| **Alergias / Preferencias** | `public.customer_dietary_profiles` | ✅ `/app/settings/dietary` | ✅ Ficha del cliente y Centro de Cocina | ✅ `CustomerDietaryEditor` |

---

## 2. Hallazgos Críticos de la Auditoría (Gate 2)

### 🔴 1. Desconexión en `/app/settings/profile` (Edición Deshabilitada)
- **Problema:** En [`src/routes/_authenticated/app.settings.profile.tsx`](file:///Users/alex/Developer/YourMeal-OS/src/routes/_authenticated/app.settings.profile.tsx), el botón `<PrimaryCTA disabled>{t("customer:editProfile")}</PrimaryCTA>` está deshabilitado con el texto *Proximamente / Coming soon*.
- **Impacto:** Un cliente que entra a su perfil personal no puede actualizar su nombre ni su teléfono.
- **Asimetría de Datos:** Si los datos no se persisten en `public.customers` ni `public.customer_phones`, el Centro de Operaciones (`/admin/customers`) ve campos vacíos o desactualizados.

---

### 🟡 2. Flujo de Materialización (`ensure_individual_customer`)
- **Comportamiento Actual:**
  1. Al registrarse en `/auth`, el usuario se crea en `auth.users`.
  2. En el primer inicio de sesión, `CustomerMaterializationService` ejecuta el RPC `ensure_individual_customer`.
  3. Esto inserta una fila en `public.customers` con `user_id`, `tenant_id`, `display_name` y `email`.
- **Requisito para E2E:** Asegurar que `display_name` y `email` se propaguen inmediatamente tanto a `customers` como a `customer_phones` para que el personal de operaciones pueda localizar a Winnie Pooh por nombre y teléfono en `/admin/customers`.

---

## 3. Especificación del Usuario Sintético `Winnie Pooh`

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                 FICHA SINTÉTICA DE PRUEBA (CR-UX-CLIENT-01)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│ Nombre Completo:     Winnie Pooh                                            │
│ Email:               e2e.winnie.pooh.synthetic@yourmealos.test              │
│ Contraseña:          winniepooh                                             │
│ Teléfono:            +34 600 999 888                                        │
│ Tipo de Cliente:     individual                                             │
│ Tenant ID:           8bba00ba-331b-42c8-9283-4e3836ffb870 (EatClean)        │
│ Dirección de Prueba: Calle Miel 100, Adeje, 38670 Santa Cruz de Tenerife    │
│ Alérgenos Declarados: Miel / Polen (Custom), Frutos Secos (EU-14)           │
│ Preferencias:        Keto / Sin Gluten                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Próximos Pasos para los Siguientes Gates

```text
GATE 0 · Discovery & Architecture Audit     ✅ ACEPTADO
GATE 1 · Auth & Google OAuth Arch Audit     ✅ ACEPTADO
GATE 2 · Registro & Perfil Sintético        ✅ AUDITORÍA COMPLETADA
GATE 3 · Direcciones & Perfil Dietético     🔒 BLOQUEADO (STRICT STOP)
GATE 4 · Menú Semanal & Pedido E2E          🔒 BLOQUEADO (STRICT STOP)
GATE 5 · Centro de Operaciones Sync         🔒 BLOQUEADO (STRICT STOP)
GATE 6 · Modificación & Cancelación E2E     🔒 BLOQUEADO (STRICT STOP)
GATE 7 · RLS & Seguridad Multi-tenant       🔒 BLOQUEADO (STRICT STOP)
GATE 8 · Matriz de Tests & Evidencias       🔒 BLOQUEADO (STRICT STOP)
GATE 9 · Certificación Visual & Cierre      🔒 BLOQUEADO (STRICT STOP)
```

> **STRICT STOP ACTIVO:**  
> Ningún dato real ha sido alterado ni se han ejecutado mutaciones prematuras en producción.  
> Se solicita autorización para proceder con **Gate 3 (Direcciones & Perfil Dietético)** o el plan de remediación correspondiente.
