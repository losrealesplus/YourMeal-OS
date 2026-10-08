# P34_IDENTITY_CRM_PROFILE_CONTRACT_READY_FOR_APPROVAL

Fecha: 2026-10-08. Human Product Authority: Alexander Hernandez.
Estado: READY_FOR_HUMAN_CONTRACT_APPROVAL. Propuesta de freeze; **no aprobado ni implementado**.

## 1. Baseline verificado y frontera

GitHub confirma:
- #510 MERGED a `39f5b012d48d6c0c4ac654bb395267fbc21bcf2c`, 2026-10-08 10:03:36 UTC.
- #511 MERGED a `df7526e957507eb70d76f36fbfa7f93be0a8213c`, 2026-10-08 10:03:49 UTC.
- main al inicio de esta inspección: `df7526e957507eb70d76f36fbfa7f93be0a8213c`.

Se leyó el árbol exacto origin/main. El worktree utilizado conserva HEAD anterior `a599600025291f507cb33407f240a8cd9c9fda80`; diff entre este y main para auth, permissions, customer, customer-directory, company-account, tenant-association, bootstrap, pantallas perfil/direcciones/callback y migraciones devuelve cero cambios. Sus contenidos P34 coinciden con main; no se afirma que el HEAD local sea main. No checkout, branch, commit, PR ni cambio de producto en este gate.

La propuesta P34 del Sprint 01 se revisa aquí con mecanismos concretos para asociación, permisos, default y concurrencia. Se conserva Centro de Operaciones como CRM canónico. P2 integrada en código no significa desplegada; P5 sigue laboratorio. No se verificó nuevo release ni provider live.

Alcance P34 inicial: clientes individuales y perfiles/direcciones existentes. No nuevos flujos B2B, pricing, orden writer, alergias/dietary, phone login, unlink/recovery de identidades ni fusión de cuentas Auth. Compatibilidad de company_employee existente se prueba; registros ambiguos no se eligen silenciosamente.

**No implementación, migraciones, producción, OAuth activation, deploy, merge ni cambios de governance. A5 HARD_DISABLED; A4b CLOSED como contrato/última evidencia, sin nueva consulta live.**

## 2. Hallazgos que el contrato debe resolver

E01. `src/auth/oauth.ts`, callback.ts y urls.ts ya implementan signInWithOAuth, PKCE y next allowlisted. `src/auth/features.ts` expone flags Google/Apple default false. Son scaffolding reutilizable; proveedor habilitado y redirects live no verificados.

E02. `src/routes/auth_.callback.tsx` llama associateDeploymentAfterAuth: asociación a deployment puede quedar pending. `TenantStage.ts` resuelve tenant con membership aprobada, pero no llama al helper importado de materialización. Los comentarios históricos no prueban creación CRM al login.

E03. `src/hooks/use-current-customer-id.ts` es SELECT tenant/user/deleted_at null + maybeSingle; su comentario de ensure RPC está desactualizado. Múltiples filas deben ser error, no first/latest.

E04. `CustomerMaterializationService.ts` y CompanyAccountRepository llaman ensure_individual_customer. La última definición encontrada en migraciones (`20260724132839...`) también inserta tenant_members y user_roles, hace SELECT ORDER BY created_at LIMIT 1 y luego INSERT. No se encontró guard de unicidad CRM activo tenant/user. No conectarlo al login como si su idempotencia/autoridad estuvieran certificadas.

E05. Perfil `app.settings.profile.tsx` lee metadata Auth y botón disabled. Direcciones `app.addresses.tsx` sí tienen writes directos: default en dos updates no atómicos, primer error no comprobado; delete físico e id-only final. El listado tampoco filtra deleted_at. Hay funcionalidad parcial que corregir, no una pantalla nueva desde cero.

E06. CustomerDirectoryService/repository son la fuente staff existente. updateIndividual requiere customers.write, modifica campos/contactos en varias llamadas y AuditService escribe después. No apropiado para dar permiso general a customer ni para prometer transacción completa.

E07. `src/permissions/index.ts` no registra profile.manage; aparece en comentarios de perfil/direcciones. Debe añadirse explícitamente si se aprueba; nunca interpretar un comentario como permiso. customers.write sigue staff.

E08. Policies iniciales amplias de customer_addresses/phones se reemplazan por staff/owner en `20260723193459...`. is_customer_owner comprueba user_id, pero no relación tenant_id del hijo con el customer. FKs originales son independientes. Además customers_self_write permite writes genéricos del owner: controles de UI no impiden editar tenant/user ni saltar revision/audit si DB concede esos writes. Necesita cierre DB, preservando callers autorizados.

Todo lo anterior es evidencia de repositorio. No prueba definición, ACL, duplicados, locks ni privileges live. No se ejecutaron tests nuevos: este gate diseña aceptación.

## 3. Invariantes para freeze

I01. Identidad Auth es `auth.users.id`; providers son métodos de acceso. No tabla genérica alternativa de cliente.
I02. Un user puede tener un customer activo en varios tenants. Dentro de un tenant, a lo sumo un customer activo con ese user_id; ningún dato o permiso cruza tenants.
I03. Centro de Operaciones conserva customers, customer_phones y customer_addresses. Orders conserva customer_id y sus snapshots. El perfil cliente es una proyección de esos registros.
I04. Tenant se resuelve por contexto deployment y membership aprobada del actor. El servidor verifica esa relación nuevamente; no confiar en tenantId/customerId/rol enviados desde el navegador.
I05. Login no concede membership aprobada, rol staff ni asociación CRM. Pending/rejected/suspended/revoked no crean acceso comercial.
I06. No materializar staff/admin automáticamente. Creación de customer exige onboarding individual explícito después de acceso aprobado.
I07. No reclamar CRM existente mediante igualdad de email, nombre, teléfono o relay. No merge automático de CRM ni reparent de pedidos.
I08. Perfil self-write exige propietario activo + tenant membership aprobada + permiso self-profile. Ni service_role ni transporte SSR son actor humano por sí solos.
I09. Asociación/user_id, tenant_id, kind/roles, financial snapshots y audit no son campos editables del perfil.
I10. Writes de perfil/contactos/default son atómicos, revisionados, idempotentes y auditados; también cuando los inicia staff sobre esos mismos campos.
I11. Direcciones y teléfonos deben pertenecer al mismo tenant/customer del aggregate. Archive conserva evidencia; no delete físico desde UX cliente.
I12. Mutaciones de datos/proveedor, migraciones, release y activación son gates distintos. Aprobar este contrato no autoriza ninguno.

## 4. Asociación y onboarding: decisiones propuestas D1–D3

### D1 — Ficha CRM existente: asociación asistida y doble confirmación

Recomendación para primera versión: evitar construir verificación SMS/email propia. El cliente autenticado solicita asociación desde su sesión; la solicitud no revela resultados de búsqueda CRM ni confirma si existe un email. Personal con autoridad específica selecciona el customer exacto en Centro de Operaciones y verifica por el canal humano establecido que esa identidad corresponde al cliente. No basta ver email coincidente.

Asignación propuesta: nuevo permiso estrecho `customers.link_identity`, inicialmente company_admin/operations_manager con membership aprobada del tenant; no concederlo a todo poseedor de customers.write/support ni por fallback global SaaS. Un actor con ambos roles sigue sujeto al contexto tenant. La lista de roles es propuesta para aprobación, no cambio aplicado.

Solicitud operacional registra requestId, tenantId, customerId elegido, Auth subject del solicitante, estado, expiración y revisiones. Nunca duplica ficha comercial. Staff aprueba; el cliente confirma en su sesión autenticada exactamente la ficha resumida autorizada. DB consume request de una sola vez, revalida ownership actual de esa ficha, user ya asociado, membership/revision y guard de unicidad; liga user_id atómicamente y audita. El cliente no puede sustituir customerId entre aprobación y confirmación. El request no funciona como bearer token sin esa sesión.

Propuesta de TTL: 24 horas desde aprobación staff; expired/rejected/revoked/conflict requieren nueva solicitud explícita, no revivir el nonce. Revocar membership bloquea consumo. Dos confirmaciones del mismo request retornan el resultado ya registrado, sin segunda asociación. Cambio de contenido con mismo requestId rechaza.

Si la ficha ya está vinculada a otro user, o existen varios customers activos candidatos/vinculados, STOP `CUSTOMER_ASSOCIATION_CONFLICT`; nunca mover historial ni resolver first/latest. Si el actor ya tiene customer activo distinto en ese tenant, rechazar la asociación hasta revisión humana; fusión y recovery están fuera de este sprint.

### D2 — Nuevo cliente: onboarding explícito, no auto-CRM al login

Tras sesión válida y membership aprobada, resolver exactamente cero/uno/muchos customers activos por tenant/user. Uno→usar; muchos→conflicto; cero→onboarding. Preguntar si ya es cliente: si lo declara, seguir D1, sin crear ficha nueva mientras la solicitud está pendiente. Si declara nuevo, confirmar alta explícita y crear un customer canónico mediante operación atomic/idempotent. La comprobación de unicidad evita duplicación de vinculados por concurrencia; no demuestra que nunca exista una ficha staff sin vincular de esa misma persona. Ese riesgo residual se hace visible y se maneja por D1, no por matching automático.

El camino de membership pendiente conserva el flujo actual de solicitud/aprobación. No aprobar automáticamente para facilitar OAuth. Si EatClean quiere auto-admisión pública en el futuro, requiere contrato de enrollment separado; P34 no cambia esa política.

No utilizar datos Auth metadata como autoridad comercial: se pueden ofrecer como prefill, el cliente confirma. Crear ficha no inserta membership ni user_roles implícitamente. Revisar/aislar ensure_individual_customer y todos sus callers legacy antes de retirar efectos; conservar compatibilidad bajo pruebas y fail-closed.

### D3 — Nombre, teléfono, email y proveedores

Propuesta: nombre comercial confirmado obligatorio (trim, 1–200 caracteres); teléfono capturable en onboarding, obligatorio antes de readiness para entrega/pedido donde el contrato de canal lo requiera. No convertir login en obligación universal de dirección/teléfono para una persona que solo consulta menú. La readiness se presenta explícitamente; no alterar writers de pedido sin identificar su contrato existente.

Nombre/phone/address se editan en CRM. Proveedores nunca sobreescriben valores confirmados en logins siguientes. Teléfono no es prueba de identidad ni activa phone OTP. Solicitar país explícito cuando se necesite normalizar, conservar valor previo y reportar formatos legacy que no puedan validarse; sin inferir país del nombre/tenant ni backfill automático. Límites propuestos para freeze: nombre 1–200; teléfono declarado 1–64 caracteres cuando presente; email comercial máximo 254; address label máximo 100, street 1–500, city máximo 200 y zip máximo 32. UI/servidor aplican los mismos límites. No truncar datos legacy para ajustarlos: inventariar y detener el backfill si exceden. Ensayar formatos en P34.3 antes de migración; no introducir dependencia nueva sin justificación.

Separar email Auth (para acceso) de email comercial en customers.email. Propuesta primera versión: edición inmediata del contacto comercial como dato declarado, sin convertirlo en email verificado ni recuperación/propiedad; el cambio de email Auth conserva flujo Supabase de confirmación y pantalla separada. Si se exige verificación comercial para mensajes, mantenerlo no verificado hasta gate de verificación/communications; no mandar mensajes a contacto no certificado desde este sprint. No almacenar un nuevo segundo campo comercial si el canónico basta.

Google/Apple identity se integra a la misma sesión/user/customer. Apple relay se muestra y conserva como contacto declarado si el cliente lo confirma; no buscar email real ni fusionar con cuentas por parecidos. OAuth web de Apple no aporta full name: onboarding lo solicita. Proveedores pueden no dar teléfono/nombre en posteriores sesiones; no borrar CRM por eso.

Supabase puede vincular automáticamente identidades Auth con email verificado coincidente. Eso es comportamiento del proveedor, no autorización para buscar/reclamar customers por email. Si la prohibición humana pretende también deshabilitar ese comportamiento Auth, hay que diseñarlo expresamente antes de habilitar providers; este contrato propone prohibir el matching CRM y mantener subject Auth como identidad. Manual linking de provider con distinto email exige sesión del user existente + confirmación OAuth del proveedor; requiere configuración separada. Unlink y merge de dos Auth users distintos quedan fuera de scope.

## 5. Perfil, direcciones, concurrencia: D4–D5

### D4 — Self-profile, CRM staff y permisos efectivos

Registrar nuevo `profile.manage` como self-only para rol customer y, cuando corresponda, usuarios staff que se hayan vinculado expresamente como customer. Nunca concede customers.write ni permite listar otros customers. DB deriva actor desde JWT verificado/auth.uid y comprueba membership, owner y registro activo. Reads sensibles son self/authorized staff, incluyendo filtros tenant/customer/deleted_at.

Una operación canónica dentro del módulo customer-directory coordina cambios; self-profile y CustomerDirectory staff la invocan con autoridades distintas. Staff debe transmitir expectedRevision para los campos compartidos: no dejar staff update sin revision que pueda pisar al cliente silenciosamente. No crear dos writers financieros ni modificar OrderFacade para editar perfil. El módulo actual agrega servicios self-profile y operaciones atómicas de CRM, sin modelo paralelo.

DB debe impedir acceso directo alternativo que pueda alterar vínculo/tenant o saltarse revision/audit, incluyendo clientes Supabase manipulados fuera de UI. Ajustar ACL/RLS y el boundary de writes de clientes/contactos preservando writers A3/A4/A5 y servicios staff aprobados. No afirmar que agregar una capability frontend resuelve ese problema.

DTO de lectura: customerId, tenantId, revision, displayName, email comercial, teléfono primario, direcciones con IDs/default y estado de completitud. Email Auth se lee por canal Auth separado; no se guarda como copia canónica.

Command de escritura: requestId UUID, expectedRevision, patch allowlisted; actor/tenant/owner derivados en servidor. Reply: customerId, committedRevision, replayed y lectura canónica. RequestId scope tenant+actor+operation; fingerprint del comando ligado al customer y revisión. Mismo request+payload→resultado registrado; payload distinto→REQUEST_PAYLOAD_MISMATCH; revisión obsoleta→STALE_REVISION sin writes. Ante timeout, readback del mismo request bajo autoridad actual antes de nueva operación; no retry reparador automático.

Propongo una revision común en customers para aggregate perfil/contactos/direcciones, inicial 1, monotónica; lock customer antes de cambio de hijos. Persistir resultado mínimo de requests separado de audit_log (ledger operacional, no segundo CRM). Antes de implementar, preflight de columnas/callers/locks define compatibilidad y manifest exacto.

### D5 — Direcciones y default

Múltiples direcciones con IDs estables; label/street/city/zip y, si ya existen, lat/lng sin autogeocoding nuevo. Un customer con direcciones activas tiene exactamente un default; sin direcciones activas tiene cero. Primer alta establece default en la misma transacción. Añadir siguientes conserva default salvo elección explícita. is_default no se toggla mediante dos requests independientes.

Archive de dirección default exige replacementAddressId activo del mismo tenant/customer cuando queda alguna; si era la única, permite cero y marca readiness incompleta. No escoger primera/más reciente arbitrariamente. Si se archiva una no-default, default se conserva. Restore explícito no roba default; la primera dirección restaurada cuando no hay otras lo establece. Constraints garantizan a lo sumo uno; lock/operación y tests garantizan exactamente uno cuando hay direcciones. Aplicar regla análoga de a lo sumo un teléfono primario activo, con cambio atómico.

No borrar ni reparentar address/phone. Orders conserva delivery_address_id y snapshots existentes: archive de dirección no borra FK/historial ni cambia pedido confirmado. Actualizar dirección default no redirige entregas pendientes silenciosamente; cambiar un pedido requiere su flujo de modificación autorizado y revisión propia. Lectores legacy de defaults deben ignorar archived y rechazar estados ambiguos.

Audit dentro de la misma transacción: actor verificado, tenant/customer, request, operation, revisiones, IDs/campos modificados y timestamps UTC. No JWT, secrets, OAuth codes, email/phone/address completos innecesarios en logs. Retención aplica política vigente audit; no crear purgas nuevas. Si política/ACL no están definidas, cerrarlas antes de activación de escrituras, sin inventar cumplimiento legal.

## 6. Plan por slices y manifest de archivos propuesto

Los paths siguientes son existentes a reutilizar o nombres exactos propuestos de archivos nuevos. No se crean en este gate. Specs homónimas se añaden con cada implementación. Ningún filename timestamp de migración se inventa: se generará mediante CLI cuando se autorice; cada manifest deberá fijar bytes/hash y scope antes de provider.

### P34.1 — Identity/customer association

**Reutilizar:** tenant deployment association, approved membership resolver, CustomerMaterializationService, CompanyAccountRepository/Service, useCurrentCustomerId, customers canónicos.

**Existentes afectados:**
- `src/bootstrap/pipeline/services/CustomerMaterializationService.ts` y `stages/TenantStage.ts` (mantener separación Auth/Customer, corregir comentario/import si procede).
- `src/modules/company-account/infrastructure/company-account-repository.ts` y `application/company-account-service.ts` (callers de ensure con contrato preservado).
- `src/hooks/use-current-customer-id.ts`.
- `src/permissions/index.ts` y `docs/09-security/CAPABILITY_MATRIX.md` para permiso estrecho de association.
- `src/routes/_authenticated/admin.customers.tsx` para workflow staff exacto, sin cambiar menú.

**Nuevos propuestos:**
- `src/modules/customer-directory/domain/customer-identity-association.ts`.
- `src/modules/customer-directory/application/customer-identity-association-service.ts`.
- `src/modules/customer-directory/application/customer-identity.functions.ts`.
- `src/modules/customer-directory/server/customer-identity.server.ts`.
- `src/modules/customer-directory/infrastructure/customer-identity-repository.ts`.

**DB:** guard único activo tenant/user; relación tenant+customer consistente; request association con consume atómico, nonce/TTL y roles estrictos; ensure corregido/compatibilidad callers. Antes: inventario READ-ONLY de duplicados, kind/soft-delete, ACL, funciones/owners y SQL auth.uid. No resolver duplicados automáticamente.
**Tests:** approved/pending/revoked, staff no materializado, multi-tenant, dos consumers/concurrencia, duplicate/customer-bound conflict, mismatched payload/expired/replayed request, manipulación de customerId, asociación por email imposible.
**Depende:** freeze D1/D2; ledger/locks y caller compatibility. **Activación:** preflight+autorización migración propios; asociación inicialmente closed, no cambios a membership policy.

### P34.2 — Google/Apple onboarding

**Reutilizar:** `src/auth/{oauth,callback,urls,features,client,session}.ts`, callback route, deployment association y current user resolver.
**Existentes:** `src/routes/auth.tsx`, `src/routes/auth_.callback.tsx`, `src/auth/oauth.ts`, `src/auth/features.ts`, `src/auth/urls.spec.ts`, `src/auth/features.spec.ts`, `src/auth/customer-auth-errors.spec.ts`.
**Nuevos:** `src/modules/customer-directory/application/customer-onboarding-service.ts`, `src/components/customer/customer-onboarding.tsx`, `src/routes/_authenticated/app.onboarding.tsx` (ruta propuesta para siguiente implementación, no generada aquí).
**DB:** reutiliza P34.1; no catálogo CRM por proveedor. Intent onboarding/linking liga user actual y tenant aprobado; onboarding no crea rol. No editar supabase/config.toml ni credentials en PR de código si la activación no está autorizada.
**Tests:** first/repeat callback, code/error/missing session, safe-next, recovery no pasa a onboarding, membership pending, Google/Apple sin full_name/phone, relay distinto, provider-link a sesión existente, callback duplicado y cambio tenant durante login.
**Depende:** P34.1 y DTO/readiness P34.3. Mocks/UX pueden desarrollarse antes; flujo live solo después. **Activación:** Google primero y Apple después, sandbox/redirect origins/scopes/consent y provider enable separados; no wider scopes para Drive. Apple web secret rotation/responsable y aviso probado antes de habilitar. Native/Capacitor flujos nuevos fuera de scope; verificar browser actual y deep-link existente si se despliega a móvil.

### P34.3 — Editable customer profile

**Reutilizar:** CustomerDirectoryService/repository/domain, CustomerFacade, useCurrentCustomerId, ServiceContext/DomainError, AuditService patrón, query invalidation.
**Existentes:** `src/modules/customer-directory/domain/customer-directory.ts`, `application/customer-directory-service.ts`, `infrastructure/customer-directory-repository.ts`; `src/customer/CustomerFacade.ts`; `src/routes/_authenticated/app.settings.profile.tsx`; `src/permissions/index.ts` y capability matrix para profile.manage real.
**Nuevos:** `src/modules/customer-directory/domain/customer-self-profile.ts`; `application/customer-self-profile-service.ts`; `application/customer-profile.functions.ts`; `server/customer-profile.server.ts`; `infrastructure/customer-profile-repository.ts`; `src/hooks/use-customer-self-profile.ts`.
**DB:** revision/ledger de aggregate, allowlisted atomic update+audit, closure de raw writes y compatibilidad de staff; sin segundo perfil. Auth email change usa Auth fuera de transacción CRM, con estado pendiente/reconciliación explícito, nunca promesa de atomicidad Auth+Postgres.
**Tests:** campos límites/trim, sparse patch vs null, owner/tenant/tamper, revocation, concurrent staff/self, stale revision, replay diferente, transporte incierto, mismo customer visible en Centro, metadata OAuth no sobreescribe nombre.
**Depende:** asociación inequívoca P34.1; D3/D4. **Activación:** puede abrir primero a customers ya asociados sin activar OAuth, con DB/provider gate propio y rollout limitado.

### P34.4 — Delivery addresses / CRM consistency

**Reutilizar:** customer_addresses/phones, perfil canónico y default readers del repositorio/order service.
**Existentes:** `src/routes/_authenticated/app.addresses.tsx`; `src/modules/customer-directory/infrastructure/customer-directory-repository.ts`; `src/modules/customer-directory/application/customer-directory-service.ts`; `src/modules/orders/application/order-service.ts` (solo lector de selección default si requiere hardening; no writer nuevo).
**Nuevos:** `src/modules/customer-directory/domain/customer-address-command.ts`; `application/customer-address-service.ts`; `application/customer-address.functions.ts`; `server/customer-address.server.ts`; `src/hooks/use-customer-addresses.ts`.
**DB:** constraint tenant/customer, unique default/primary activo y operación archive/restore/default bajo lock+revision+ledger P34.3. Revisar referencias existentes antes de constraints. No replicar schema en instance sin estrategia canónica del repositorio.
**Tests:** concurrente default, error intermedio rollback, foreign/reparent, archived oculto, default archive con/sin replacement, first/default/no active, restore, historial/FKs, CRM reread y pedido confirmado no se modifica.
**Depende:** P34.3 aggregate/authority, D5 y compatibilidad Order readers. **Activación:** preflight y autorización propios; no mutar pedidos pendientes automáticamente.

### P34.5 — End-to-end certification

**Reutilizar tests:** customer-facade/customer-validation, CustomerDirectoryService, company-account-service, tenant-association/deployment, auth urls/features/callback y flows canónicos pertinentes.
**Nuevos de aceptación:** `src/modules/customer-directory/p34-customer-profile-certification.spec.ts`; `tests/p34-customer-profile.e2e.ts` (directorio/runner exacto a reconciliar con harness existente antes de PR, sin nueva dependencia automática); `docs/10-validation/P34_CUSTOMER_PROFILE_CERTIFICATION.md`.
**DB:** fixtures locales y adversariales en DB aislada; sin nueva regla/schema. **Tests E2E:** usuario con tenant A+B, sesiones de otro cliente y staff; Google/Apple mocks primero, luego sandbox bajo autorización; asociación doble-confirmación, edit profile/address, Centro refleja same ID, pedido conserva snapshots; fallos antes/durante/después commit y readback.
**Depende:** P34.1–4; provider compatibility live para declarar certificación productiva. **Activación:** pruebas locales no equivalen a live. Gate7/release y provider migration solo tras permisos propios; UX humana y read-only readback completan certificado. Los cuatro DNS FAIL Sprint 01 siguen pendiente resolución/clasificación antes de promoción; no maquillarlos con nuevas pruebas locales.

## 7. Orden de implementación y gates

Después del freeze humano, primero P34.1 base + P34.3 lector/contrato aggregate; P34.3 write y P34.4 addresses sobre ese boundary. P34.2 UI/mocks puede avanzar en rama independiente y conectar a P34.1/3 después. Activar Google y Apple no es requisito para entregar perfil a clientes ya vinculados. P34.5 integra cada slice y distingue laboratorio/sandbox/producción.

Un PR por slice; implementación puede dividirse en schema+SQL tests aislados, servicios y UI para revisión, sin stack de ramas confundido con main. Cada migration gate fija manifest después de inspección exacta; no aprobar migraciones desconocidas al aprobar este contrato. Checklist constitucional/contexto/diario y red-team de límites antes de PR. No cambios A5/CR-GOV-02 para agilizar P34.

Los guards P34 deberán demostrar compatibilidad con staff create/update y writers A3/A4/A5 que acceden a customers/phones/addresses. Si requiere ampliar writer financiero/lifecycle, STOP y proponer scope exacto separado. No convertir revisión de perfil en permiso para ejecutar A5.

A5 NO es dependencia de diseño/implementación aislada P34. Aplicación productiva de su propio SQL sigue gate Tier3 vigente; esa dependencia de autoridad no desaparece por llamarla P34.

## 8. Aceptación congelable y evidencia mínima

A01: identidad en dos tenants→dos fichas separadas, ningún cambio cruzado.
A02: login staff→cero customers nuevos; membership pending/revoked→cero writes/access.
A03: alta simultánea misma identidad/tenant→un customer; duplicate existente→error explícito.
A04: email coincidente/Apple relay→no auto-CRM claim; request vinculación necesita ambas confirmaciones y nonce vigente.
A05: request expired/foreign/payload changed/replayed→fail-closed o replay del resultado exacto, sin segunda write.
A06: self-profile manipulado no cambia customer/user/tenant ni accede a otro; raw Supabase writes no bypassan audit/revision/allowlist.
A07: nombre/teléfono/dirección editados aparecen sobre same customer ID en Centro, sin segunda fuente.
A08: staff/self concurrente expectedRevision→un commit, otro conflicto, cero updates parciales.
A09: cambios default concurrentes→un default activo; archive/restore conserva invariantes y FKs.
A10: perfil/contacto change no cambia email Auth ni ownership; Auth email verify no altera CRM silenciosamente.
A11: Google/Apple sin nombre, relay, callback/error/recovery/duplicate→onboarding correcto y redirect seguro; secrets nunca en browser/log.
A12: pedido confirmado y snapshot no se reescriben al modificar perfil/address.
A13: timeout/readback exact request→no alta/association/profile commit duplicado ni reparación implícita.
A14: denied roles/auth.uid ausente/service_role sin actor→rechazo; SQL real local además de mocks.
A15: schema live, ACL/owners, caller compatibility y provider settings se verifican antes de activar; ausencia de evidencia no se convierte en PASS.

## 9. Decisión humana solicitada

Aprobar o corregir D1 (association asistida/doble confirmación, roles y TTL), D2 (alta explícita y membership approval existente), D3 (nombre requerido, teléfono readiness y email comercial declarado separado de Auth), D4 (permiso self-only+aggregate atómico común con staff) y D5 (default exactamente uno si hay direcciones, archive con replacement explícito).

Con aprobación, estado será P34_CONTRACT_APPROVED_FROZEN; la siguiente autorización debe enumerar slices locales y SQL aislado permitidos. No empezar implementación por anticipado. Las decisiones cambian futuro producto y no se atribuyen como ya existentes.

## 10. Fuentes externas y límites

Consultadas 2026-10-08: [Supabase Identity Linking](https://supabase.com/docs/guides/auth/auth-identity-linking), [Apple OAuth](https://supabase.com/docs/guides/auth/social-login/auth-apple), [Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google), [Auth updateUser](https://supabase.com/docs/reference/javascript/auth-updateuser). Vinculación Auth no sustituye asociación CRM; Apple web no entrega full name y requiere operación de renovación secret; Google necesita configuración/redirects del proveedor; cambios email Auth siguen configuración de confirmación propia. No se ejecutó API mutadora.

El índice changelog.md devolvió 503; no se pudo certificar ausencia de breaking changes desde ese índice. Docs oficiales actuales sí consultadas. Antes de implementación se revalidará versión SDK y docs/changelog pertinente. No cambios SDK en este gate.

CURRENT STATE: P34_IDENTITY_CRM_PROFILE_CONTRACT_READY_FOR_APPROVAL.
NEXT STEP: revisión humana D1–D5 y freeze explícito.
WHO: Alexander decide; Codex se detiene.
REQUIRES AUTHORIZATION: contrato y, por separado, implementación exacta/provider/DB/release/activación.
EXPECTED NEXT STATE: P34_CONTRACT_APPROVED_FROZEN (todavía no producción autorizada).
