# Gate7 — preparación acotada PR #523

Baseline publicado: 27dc2bda8844b7c27a2df9f2deac2433a9789f39; candidato producto ce436f665781e809e61ddb70f623bf2b7ec163ca. 11 rutas y 5 SPECIAL selladas con hashes antes/después. Sin cambios de producto, SQL, flags ni evidencias históricas.

Se reutiliza exact_interval: el baseline de #523 selecciona exclusivamente su reconciliación. Solo admite dos merges first-parent: #523 y un único PR de governance de la rama codex/gate7-staff-orders-523-reconciliation. Verifica procedencia humana, rutas y hashes; después del merge, --staff-523-payload genera únicamente la propuesta de lectura. No autoriza por sí mismo.

Paso posterior, todavía NO autorizado: revisar el payload generado contra main final, hashes de los siete archivos de governance y PR de governance; autorizar un nuevo dispatch humano exact_interval con baseline/source/PRs/authorization_id/exact_interval_scope exactos. Push ordinario permanece bloqueado. La preparación exige actor y triggering_actor del propietario, run_attempt=1. Phase 2 recalcula scope y sigue requiriendo production-worker; ninguna aprobación SQL o activación de pedidos se incluye.

No se realizó dispatch, merge ni deploy. El permiso Supabase sobre auth sigue pendiente, fuera de esta reconciliación. La aceptación local GoTrue/PostgREST de #523 ya pasó 17/17; no se repite.

Validación: 48 pruebas nuevas PASS; se amplía únicamente el fixture de diagnósticos JSON para copiar el nuevo módulo y su registro. No se reformatean los registros históricos de reconciliación.

Resultado final: 246/246 pruebas específicas de release PASS, incluidas 48 nuevas. Lint del código nuevo y release-plan/fixture PASS; release-reconciliation conserva los mismos 477 avisos de formato preexistentes (comparación de reglas y mensajes idéntica); lint sin ese chequeo de formato PASS. Diff-check PASS. Sin build/dispatch productivo.
