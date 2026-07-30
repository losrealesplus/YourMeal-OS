# INFRA-008 · Cutover a Supabase externo (Carril B)

Destino: proyecto Supabase propio (BYO), p. ej. `djangucecsphnejplvic`.
Origen actual del runtime: backend gestionado por Lovable Cloud.

## Qué hay aquí

| Archivo | Propósito |
|---------|-----------|
| `000_consolidated_schema.sql` | Concatenación ordenada de las 29 migraciones de `supabase/migrations/`. Enums, tablas, GRANTs, RLS, funciones y triggers. |
| `010_seed_eatclean.sql` | Semillas mínimas: tenant EatClean Tenerife, feature flags, catálogo de 3 platos y menú semanal publicado. |

## Orden de ejecución

1. **Base de datos vacía** en el proyecto destino (proyecto nuevo, sin migraciones previas).
2. SQL Editor → ejecutar `000_consolidated_schema.sql` completo.
3. SQL Editor → ejecutar `010_seed_eatclean.sql`.
4. Ejecutar los POST-CHECK del final de cada archivo.

## Fuera del alcance de estos scripts

Requieren acción manual en el proyecto destino:

- **Auth**: Site URL, Redirect URLs, plantillas de correo, SMTP (si aplica).
- **Storage**: el bucket `tenant-branding` queda creado por `000_consolidated_schema.sql` (INFRA-009) y por la migration `20260729190000_infra009_tenant_branding_bucket.sql` si se usa `db push`.
- **Secretos de servidor**: `LOVABLE_API_KEY` u otros que use el runtime.
- **Datos ligados a `auth.users`**: `profiles`, `tenant_members`, `user_roles`, `customers`, `orders`. Se materializan al registrarse los usuarios reales. El primer administrador se otorga con:

  ```sql
  insert into public.user_roles (user_id, tenant_id, role)
  values ('<uuid del usuario>', null, 'saas_admin');

  insert into public.tenant_members (tenant_id, user_id, membership_type, status)
  values ('2a597790-8d62-4580-8615-3acd728effcc', '<uuid del usuario>', 'employee', 'approved');

  insert into public.user_roles (user_id, tenant_id, role)
  values ('<uuid del usuario>', '2a597790-8d62-4580-8615-3acd728effcc', 'company_admin');
  ```

## Después de conectar el proyecto en Lovable

Cuando el backend externo esté conectado desde los ajustes del proyecto y `.env` apunte a él:

1. Alinear `supabase/config.toml`, `.env.example` y `package.json` al nuevo `project_id`.
2. Regenerar tipos (`gen:types`).
3. Verificar runtime y preview contra el nuevo project ref.
4. Barrer referencias residuales al proyecto anterior, dejando intacta la evidencia histórica de `docs/10-validation/`.

## Regeneración del script consolidado

Si se añaden migraciones nuevas antes del cutover, regenerar concatenando en orden alfabético `supabase/migrations/*.sql` dentro de un `BEGIN; ... COMMIT;`.
