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

## Otros consumidores inventariados, sin ejecutar

- `verify-eatclean-prod-live.mjs`: proyecto productivo EatClean; conserva variables
  `EATCLEAN_SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_SERVICE_ROLE_KEY` y claves públicas
  `EATCLEAN_SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY`. No ejecutar con credenciales antiguas.
- `bootstrap-verify.mjs` (modo live/CI), `seed-day0.mjs` y `seed-platform-owners.mjs`:
  destino indicado por `SUPABASE_URL` / `VITE_SUPABASE_URL`, clave
  `SUPABASE_SERVICE_ROLE_KEY`; los seeders cargan dotenv. Sus valores y destinos
  efectivos siguen sin verificar. Actualizar privadamente o retirar estos usos;
  el nombre de variable no demuestra que necesiten una clave JWT legacy.
- `staging-e2e-seed.mjs`, `staging-e2e-rls.mjs` y `staging-local-runtime.mjs`:
  fixture local con JWT sintético fijo, independiente de las claves productivas.
- `verify-cr-cost-05-browser-evidence.mjs`: obtiene credenciales de Supabase CLI
  local. No depende de la clave del proyecto productivo; no se ejecutó.
- Workflow `deploy-production.yml`: referencias a credenciales Cloudflare, sin
  claves Supabase. Nombres de secretos remotos no acreditados por la consulta 403 anterior.

Pruebas: `node --test scripts/lib/verification-supabase.spec.mjs` (23/23).
Este paquete no autoriza ejecución de verificadores sobre servicios reales,
modificación de secretos, merge ni despliegue. La retirada de la legacy sigue
condicionada a resolver los consumidores privados restantes.
