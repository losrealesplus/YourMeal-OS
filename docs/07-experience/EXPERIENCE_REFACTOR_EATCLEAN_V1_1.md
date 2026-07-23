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
4. Tras login → `resolveHomePath` (RBAC existente)

## No

- Exponer Admin en Home pública  
- Nuevos permisos  
- Lenguaje “Adm” / “Admin” en la UI de cliente  
- Reutilizar el formulario de cliente (OAuth / teléfono / signup)
