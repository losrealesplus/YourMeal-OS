# ADR 0104 — Lifecycle canónico de pedidos v2

Estado: Accepted / HUMAN APPROVED / IMPLEMENTATION AUTHORIZED, 2026-10-07.
Autoridad: Alexander Hernandez.

Contrato normativo: [A5 congelado](../05-architecture/CR_ORDER_A5_APPROVED_CONTRACT.md).

Un solo pedido y writer privado `cr_order_writer`. Las operaciones autenticadas verifican membresía exacta y capacidad por dominio antes de mutar. No hay excepción implícita para saas_admin ni autoridad por ejecutar como postgres/service_role. Confirmación/cancelación staff requieren orders.write; acciones operativas acotadas derivan estados parentales sin ampliar permisos.

La familia lifecycle amplía el ledger con resultado mínimo original para replay exacto. Identidades, snapshots, precios y totales no se reconstruyen. Las dependencias síncronas y audit pertenecen a la misma transacción. Packing y asignación v2 necesitan evidencia persistida; los Maps antiguos permanecen únicamente para v1.

A5.x exige evidencia positiva de entrega: servicios cancelados nunca prueban delivered. No existe packed como estado ni se introduce partially_delivered. Outcomes no representables requieren resolución explícita, sin falsear el padre.

Implementación local, pruebas y PR autorizados. Merge, proveedor, despliegue y activación siguen separados. A4b permanece CLOSED. UNKNOWN externos bloquean certificación productiva.
