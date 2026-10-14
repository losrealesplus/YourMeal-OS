# Configuración de verificadores EatClean

Los ocho verificadores migrados utilizan `verification.env.example` como documentación,
sin cargar automáticamente archivos privados. Completar por entorno `PROJECT_REF`,
`SUPABASE_URL` y `SUPABASE_SECRET_KEY`; el verificador HF01 requiere además
`EATCLEAN_PRODUCTION_SUPABASE_PUBLISHABLE_KEY`. Staging rechaza el proyecto productivo.
La pertenencia de una clave opaca al proyecto la comprueba el gateway Supabase;
las pruebas locales comprueban configuración y transporte, no claves reales.

El propietario debe revisar manualmente `SUPABASE_SERVICE_ROLE_KEY` y
`VITE_SUPABASE_ANON_KEY` en su `.env.local`, y retirar o actualizar la entrada
`eatcleanbackend` si ningún otro consumidor la necesita. Los ocho verificadores
ya no consultan esa entrada ni variables genéricas. No se han inspeccionado valores.

## Cuatro consumidores adicionales saneados

`verify-eatclean-prod-live.mjs`, `bootstrap-verify.mjs` (live/CI),
`seed-day0.mjs` y `seed-platform-owners.mjs` ya no utilizan variables legacy,
fallbacks de proyecto ni carga automática de dotenv.

- Es obligatorio `--environment=staging|production`. El verificador prod-live
  solo admite production porque su recorrido de navegador está ligado al Worker productivo.
- Los tres escritores requieren, para producción, confirmación explícita
  `--authorize-production-writes=<nombre-del-script-sin-extension>:<PROJECT_REF>`.
  La posesión de una clave no autoriza escrituras. No añadir esa confirmación
  a tareas automáticas sin autorización humana para la operación concreta.
- `bootstrap-verify` requiere `--live` además del entorno; `--ci` por sí solo
  nunca activa consultas remotas. Su transporte admite exclusivamente GET/HEAD.
- No se autoriza ejecutar estos scripts por publicar este PR.

## Dependencias independientes

- `staging-e2e-seed.mjs`, `staging-e2e-rls.mjs` y `staging-local-runtime.mjs`:
  fixture local con JWT sintético fijo, independiente de las claves productivas.
- `verify-cr-cost-05-browser-evidence.mjs`: obtiene credenciales de Supabase CLI
  local. No depende de la clave del proyecto productivo; no se ejecutó.
- Workflow `deploy-production.yml`: referencias a credenciales Cloudflare, sin
  claves Supabase. Nombres de secretos remotos no acreditados por la consulta 403 anterior.

Pruebas: `node --test scripts/lib/verification-supabase.spec.mjs` (30/30).
Este paquete no autoriza ejecución de verificadores sobre servicios reales,
modificación de secretos, merge ni despliegue. La retirada de la legacy sigue
condicionada a actualizar o retirar las entradas privadas del propietario y confirmar
que no existen consumidores externos. Los doce verificadores/consumidores aquí tratados
ya no dependen de la credencial legacy.
