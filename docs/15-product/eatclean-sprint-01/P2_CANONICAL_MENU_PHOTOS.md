# P2.1 — Fotos canónicas en menú cliente

Autorización: sprint 01 adjunto por Alexander, 2026-10-08. Baseline main `83845bf47987a3f47c21ede95bbd7be7dc54508b`.

# DOCUMENT CONTEXT CHECK

FOUNDATION/AGENTS/estrategia/filosofía/CTO: CONSULTED. Dish/CAP-003/ADR0103: CONSULTED. FOPEBA: N/A (conexión UX, sin nueva regla de dominio). Provider runbooks: N/A (sin conexión ni mutación). Contrato P2.1 autorizado en mensaje humano: CONSULTED.

## Contrato y beneficio

El cliente ve la foto del Dish seleccionado, no un hero genérico para todos. El mapper existente conserva photo_url como photoUrl; app.menu lo entrega explícitamente a MenuDishPost. Otros callers mantienen su comportamiento previo si no pasan photoUrl. URL canónica HTTPS sin credenciales; ausente/incorrecta usa placeholder existente. Un error de carga usa placeholder; si este también falla se conserva el fallback emoji del DishThumb. Cambiar foto reinicia estado de fallo, sin bucle de error.

No se consulta otro catálogo/tenant ni se modifica mapper/repository/precios/selección. La frontera tenant sigue en WeeklyMenuMapper y queries existentes. Tests de integridad del mapper se ejecutan junto a la presentación; no se pretende probar RLS live con markup.

No Storage nuevo, no importación Drive, no datos live. PR no concede deploy ni merge. A4b CLOSED, A5 HARD_DISABLED, M3/OP08 intactos.

## Validación local

- Tests de presentación + mapper + integrity: 48/48 PASS.
- Browser aislado: foto rota→placeholder, placeholder roto→emoji, cambio fuente reinicia fallos; junto a preview P5, nueve checks PASS. Todas las peticiones externas interceptadas; cero conexiones provider.
- Typecheck PASS. Lint archivos de componentes: cero errores, dos warnings react-refresh (uno preexistente en MenuDishPost, uno por helper exportado en MenuDishPhoto).
- Build PASS secuencial. Primer intento falló ENOTEMPTY porque ambos worktrees compartían caché node_modules/.nitro y se compilaron simultáneamente; repetición sin competencia PASS. No se atribuye a producto.
- Suite Vitest global: 1963 PASS / 4 FAIL por DNS de tests HTTP live (ENOTFOUND); no se declara suite global verde ni certificación live. Su test de performance regeneró baseline local; se restauraron exactamente los bytes HEAD y no se incluye ese artefacto.
- git diff --check PASS. Sin SQL/schema/provider.
