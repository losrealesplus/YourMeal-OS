# CR-ORDER A3 — Writer transaccional dish-only

Autorización humana POST-#494/#495. Base main verificada `70d5d052fe6fdcc5d956af5c074cb784c483890a`. Contexto obligatorio, ADR 0102/r1, matriz de impacto y frontera ADR 0103/r2 consultados. Digests de contratos congelados intactos. Se crea operación SQL única y fachada tipada, sin activar custom ni UI.

La inversión operativa prepara capturas sin cliente/pedido/líneas/audit parciales y sin duplicados por retry. Hash e identidad se validan en servidor; snapshots y revisión se conservan. Ledger no duplica notas ni perfiles dietéticos. RPC pública invoker, núcleo privado con rol dedicado sin login/bypass RLS y autorización independiente. Paths directos/legacy sobre v2 quedan cerrados. Archivo de migración creado con CLI; pruebas solo en PostgreSQL temporal local.

La revisión independiente detectó y endureció respuesta sin UUID válido, whitelists SQL, permisos del rol, correspondencia con tablas existentes, edición de dirección y derivados, serialización de cocina y contexto B2B. B2B nuevo se rechaza explícitamente hasta integrar su entrega de sede, manteniendo legacy. M2 se apoyará en este núcleo para cotización de ofertas y cierre comercial.

Evidencia final: PostgreSQL local 19/19; Vitest completo 1.728/1.728 en 292 archivos; 90 pruebas de fachada; 71 governance; typecheck/build SSR/lint de implementación y diff check PASS. Deuda de formato del types generado: 2.269 incidencias preexistentes, sin nuevas. Los motivos de override financiero quedan validados y auditados. La suite de PostgreSQL crea y elimina su propio cluster temporal, con TCP apagado y migrador no superusuario.

Revisión y límites en [CR_ORDER_A3_IMPLEMENTATION_REVIEW](../../00-status/CR_ORDER_A3_IMPLEMENTATION_REVIEW.md): READY WITH WARNINGS / READY FOR HUMAN REVIEW. No afirmar validación de proveedor, UX o dispositivo. No merge, migración remota, precios productivos, Gate 7, deploy ni Cloudflare. Orden requerido de revisión/merge: A3 → M2; cada autorización de ejecución posterior sigue siendo humana.
