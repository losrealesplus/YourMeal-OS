# Objetivo

**Experience Refactor · EatClean v1.1**

Diseñar la primera impresión del producto digital de EatClean sobre YourMeal OS: dos experiencias (Customer App · Centro de Operaciones), una sola identidad de marca, una sola plataforma.

**Alcance de esta refactorización:** experiencia / navegación / copy / assets de tenant.  
**No toca:** HP-001 · servicios · Supabase · lógica · RBAC (reutiliza el existente).

Principio canónico: [ADR 0014 · Tenant-Branded Customer Application](../adr/0014-customer-application-is-tenant-branded.md) · [Tenant Experience](../05-architecture/TENANT_EXPERIENCE_SPEC.md) · [BrandConfig](../05-architecture/TENANT_BRANDING.md).

---

## Identidad

- Logo oficial EatClean
- Fotografía real (web / Instagram — platos, no stock SaaS)
- Colores EatClean (primario verde, cream, golden solo como atención)
- Tipografía oficial (Montserrat / Open Sans)
- **Powered by** discreto — firma tipográfica mínima (`Powered by` / `YourMeal OS`), no parte del contenido principal

> Cambiar identidad de tenant = `tenants/<slug>/` + BrandConfig. Nunca forks de producto.

---

## Login

Jerarquía visual:

```text
[ Logo EatClean ]

¡Bienvenido!

Inicia sesión y programa tu menú semanal.
```

- Logo oficial como ancla de marca (protagonismo y aire respecto al título)
- Copy de bienvenida orientado al pedido semanal (CJ-001)
- Pie: enlace **Centro de Operaciones** + Powered by discreto
- La hoja / marca en el pie es elemento de identidad, no un “botón Admin” oculto
- Seguridad = auth + RBAC, no obscuridad de UI  
  Regla: [ADR 0014 · Administrative entry](../adr/0014-customer-application-is-tenant-branded.md#administrative-entry-regla-reutilizable)

Pantalla de staff (`/auth/admin`): email + contraseña · Entrar · sin registro público · sin OAuth/teléfono de cliente.

---

## Home

- Hero fotográfico
- CTA principal (programar / continuar pedido)
- Menú semanal
- Favoritos
- Próxima entrega

Sensación: calma, apetito, simplicidad. Responde **«¿Qué quiero comer esta semana?»**.

---

## Menú

- Hero editorial
- Tarjetas grandes
- Fotos reales
- Macros
- CTA Añadir

---

## Resumen

- Foto real
- Tu pedido está listo
- Confirmar pedido

---

## Centro de Operaciones

Tras el login de staff, la primera impresión **no es un dashboard**.

Es el [Centro de Operaciones](./OPERATIONAL_JOURNEYS.md): punto de entrada al trabajo diario.

- Agenda del día («¿Qué necesita hacer hoy mi equipo?»)
- Workspaces (Cocina · Reparto · Stock · Clientes · Administración · Finanzas)
- Navegación en lenguaje **Operaciones**
- Sin KPIs / gráficos / estadísticas como pantalla inicial
- Solo áreas autorizadas — nunca módulos bloqueados

| Regla | Comportamiento |
|-------|----------------|
| 1 workspace | Entrada directa al área de trabajo |
| 2+ workspaces | Picker del Centro de Operaciones |
| Administrador | Siempre ve todas las áreas |

Front Office = Customer Journeys (CJ).  
Centro de Operaciones = Operational Journeys (OJ).

---

## Qué / No (checklist de esta refactorización)

**Qué**

1. Logo oficial como ancla · pie Centro de Operaciones · Powered by mínimo  
2. Pantalla de staff sin signup público  
3. Tras login → `resolveHomePath` → Centro de Operaciones / workspace  
4. Continuidad visual Customer App ↔ Operaciones (misma marca EatClean)

**No**

- Exponer Admin en Home pública  
- Nuevos permisos / cambios RBAC  
- Lenguaje “Adm” / “Admin” en la UI de cliente  
- KPIs como primera pantalla del Centro de Operaciones  
- Reutilizar el formulario de cliente (OAuth / teléfono / signup) en staff login

---

## Resultado esperado

La aplicación debe sentirse como la **app oficial de EatClean**.

No como una plataforma SaaS.

Dos productos en percepción (quiero comer · tengo que trabajar).  
Una identidad. Una plataforma. Un Operational Model.
