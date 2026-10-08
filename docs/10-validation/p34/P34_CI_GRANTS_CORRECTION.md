# P34 — Corrección mínima de permisos del bootstrap

## Causa demostrada

Run fallido #512: 37776026143. Migración `20261008112217_p34_identity_crm_profile.sql`, statement 10, SQLSTATE P0001, P34_EXECUTOR_GRANTS_INSUFFICIENT.

En la imagen Supabase vacía, auth pertenece a supabase_admin. Su ACL da USAGE a postgres, sin GRANT OPTION. postgres no es superuser ni puede SET ROLE supabase_admin/supabase_auth_admin. auth.uid() pertenece a supabase_auth_admin y tiene EXECUTE vía PUBLIC. Por tanto, el problema es schema USAGE, no EXECUTE de uid. PostgreSQL advierte y no concede el permiso pedido cuando el grantor carece de grant option: https://www.postgresql.org/docs/current/sql-grant.html.

La fixture anterior otorgaba artificialmente grant options a postgres antes de aplicar migraciones. Eso ocultaba la incompatibilidad y se elimina de la cualificación P34. No se modifican migraciones históricas.

## Corrección

Se reutiliza public.current_membership_id(uuid), resolver canónico existente que usa auth.uid(), tenant exacto, membership approved y no archivada. p34_private.actor(t) es SECURITY INVOKER y obtiene user_id únicamente de esa membership. Nunca admite actor desde payload, metadata/email, service credential ni fallback.

p34_writer recibe EXECUTE sobre ese resolver público y permanece NOLOGIN/NOINHERIT/NOBYPASSRLS. No recibe USAGE de auth, membresía authenticated ni acceso a tablas Auth. No se añade función SECURITY DEFINER para salvar permisos ni se altera el resolver histórico. Los owners de los RPCs privados, sus grants, RLS, audit/revisión/idempotencia y escritores de pedidos permanecen.

P34_EXECUTOR_GRANTS_INSUFFICIENT sigue siendo fail-closed: verifica USAGE de public y EXECUTE del resolver usado realmente. Una prueba retira los grants en una transacción descartada y demuestra que sigue abortando con el mismo error.

## Evidencia y límites

34 comprobaciones SQL/RLS PASS sin grant options artificiales. Incluyen writer sin auth schema y flags seguros, aserción negativa, tenant/owner/replay/concurrencia, linking, perfiles/defaults y definición/ACL de writers existentes inalterados.
138 pruebas de CRM/company/orders PASS.
La comparación estática/ACL de writers históricos prueba que P34 no los cambia; no certifica operaciones ni permisos del proveedor. A5, OAuth y A4b sin activación. Autoapproval legacy sigue como bloqueo OAuth.

La reproducción CLI separada usa el mismo camino de GitHub: supabase db start, supabase db reset --yes y supabase migration list --local; únicamente project_id/puertos distintos y seed ausente deshabilitada para evitar interferencia. Resultados y SHAs finales se registran en evidencia de publicación. Sin cambios de workflow, datos productivos ni governance.

## Revalidación tras recuperar OrbStack

Runtime Docker 29.4.0 aarch64. CLI local 2.109.1; no actualización del host. La reproducción original por `supabase db start` confirmó statement 10 y warnings de GRANT inefectivo. Con la corrección, `supabase db start`, `supabase db reset --yes` y `supabase migration list --local` terminaron exit 0 en proyecto temporal independiente. Las 66 migraciones local/remote coinciden. El CLI preparó postgres:17.6.1.143 (digest ARM64 registrado en logs). Preflight estático PASS, SQL 34/34 y unit legacy 138/138 PASS; diff check PASS. No se atribuye esta cualificación a la versión latest de GitHub: su resultado remoto se reporta separadamente.

Diff de corrección: únicamente esta documentación, la migración P34 todavía no aplicada al proveedor y la fixture P34 que deja de simular grant options. No se editan migraciones históricas, TS, workflows ni policies membership.
