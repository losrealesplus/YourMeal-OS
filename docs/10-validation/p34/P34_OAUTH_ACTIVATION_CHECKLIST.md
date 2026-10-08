# P34.2 — Preparación Google/Apple; activación bloqueada

No se habilita ningún provider ni se modifica el callback productivo. Se reutilizan Supabase Auth, auth.callback y el estado de onboarding CRM; no crear otra tabla de identidades. Nombre del provider es prefill editable, jamás overwrite CRM. Apple Private Relay no autoriza linking; nombre ausente exige alta explícita. El correo de login se muestra separado del contacto comercial.

## Gate previo obligatorio

Resolver la contradicción D2 frente a deployment-auto-approval legacy mediante autorización humana independiente. La ausencia de grants en ensure_individual_customer no prueba ausencia de autoapproval en callback. Sin resolver esto, NO OAuth activation ni declaración de readiness productiva.

## Configuración y pruebas pendientes, sin ejecutarlas aquí

- Inventario read-only de providers habilitados, callbacks, redirect allowlist y flujos de linking Auth existentes; no inferir estado live de configs locales.
- Configuración humana de Google OAuth/Apple Service ID, claves y callbacks exactos por ambiente; credenciales fuera del cliente/browser y fuera de evidencia.
- Redirect URLs aprobadas; rechazar destinos externos y callbacks no previstos. Preservar protección de sesión/PKCE de Supabase y SSR real.
- Verificar identidad con Supabase antes de materialización. Auth puede tener sus propias reglas de identidad/linking; ninguna equivale a linking automático de CRM por correo.
- JWT real, membership pending/rejected/approved y revocación; no aprovisionar membresía ni rol desde onboarding CRM.
- Google/Apple nuevo y existente, relay, nombre ausente, usuario staff, tenant A/B, callback duplicado/interrumpido, logout/cambio de sesión y respuesta perdida.
- Confirmar doble paso staff + cliente para ficha existente, sin coincidencia email como prueba y sin datos de otro tenant.
- Logs redactados, sin tokens/contactos ni URLs con credenciales. Confirmar consentimiento y UX de errores sin false success.
- Provider migration preflight y aprobación de activación independientes de merge/deploy. Rollback de activación deshabilita provider/entrada de UI con autoridad humana; no desvincular ni borrar identidades/CRM automáticamente.

La certificación actual usa fixtures Auth: estas comprobaciones reales siguen pendientes. Producción sin cambios.
