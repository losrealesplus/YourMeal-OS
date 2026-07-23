# Experience Refactor · EatClean v1.1

**Alcance:** acceso discreto a EatClean Admin desde Login · solo experiencia / navegación.  
**No toca:** HP-001 · servicios · Supabase · lógica · RBAC (reutiliza el existente).

## Qué

1. Icono hoja (icon-only) junto a “Powered by” en Login cliente → `/auth/admin`
2. Pantalla **EatClean Admin**: email + contraseña · Entrar · sin registro público
3. Tras login → `resolveHomePath` (RBAC existente → `/admin`, `/driver`, `/saas`, `/app`)

## No

- Exponer Admin en Home pública  
- Nuevos permisos  
- Reutilizar el formulario de cliente (OAuth / teléfono / signup)
