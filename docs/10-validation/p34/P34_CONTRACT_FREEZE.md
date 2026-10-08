# P34_CONTRACT_APPROVED_FROZEN

Autoridad: Alexander Hernandez. Autorización adjunta de Sprint 02, 2026-10-08.
D1–D5 aprobadas. Se conserva la propuesta original byte por byte como evidencia histórica; su encabezado de propuesta no revoca esta aprobación posterior.

SHA-256 del contrato: `02a319557eb3f71b2d76bae01d7a2a145ccd0f8264ef94065ea701f7ff74ea30`.
Baseline: `df7526e957507eb70d76f36fbfa7f93be0a8213c` (#510 y #511 integrados).

# DOCUMENT CONTEXT CHECK

Consultados FOUNDATION, AGENTS, estrategia, filosofía, contexto CTO, protocolo de ingeniería, ADR 0015/0058/0059/0060/0065, Customer Capability, contrato P34, servicios y repositorios de clientes, Auth/callback, permisos, RLS y callers legacy.
El alta antigua concede membership/rol: contradice D2; se corrige conservando firma y callers bajo pruebas. Perfil staff y direcciones tienen writes múltiples: se sustituyen por frontera atómica compartida.

Autorizados código, SQL y base local aislada, pruebas, documentación, ramas, commits y preparación de PR. No provider, OAuth activation, deploy, merge ni governance. A5 HARD_DISABLED; A4b última evidencia CLOSED, sin nueva certificación live.

Bloqueo de activación P34.2: `20260908120000_customer_deployment_auto_approval.sql` aún aprueba memberships vía deployment association en el callback existente. El RPC `ensure_individual_customer` queda sin grants de membership/rol, pero esto no elimina la política independiente del callback. No se cambia governance ni esa política. Se requiere decisión humana separada antes de habilitar OAuth.
