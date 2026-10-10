# PR #516 — autoridad de concesión en bootstrap CI

Intención: resolver solamente RELEASE_AUTH_SCHEMA_GRANT_NOT_EFFECTIVE sin debilitar su verificación ni ampliar privilegios productivos.

Causa: CLI local usa postgres; auth pertenece a supabase_admin y postgres carece de grant option. PostgreSQL sintético confirmó esos atributos y reprodujo el rechazo de la migración. Referencia pública: supabase/cli apps/cli-go/internal/utils/connect.go, ConnectLocalPostgres.

Corrección de CI: proyecto temporal explícitamente local, preparación del rol restringido con postgres y concesión USAGE desde el propietario local; luego aplicación normal por CLI, también tras reset, y cleanup del proyecto propio. Sin modificación de migraciones, RPC de precio, Gate7 ni propietarios. Autoridad productiva sigue pendiente.

Pruebas focalizadas: 5 unitarias PASS y 8 PostgreSQL PASS; grant inefectivo sigue abortando, no SELECT Auth, sin ampliación de autoridad postgres, flags/membresías API seguros. Sin E2E repetido ni conexiones productivas. La autorización permite un commit/push a la rama existente y actualización del PR, nunca merge/deploy.
