# P34 — Selector de sustituta durante actualización pendiente

Causa exacta: command() espera execute(), que espera invalidación/refetch de varias queries. El perfil actualizado puede aparecer antes de finalizar todos los refetches. El selector seguía habilitado aunque state.busy era true; una selección válida introducida en esa ventana se borraba por setReplacement("") al terminar command(). El botón conservaba correctamente su requisito de sustituta.

Reproducción determinista en transporte de laboratorio: retener el refetch de identityRequests tras mostrar el perfil editado, seleccionar una dirección activa y luego liberar el refetch. Se observó un UUID seleccionado y su borrado al cierre tardío. La reproducción termina deliberadamente con EXPECTED_RACE_REPRODUCED; no es un resultado PASS de la suite.

Corrección de producto: una línea, disabled={locked} en el selector. Sin force-enable del botón ni cambios en contrato SQL/permisos. La sustituta no se puede elegir durante busy/uncertain.

Regresión permanente: retiene ese refetch, exige selector deshabilitado, libera operación y selecciona por UUID una dirección activa de la misma ficha leída de SQL; conserva las pruebas archive/default/restore.

13 escenarios browser/SQL PASS; 114 tests afectados PASS; typecheck, lint de ambos archivos y diff-check PASS. La corrección SQL previa conserva clean start/reset/list PASS, 34 SQL/RLS y 138 CRM/order PASS. Evidencia local sintética, sin provider/OAuth/JWT real.

Cambios de este commit: componente app.addresses.tsx, harness p34-local-browser.mjs y este informe. Se conserva #513 apilado sobre la corrección de #512 mediante merge de rama, sin rebase ni force-push. Ningún PR mergeado; sin producción, deploy, OAuth, A5/A4b ni governance.
