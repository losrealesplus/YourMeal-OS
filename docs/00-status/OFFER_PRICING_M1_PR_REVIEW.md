# PR REVIEW REPORT — Offer Pricing M1

Branch: `cursor/offer-pricing-schema-readers`.
Base: `54614a2ef29aba36977acf433a629d013d9b1305`.
Reviewer: Codex / Cursor agent. Fecha: 2026-10-05.

Arquitectura: PASS. ADR 0103 registra r2 aprobado, copia exacta y OP01–OP10 intactos.
Contratos: PASS para M1; I01–I10 y tipos financieros/operativos de OrderItem no se alteran.
Tests: PASS, 271 relevantes + 25 gobernanza + integración SQL aislada.
TypeScript: PASS. Lint de paths tocados: PASS. Lint global: WARN, deuda base existente.
Build web/Nitro: PASS con warnings conocidos de router specs / tsconfig plugin.
Android Build / APK / ADB: N/A; no assets, bridge ni navegación móvil tocados, sin device-ready.
Regresión: PASS; NULL, cero, exactitud límite, tenant, duplicación y candidato único/ambiguo.
Evidencias: PASS local, WARN proveedor no ensayado/no autorizado.
Era 2 / Laws: PASS, reutiliza Dish y menú existentes; prepara precio de oferta separado sin
inventar receta/comercial ni observar tiempo ficticio. Beneficio operativo posterior M2.
Riesgo: MEDIUM, frontera financiera aditiva todavía no activada.

## Findings y controles

- No P0/P1 abierto en alcance M1. No cambio de catálogo, snapshot ni pricing comercial.
- SQL typmod redondea scale excedente antes de CHECK: rechazo de precisión se prueba en
  repository/reader previo al cast. SQL no promete un rechazo que no puede proporcionar.
- UI/capture existentes mantienen catálogo; nueva proyección offers no se conecta a writer.
  No crear slots explícitos productivos antes de M2 completo y preflight autorizado.
- RLS probado con roles reales en fixture sintético, no equivale a RLS real del tenant.
  Preflight proveedor antes de aplicar: inventario constraints/RLS/grants/FKs/volumen/locks/
  ambigüedad y comprobación de protección/audit de writes explícitos M2.
- Duplicación conserva capacidades/lifecycle existentes, copy nullable y audit de origen;
  no publica automáticamente. Su compensación HTTP legacy no certifica atomicidad M2.
- Sin dependencia instalada/lockfile cambiado, secretos, workflows o tráfico productivo.
- Retener columna NULL en rollback previo a activación; prohibido volver a lectores viejos
  tras precios explícitos sin autorización de incidente.

Resultado técnico: **READY WITH WARNINGS**.
Estado de entrega: **PR OPEN / READY FOR HUMAN REVIEW**. Merge exclusivamente humano;
migración, activación de precios, datos de menú y despliegue siguen sin autorización.
