# Recuperación operativa del directorio — PR #522

## DOCUMENT CONTEXT CHECK

Consultados FOUNDATION, AGENTS, contexto estratégico, filosofía, contexto CTO, configuración partial-launch y servicios/repositorios CRM existentes. Alcance aprobado directamente por el propietario: recuperar cambios pendientes de AG, aislar restricciones EatClean, mantener capabilities y actualizar exclusivamente PR #522.

## Cambios

Se conservaron los dos cambios no publicados de AG. Se corrigió su JSX incompleto y se reutilizó isEatCleanCrmMutationFrozen, sin flags paralelos. Altas, archivo y perfil dependen del tenant y customers.write; los handlers y el servicio rechazan escrituras CRM congeladas antes de acceder al repositorio. Soporte y dieta mantienen controles independientes. Usuarios sin customers.write ven una ficha de consulta. Otros tenants recuperan la edición: la revisión optimista se obtiene del RPC canónico únicamente en perfiles editables, sin exigir customers.revision en las lecturas del directorio.

Carga independiente de empresas/particulares conservada; fallo de preparación del contexto ahora genera estado de error explícito para ambos listados. Eliminadas cinco anotaciones any preexistentes en la ruta para completar lint focalizado.

## Evidencia

120/120 Vitest en customer-directory y partial-launch PASS (incluye 9 casos nuevos de permisos, congelación, otro tenant, errores y filtros, más el caso recuperado de AG). Typecheck, lint focalizado, formato y diff check PASS. Supabase simulado: UNIT_TESTS, no E2E. AUTHENTICATED_E2E: NOT_TESTED. No lectura de datos productivos ni escrituras productivas.

Gate7: archivos runtime DEPLOYABLE; specs/diario NON_DEPLOYABLE. Sin cambios de governance, flags de pedidos, SQL, RLS ni triggers. Sin merge/deploy. La aprobación humana posterior decide el merge y publicación.
