# Offer Pricing M2 — cotización canónica y captura financiera

## DOCUMENT CONTEXT CHECK

FOUNDATION y AGENTS: CONSULTED. FOPEBA/protocolo, contexto estratégico/filosofía/CTO:
CONSULTED. ADR 0102/r1 y ADR 0103/r2 aprobados: CONSULTED. Dish, WeeklyMenu,
OrderItem/captura/modificación y registry/engine comercial: CONSULTED.
Provider runbooks: N/A, archivos/pruebas locales exclusivamente; no aplicación de proveedor.
Autorización humana POST-#494/#495 permite A3 + M2 sin custom/UI/producción.

## Frontera acordada

M2 depende de A3 y reutiliza una sola operación transaccional dish-only. El navegador
no transmite actor ni autoridad de precio/contexto comercial. SSR autentica JWT, resuelve
tenant/roles/customer desde BD y carga explícitamente configuración comercial server.
El issuer y commit RPC son service_role-only usando el cliente backend existente, nunca
frontend ni un secreto nuevo. SQL verifica de nuevo actor activo/tenant/capabilities/owner.

Cotización privada inmutable ligada a actor, tenant, requestId, comando completo/hash,
referencias/estado del menú-slot-Dish-precio y política comercial server. Commit SSR compara
política actual; SQL bloquea y revalida datos relevantes antes de escribir cliente/pedido/
items/audit/idempotencia con A3. Cualquier drift falla PRICE_CHANGED sin writes parciales.
Cero necesita confirmación explícita de una oferta válida; ausencia no se convierte en cero.

À-la-carte usa slot ?? catalogue y guarda snapshot financiero. Contexto comercial activo +
slot explícito siempre falla OFFER_PRICING_COMMERCIAL_UNSUPPORTED. No se prorratean paquetes,
infiere extra ni mezcla promociones. NULL comercial conserva rutas v1 y el motor vigente,
con guard único de elegibilidad y rechazo de slots explícitos antes de provisionar cliente.
No se certifica atomicidad nueva de esos flujos v1. Si no existe contrato común no se
convierten sus totales globales en una asignación por línea de v2.

Orden de merge: A3 → M2. Migraciones solo archivos hasta preflight y autorización separados.
No aplicar precios a los 15 extras ni modificar catálogo, UI custom o proveedores.

## Implementación y límites comprobados

Base A3 exacta `041a7476e20b5c33c43df01d82217a2dbb351039` (PR #496).
M2 revoca EXECUTE authenticated de la entrada A3 desnuda y su core; la nueva API
SSR quote/commit queda como foundation dish-only sin activar interfaces nuevas.
Los handlers no reciben actor ni precio ni flag comercial del navegador. El registry
server distingue una política vacía explícita de configuración ausente/malformada.
No hay nuevos secretos. Verificación del bundle público: ninguna referencia a
`SUPABASE_SERVICE_ROLE_KEY`, `getServerEnv`, `client.server` ni `supabaseAdmin`.

Quote conserva únicamente contexto financiero y hash del comando, no notas ni perfil
personal duplicado. Committed retry comprueba ledger antes de expiración/drift y usa
el mismo quote original. Modificar una línea capturada conserva su snapshot unitario;
solo las líneas nuevas requieren autoridad de precio actual. Cambios de menú/slot/
Dish/precio/política tras quote son rechazo antes de provisioning/write.

El guard legacy controla nuevas capturas/cambios financieros/restauración y conserva
comment/archivo/confirmación de snapshots históricos. Los locks evitan que una carrera
NULL→precio explícito salte ese guard. El rol privado no tiene login ni BYPASSRLS;
owner/capability y auth.uid real preceden los locks. La atomicidad nueva certificada
corresponde exclusivamente al writer quoted v2; v1 comercial mantiene resultados del
engine y sus límites históricos, sin asignaciones inventadas por línea.

Override manual quoted y B2B v2 quedan tipados como no soportados en esta foundation.
UI slot pricing, CustomOrderItem, edición de extras y aplicación de migrations siguen
fuera de esta activación. Orden de revisión/merge/aplicación autorizado por separado:
A3 → M2. No ejecutar Gate 7 automáticamente.
