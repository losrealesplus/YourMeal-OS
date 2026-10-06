# A4b — UI local aislada

Estos fixtures montan los componentes reales de captura/editor. El plugin Vite reemplaza autenticación, lecturas y funciones SSR por dobles sintéticos. No usar como aplicación ni desplegar. No está importado por las rutas productivas; el build normal no incluye a4bCalls/Cliente sintético.

Terminal 1 (Node20):

```sh
node node_modules/vite/bin/vite.js --config tests/a4b/vite.config.mjs
```

Terminal 2 (Playwright/Chromium ya instalado):

```sh
node tests/a4b/run.mjs
```

Opcional: A4B_BROWSER_EVIDENCE_DIR para capturas locales. Servidor fijo en 127.0.0.1:4179; el runner bloquea toda petición no-local. Las flags habilitadas son solo dobles en memoria: no inserta filas ni abre gates reales. Prueba20 casos: gates/roles, pure/mixed, override, validación, identidad/revisión/archivo, repeat, retry, foco, móvil y zoom. La atomicidad/RLS y el commit real se verifican por las suites SQL A3/M2/A4a y SSR existentes; no se pretende certificar producción con estos mocks.
