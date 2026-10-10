# EatClean — E2E local independiente

Intención: completar login, identidad/perfil/dirección, catálogo, creación y lectura de pedido con GoTrue y PostgREST reales, sin producción ni ampliación de alcance.

Base: main 38eb0b5dabacf5f35b326608f92084db2323317a. Rama local codex/local-staging-e2e.

Resultado: recorrido navegador completado con datos sintéticos; pedido borrador persistido y recuperado tras recarga, una línea de 8,50 €. 18 comprobaciones RLS/autenticación adicionales PASS. 40 regresiones focalizadas y 2 HTTP PASS; typecheck, lint focalizado y diff check PASS. Recursos propios eliminados, listeners cerrados.

Incidencias demostradas: puerto local original ocupado por otro stack (no modificado); transporte OrbStack interno requiere puente local; escritor de pedidos sin USAGE auth; overload de 11 argumentos omite snapshot de precio; creación de servicio de entrega intentada por cliente sin privilegios. Se incorporan dos scripts SQL exclusivamente de laboratorio y se restringe la tentativa operativa a sesiones staff. Migraciones congeladas intactas.

No se ejecutan operaciones productivas, push, PR, merge ni cambios Gate7. Las correcciones SQL deben convertirse en cambios revisados/cualificados antes del release. PASS local no significa main productivamente listo. Informe único: reports/eatclean-sprint-02/LOCAL_STAGING_E2E_RESULT.md del workspace superior.
