# Puente privado de identidad para pedidos EatClean

Candidato de revisión; no autoriza instalación ni activación productiva.

## Qué se instalaría

El manifiesto SQL vincula la RPC atómica existente (si aún falta) y una nueva migración. La migración crea session_uid_bridge(), propietario postgres, SECURITY DEFINER, search_path vacío, sin argumentos y exclusivamente SELECT auth.uid(). Solo writer recibe EXECUTE, sin grant option; no se leen tablas Auth ni se concede USAGE auth. Se reemplazan únicamente actor(), guard_legacy_offer() y can_operate_custom_batch(), conservando sus propietarios y ACL. La instalación cierra EXECUTE de la RPC para PUBLIC/API.

actor() conserva verified_actor únicamente bajo writer; el guard y el predicado RLS conservan la exigencia de identidad de sesión sin ese fallback. GoTrue/PostgREST valida el JWT; el puente no verifica firmas ni autentica un GUC arbitrario creado desde SQL privilegiado.

La activación manual exige tenant EatClean, hashes de las cuatro funciones y la RPC, owners/definer/search_path, ausencia de USAGE auth para writer, ACL interna sin grant option, rol writer restringido, RLS habilitada y huella lógica exacta de políticas/triggers de orders/order_items/audit_log. Discrepancias detienen la activación. No se expone el puente a PostgREST: no está en public y carece de EXECUTE API incluso si alguien ampliase los schemas expuestos. La configuración efectiva del proveedor no se ha consultado nuevamente.

## Migración histórica y secuencia selectiva

20261010155728_release_cr_order_writer_auth_usage.sql permanece byte a byte intacta. Sigue pendiente según el contexto humano; no se ha consultado un ledger productivo actualizado en este trabajo. La CLI migration up/db push aplica pendientes y no proporciona un filtro de un archivo: no usarla con la cadena completa para esta intervención. Referencia: https://supabase.com/docs/reference/cli/supabase-migration-up

Secuencia futura mínima, exclusivamente humana y bajo autorización SQL independiente:

1. Verificar identidad del proyecto y permisos efectivos de postgres para crear el puente y reemplazar las funciones. Revisar catálogo y ledger reales; no asumir que el snapshot histórico es actual. Verificar hashes del manifiesto. Si faltan dependencias o difieren las definiciones: STOP.
2. Con pausa de escritores aprobada, aplicar con psql -X -v ON_ERROR_STOP=1 -f exclusivamente la RPC existente si falta, y después el archivo nuevo del manifiesto. Credenciales privadas, TLS verify-full. Cada archivo usa su transacción; no ejecutar P34, A5, la migración GRANT ni todos los pendientes.
3. Guardar un recibo sanitizado de archivos realmente ejecutados, hashes y verificaciones. La ejecución SQL directa no actualiza automáticamente schema_migrations. No insertar, borrar ni marcar versiones aquí. Dejar el ledger sin alteraciones; registrar que no es seguro ejecutar posteriormente db push con esta divergencia.
4. Si se desea registrar en el ledger los dos archivos realmente aplicados, solicitar una autorización separada de reconciliación y usar el mecanismo oficial solo para esas versiones después de probar su aplicación. Nunca marcar el GRANT omitido como aplicado; continuará pendiente. No eliminarlo ni sustituirlo en silencio. Resolver el futuro uso de la cadena estándar antes de reanudarla.
5. Solicitar una autorización de activación separada y ejecutar únicamente scripts/release/activate-eatclean-staff-existing-order.sql. Mantener flags desactivados. La apertura de pedidos y una operación productiva controlada requieren aprobación posterior.

El bootstrap vacío convencional conserva el GRANT histórico con autoridad del dueño solo en CI/laboratorio. La migración nueva no revoca un permiso histórico preexistente; preserva ese estado. La vía selectiva probada y la activación exigen writer sin USAGE. No confundir ambos entornos.

## Evidencia y límites

Pruebas locales en synthetic-results.json. Incluyen 42501 antes/después, pedido confirmado, importes, auditoría, rechazos API/tenant/JWT/contexto, RLS, rollback, instalación cerrada y activación que falla ante drift. No certifican todos los módulos A4/A5, proveedores reales ni todos los tenants.

Typecheck y build local PASS; Vitest 29/29. Lint global falla con 13.714 errores y 45 warnings en archivos ajenos; el paquete no modifica TypeScript/JavaScript. No se corrige esa deuda fuera de alcance. Clasificación SPECIAL conservada. Gate7 no se modifica ni se fuerza a DEPLOYABLE. El mecanismo exact_interval de #523/#524 no autoriza automáticamente este nuevo source.

Siguiente decisión: revisión y eventual merge del único PR. SQL, activación, flags y publicación productiva siguen sujetos a autorizaciones independientes. PRODUCTION_NO_GO.
