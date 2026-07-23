# Experience Refactor · EatClean v1.1

**Alcance:** acceso al Admin desde Login · solo experiencia / navegación.  
**No toca:** HP-001 · servicios · Supabase · lógica · RBAC (reutiliza el existente).

## Concepto

La hoja **no es un secreto**. Es un detalle de marca EatClean junto a “Powered by”.

| Quién | Qué percibe |
|-------|-------------|
| Cliente | Detalle gráfico del logotipo |
| Personal | Acceso a EatClean Admin |

La seguridad **no** vive en la interfaz: el icono solo abre otra pantalla. Sin credenciales válidas + RBAC, no hay acceso a nada.

Regla canónica: [ADR 0014 · Administrative entry](../adr/0014-customer-application-is-tenant-branded.md#administrative-entry-regla-reutilizable).

## Qué

1. Hoja de marca centrada sobre “Powered by” en Login cliente → `/auth/admin`
2. Pantalla **EatClean Admin**: email + contraseña · Entrar · sin registro público
3. Tras login → `resolveHomePath` (RBAC existente)

## Continuación · Centro de Operaciones

Tras el login Admin, la primera impresión **no es un dashboard**.

Es el [Centro de Operaciones](./OPERATIONAL_JOURNEYS.md): agenda del día + workspaces autorizados.

| Regla | Comportamiento |
|-------|----------------|
| 1 workspace | Entrada directa al área de trabajo |
| 2+ workspaces | Picker del Centro de Operaciones |
| Administrador | Siempre ve todas las áreas |

Front Office = Customer Journeys (CJ).  
Centro de Operaciones = Operational Journeys (OJ).

## No

- Exponer Admin en Home pública  
- Nuevos permisos  
- “Botón escondido” con chrome de UI administrativa  
- Reutilizar el formulario de cliente (OAuth / teléfono / signup)
