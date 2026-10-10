# 2026-10-10 — Aislamiento local del runtime staging

## Intención y alcance

Materializar la autorización limitada de staging sobre el checkpoint `2ff0467b`, sin modificar Gate7, migraciones ni despliegues. Permite ensayar EatClean con un backend sintético independiente sin utilizar el proveedor productivo. No introduce reglas de negocio nuevas.

## Contrato

Identidad explícita `local_staging` / `staging_local` / `eatclean-staging`, backend fijo `http://127.0.0.1:54321` y credenciales públicas sintéticas exactas. Navegador, servidor y middleware rechazan combinaciones mixtas; fetch bloquea destinos distintos y redirecciones. La sesión de navegador tiene almacenamiento separado. Host de aplicación loopback. Vite local no carga .env, no expone variables heredadas por prefijo y excluye Nitro para evitar su carga independiente de dotenv. Contratos productivos originales conservados; hostname staging sin declaración explícita se rechaza.

## Evidencia

105/105 regresiones locales PASS, 2/2 pruebas HTTP del SDK real contra fixture sintético loopback PASS, typecheck y lint PASS, plan local PASS. Dos pruebas de configuración Vite incluidas en los 105 y repetidas únicamente después de endurecer envPrefix. No se certifica aún UI integral ni un gateway GoTrue/PostgREST real.

La ampliación inicial de regresión incluyó por error cuatro pruebas HTTP externas históricas: fallaron con ENOTFOUND, sin conexión exitosa ni credenciales. Se conserva el registro original; suite excluida de la verificación autorizada posterior. Dos expectativas antiguas de navegación/marca se ajustaron al contrato explícito local sin reabrir el binding productivo para staging.

## Persistencia y límites

Checkpoint exclusivamente local en `codex/staging-runtime-isolation`; push, PR, merge y deploy prohibidos por autorización humana. Artefacto Gate7 y dos migraciones mantienen SHA256 original. Informe operativo: `reports/eatclean-sprint-02/STAGING_RUNTIME_ISOLATION_RESULT.md` en el workspace de conversación, fuera de este checkout.

RELEASE_READINESS_BLOCKED. PRODUCTION_NO_GO. P34 permanece cerrado.
