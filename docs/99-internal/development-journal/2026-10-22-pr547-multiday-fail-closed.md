# PR #547 — Cierre puntual de alcance multijornada

## Alcance autorizado

Cerrar la verificación de fechas y la exclusión de alcance desconocido en el mismo PR. Sin merge, despliegue, SQL ni cambios productivos. La selección y el avance masivo reducen pasos de Cocina; el retroceso sigue desactivado por defecto y pendiente de migración y activación autorizadas.

## Cambios

- Consultar líneas activas con orden estable, páginas y recuento exacto; continuar desde el número real recibido para soportar límites del servidor inferiores al tamaño solicitado.
- Marcar alcance desconocido ante páginas incompletas, recuentos ausentes o cambiantes, errores, duplicados, fechas inválidas, pedidos ausentes o fechas visibles no recuperadas.
- Excluir siempre pedidos con `temporalScopeKnown === false` en ambos modales, incluso con consentimiento multijornada. El consentimiento solo desbloquea alcance conocido.
- Pruebas de repositorio, consentimiento y renderizado de ambos modales con la casilla marcada.

## Evidencia

Baseline main: `1053145bc243362f6b78cbc866b761e690e25bf0`: Vitest 336 suites / 2262 tests PASS.
Predecesor `dec9d44b`: Vitest versionado 339 suites / 2289 tests PASS con historial Git disponible. El primer ensayo mediante archivo sin `.git` falló en CR-COST-07 Link 14 por requerir el commit histórico `b37191d1`; no es regresión del producto.
Las dos suites DISA no versionadas del workspace físico pasan por separado (12 tests). No se reproduce el código 1 histórico de AG y no se atribuye a main sin evidencia.
La validación final de este commit se registra en el PR. La migración rollback permanece fuera; no se modifica su flag.
