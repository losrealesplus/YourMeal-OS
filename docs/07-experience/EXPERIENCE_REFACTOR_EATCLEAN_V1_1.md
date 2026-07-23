# Experience Refactor · EatClean v1.1

**Alcance:** acceso al Admin desde Login · solo experiencia / navegación.  
**No toca:** HP-001 · servicios · Supabase · lógica · RBAC (reutiliza el existente).

## Concepto

El pie del Login no es un “acceso Admin” abreviado.

Es la firma de plataforma (**Powered by / YourMeal OS**) y, debajo, el enlace natural al **Centro de Operaciones**.

| Quién | Qué percibe |
|-------|-------------|
| Cliente | Pie de marca discreto |
| Personal | “Centro de Operaciones” — aquí empieza la jornada |

La seguridad **no** vive en la interfaz: el enlace solo abre otra pantalla. Sin credenciales válidas + RBAC, no hay acceso a nada.

Regla canónica: [ADR 0014 · Administrative entry](../adr/0014-customer-application-is-tenant-branded.md#administrative-entry-regla-reutilizable).

## Qué

1. Logo oficial EatClean como ancla de marca (tamaño generoso, aire respecto al título)
2. Pie: enlace **Centro de Operaciones** + firma tipográfica mínima `Powered by` / `YourMeal OS`
3. Pantalla de staff: email + contraseña · Entrar · sin registro público
4. Tras login → `resolveHomePath` → Centro de Operaciones / workspace

## No

- Exponer Admin en Home pública  
- Nuevos permisos  
- Lenguaje “Adm” / “Admin” en la UI de cliente  
- Reutilizar el formulario de cliente (OAuth / teléfono / signup)

## Continuación · Centro de Operaciones

Tras el login de staff, la primera impresión **no es un dashboard**.

Es el [Centro de Operaciones](./OPERATIONAL_JOURNEYS.md): agenda del día + workspaces autorizados.

| Regla | Comportamiento |
|-------|----------------|
| 1 workspace | Entrada directa al área de trabajo |
| 2+ workspaces | Picker del Centro de Operaciones |
| Administrador | Siempre ve todas las áreas |

Front Office = Customer Journeys (CJ).  
Centro de Operaciones = Operational Journeys (OJ).
