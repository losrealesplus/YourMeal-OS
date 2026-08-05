# ADR 0037 — Developer Portal

## Estado

**Accepted** — 2026-08-05  
**Track:** DEVELOPER-PORTAL-001  
**Detalle:** [DEVELOPER_PORTAL](../05-architecture/DEVELOPER_PORTAL.md)  
**Depende de:** [ADR 0034 Secret Gateway](./0034-runtime-secret-gateway.md) · [ADR 0036 Runtime Suite Lifecycle](./0036-runtime-suite-lifecycle.md)

## Contexto

El Runtime Suite necesita una forma de acceso que se sienta oficial para ingeniería y oculta para clientes. Mezclar discovery, autenticación y tooling en el Suite acopla responsabilidades y fuerza UI de “debug” en producto.

## Decisión

Separar tres capas:

1. **Discovery** — triple-tap sobre `TenantLogo` (sin chrome visible).
2. **Authentication** — Developer Portal (passphrase en RAM; catálogo extensible).
3. **Runtime Suite** — solo recibe `ymos-runtime-toggle`; ignora el origen.

## Consecuencias

- UX tipo Developer Options / puerta secreta.
- Suite permanece agnóstico (sin cambios de lógica de módulos).
- Futuras passphrases (`YMOS Doctor`, …) no requieren rediseñar el Suite.
- Keyboard Secret Gateway puede coexistir como atajo avanzado.
