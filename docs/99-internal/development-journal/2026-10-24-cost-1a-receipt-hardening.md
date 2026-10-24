# CR-COST-1A · Corrección del PR #553

Autorización: corrección de integridad y pruebas en la rama existente; conservar Draft. Sin merge, despliegue ni SQL productivo.

Contexto consultado: FOUNDATION, AGENTS, contexto estratégico, filosofía de producto, CTO y protocolo operativo; contrato de compras existente y especificación congelada FLOW-04. Runbooks productivos no aplican a este laboratorio aislado. No se amplía 1A ni se modifica 1B/OCR/UX.

## Cambios

- Auditoría: revocar escritura directa de `authenticated` y `anon`, mantener SELECT autorizado por tenant y rol. Impedir cascada de borrado desde factura/ingrediente. El down SQL deshabilita el RPC conservando tablas, cantidades e históricos; no pretende reconstruir el stock anterior.
- Identidad: exigir `auth.uid()` y pertenencia/rol; `p_actor_id` solo puede coincidir con la sesión, nunca autentica. Sin bypass por `service_role` para suplir usuario.
- Idempotencia: persistir petición normalizada; sellar factura y líneas/cantidades; serializar `(tenant, receipt_id)` antes de consultar el ledger. Repetición exacta devuelve el resultado; contenido distinto rechaza.
- Validación: SQL NULL es recepción completa; JSON no array/JSON null/array vacío, estructura incorrecta, duplicados, líneas ajenas, cantidades inválidas, conversiones con pérdida por redondeo o superiores al pendiente y estados no receptivos rechazan. Las facturas históricas no se reingresan ni se convierten automáticamente.
- Bloqueo de factura, líneas e ingredientes en orden estable; transacción única por recepción.
- Corregir adaptación frontend `lineId` → RPC `line_id` para recepciones parciales.

## Evidencia local

Laboratorio desechable propio (PostgreSQL 17 + GoTrue + PostgREST), red interna sin acceso externo, migraciones completas desde vacío y únicamente usuarios/datos sintéticos. No utiliza DSN del host ni contenedores compartidos. Ejecutar:

```sh
python3 scripts/receipt553-local-lab.py start
RECEIPT553_LOCAL_LAB=1 npx vitest run src/modules/cost-intelligence/infrastructure/cr-cost-1a-postgres-integration.spec.ts
python3 scripts/receipt553-local-lab.py stop
```

34 casos reales PASS: Auth por contraseña; RPC/lectura/escritura vía PostgREST; cliente, otro tenant, anónimo, actor falso; stock/WAC/unidades; idempotencia y conflictos; dos RPC simultáneos bloqueados en conexiones independientes (verificación `pg_stat_activity`); fallo de ledger después de escrituras revierte stock/historial/líneas; no borrado de evidencias por cascada; histórico sin reingreso.

142 regresiones PASS (Cost Intelligence, receipt engine y FLOW-04 T1/T2/T3); typecheck PASS. La suite PostgreSQL es opt-in; un skip del CI normal no acredita estas 34 pruebas.

## Límite FLOW-04 · bloqueo restante

La prueba ejecuta el `InventoryService` real T1/T2/T3 con la cantidad recibida; verifica Single Apply y sellado. **El repositorio actual de Inventory es en memoria y no usa Supabase.** Se transfiere explícitamente la cantidad de la DB al adaptador de certificación para comprobar compatibilidad de dominio; PostgreSQL permanece sin consumo. No es integración persistente compras → producción. No se implementa otro repositorio ni arquitectura sin decisión humana específica. Mantener #553 Draft y no declararlo completamente cerrado.
