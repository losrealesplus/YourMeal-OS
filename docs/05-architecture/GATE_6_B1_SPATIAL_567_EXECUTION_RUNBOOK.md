# Runbook Operativo: Gate 6 Intervalo Post-PR #567 (#553–#567)

**Subtema:** Procedimiento de ejecución reproducible para las seis migraciones de base de datos en `production-db`  
**Proyecto:** EatClean Production Dedicated Supabase (`nhirlpkuvonggctdzzad`)  
**Workflow oficial:** `.github/workflows/migrate-interval-production.yml`  
**Manifiesto sellado:** `scripts/governance/release-interval-567-manifest.json`  
**Ejecutor gobernado:** `scripts/governance/interval-migration.mjs`  
**Commit base candidato:** `ddc473f6451b82b3d36d0366eb8c90814f31547a` (PR #568)  
**Revisor requerido:** `reviewerId: 292604102` (Alex Hernández)  

---

## 1. Principios Operativos y Límites Inquebrantables

1. **STRICT STOP sobre mutaciones de datos legacy:**  
   Durante todo el proceso de Gate 6 y hasta el cierre formal del backfill, queda **congelada cualquier mutación manual, script de importación o acceso administrativo directo** que escriba sobre `public.ingredients.stock`.

2. **Proyección Unidireccional Forward:**  
   La sincronización opera estrictamente como:  
   `RPC espacial → inventory_balances → proyección forward agregada a ingredients.stock`.  
   No existe trigger inverso sobre `ingredients`. Cualquier mutación directa no pasará a los saldos espaciales.

3. **Reconciliación Dinámica de Gobernanza y Linaje:**  
   El ejecutor no presupone un SHA rígido de `main`. En su lugar, verifica que el commit en ejecución descienda del commit base candidato inmutable (`ddc473f6451b82b3d36d0366eb8c90814f31547a`), que todos los commits en la secuencia intermedia contengan exclusivamente cambios sobre los cinco archivos de gobernanza aprobados, y que el diff acumulado entre la base candidata y el HEAD de `main` afecte **exclusivamente a los cinco archivos de gobernanza aprobados**:
   - `.github/workflows/migrate-interval-production.yml`
   - `docs/05-architecture/GATE_6_B1_SPATIAL_567_EXECUTION_RUNBOOK.md`
   - `scripts/governance/interval-migration.mjs`
   - `scripts/governance/interval-migration.spec.mjs`
   - `scripts/governance/release-interval-567-manifest.json`  
   Para asegurar la verificación confiable de este linaje en runners de CI, el workflow de migración descarga el historial completo de Git (`fetch-depth: 0`) en ambos jobs.

4. **Cadena Criptográfica de Artefactos entre Ejecuciones:**  
   Debido a que cada ejecución de GitHub Actions corre en un entorno efímero aislado, el flujo no asume archivos locales entre ejecuciones. Cada fase descarga y valida criptográficamente el artefacto de la fase anterior:
   - `install` recibe `preflight_run_id` y `preflight_report_sha256`, descarga el artefacto vía `gh run download` y valida rama `main`, commit SHA, workflow oficial, estatus exitoso y hash SHA-256 del informe.
   - `backfill` recibe `install_run_id`, `install_report_sha256` y `approved_window`, auditando de forma análoga el informe de instalación.

5. **Guardia Completa de Drift de Ledger:**  
   Durante la instalación DDL y bajo bloqueo transaccional exclusivo sobre `supabase_migrations.schema_migrations`, el ejecutor compara el arreglo completo de versiones del ledger observado en preflight (`IS DISTINCT FROM ...::jsonb`). Si el ledger ha variado en cualquier versión previa, la transacción aborta inmediatamente.

6. **Invocación Única del Procedimiento de Backfill:**  
   El procedimiento canónico `public.execute_gate_b1_backfill_v1()` se invoca exactamente una sola vez dentro de una tabla temporal (`CREATE TEMPORARY TABLE _gate_b1_backfill_run ON COMMIT DROP`). El resultado se utiliza tanto para la verificación de consistencia como para la emisión del reporte final.

7. **Desacoplamiento Estricto:**  
   - La Fase 2 (Instalación DDL) **solo aplica esquemas y funciones**. Nunca ejecuta el backfill.
   - La Fase 3 (Backfill) **solo se ejecuta tras verificar DDL y en una ventana operativa aprobada explícitamente**.
   - Gate 7 (Publicación del Worker) **permanece bloqueado** hasta concluir y verificar la Fase 3.

---

## 2. Secuencia Operativa Paso a Paso

```
┌────────────────────────────────────────────────────────────────────────┐
│ PASO 1: Preflight Read-Only                                            │
│ - Operation: preflight                                                 │
│ - Input: expected_source_sha, expected_manifest_sha256                 │
│ - Emite artefacto: interval-preflight-report-${run_id}-${attempt}     │
│ - Produce: artifacts/interval-migration-preflight-report.json          │
│ - Salida: PREFLIGHT_RUN_ID, PREFLIGHT_REPORT_SHA256                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Aprobación Humana con Run ID y Hash Anclado
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PASO 2: Instalación DDL Atómica (Migraciones 1 a 6)                   │
│ - Operation: install                                                   │
│ - Token: INSTALL_INTERVAL_567_ON_nhirlpkuvonggctdzzad                  │
│ - Inputs: PREFLIGHT_RUN_ID, PREFLIGHT_REPORT_SHA256                    │
│ - Verificación remota: Descarga y auditoría de artefacto de preflight  │
│ - Pre-guardia: Comprobación de drift del arreglo completo del ledger   │
│ - Postcheck: Postchecks de esquema y conectividad bajo rol postgres    │
│ - Emite artefacto: interval-install-report-${run_id}-${attempt}        │
│ - Produce: artifacts/interval-migration-install-report.json            │
│ - Salida: INSTALL_RUN_ID, INSTALL_REPORT_SHA256                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Aprobación Humana de Ventana Operativa
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PASO 3: Backfill Operativo de Inventario                               │
│ - Operation: backfill                                                  │
│ - Token: EXECUTE_GATE_B1_BACKFILL_ON_nhirlpkuvonggctdzzad              │
│ - Inputs: INSTALL_RUN_ID, INSTALL_REPORT_SHA256, APPROVED_WINDOW      │
│ - Verificación remota: Descarga y auditoría de artefacto de install    │
│ - Ejecución: execute_gate_b1_backfill_v1() EXACTAMENTE UNA VEZ        │
│ - Postcheck: Cross-check SUM(legacy positive) == SUM(spatial balances)│
│ - Emite artefacto: interval-backfill-report-${run_id}-${attempt}       │
│ - Produce: artifacts/interval-migration-backfill-report.json           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Verificación Completa
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ PASO 4: Desbloqueo de Gate 7 Fase 2 (Publicar Worker)                  │
│ - Workflow: .github/workflows/deploy-production.yml                    │
│ - Mode: exact_interval (fcc78015...e30bf0dc)                           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Criterios de Parada Inmediata (NO-GO)

Cualquiera de las siguientes condiciones aborta inmediatamente la operación y prohíbe cualquier reintento ciego:

| Fase | Condición Detectada | Acción Inmediata |
|---|---|---|
| **Todas** | `expected_manifest_sha256` no coincide con el digest SHA-256 de `release-interval-567-manifest.json`. | Abortar inmediatamente (fallo cerrado). |
| **Todas** | El commit en ejecución no desciende directamente de `ddc473f6...` o modifica archivos fuera de gobernanza. | Abortar. Violación de linaje o alcance. |
| **Preflight** | El terminal del ledger no es exactamente `20261023065216`. | Abortar. Investigar discrepancia de ledger. |
| **Preflight** | Alguna de las 6 migraciones objetivo ya existe en `schema_migrations`. | Abortar. Estado híbrido detectado. |
| **Preflight** | Se detectan bloqueos exclusivos activos (`AccessExclusiveLock`) en tablas clave. | Abortar. Esperar liberación de conexiones. |
| **Install** | Falla la descarga o la validación del artefacto remoto de preflight (`preflight_run_id`). | Abortar. Artefacto no verificable. |
| **Install** | El hash del reporte de preflight descargado no coincide con `preflight_report_sha256`. | Abortar. Posible discrepancia o reporte no aprobado. |
| **Install** | El arreglo completo de versiones del ledger ha variado respecto al reporte de preflight. | Abortar en pre-guardia. Rollback total. |
| **Install** | Fallo en cualquier sentencia DDL. | Rollback automático de la transacción. Cero tablas modificadas. |
| **Install** | Falla cualquiera de los 4 postchecks de esquema bajo el rol postgres. | Mantener DDL pero **PROHIBIR BACKFILL Y GATE 7**. Reconciliar. |
| **Backfill** | Falla la descarga o validación del artefacto remoto de instalación (`install_run_id`). | Abortar. Artefacto no verificable. |
| **Backfill** | Falla la función `execute_gate_b1_backfill_v1()`. | Rollback automático de la transacción de backfill. |
| **Backfill** | La suma de saldos espaciales no coincide con la suma de stock positivo de `ingredients`. | Fallo cerrado antes de commit. |

---

## 4. Postchecks Privilegiados de Esquema y Conectividad (Rol Postgres Superuser)

> [!WARNING]
> **Delimitación de Alcance de Seguridad:**  
> Estos postchecks se ejecutan bajo la conexión administrativa del superusuario `postgres`. Verifican la legibilidad básica del catálogo y la existencia de columnas para el Worker antiguo, pero **NO evalúan políticas de seguridad a nivel de fila (RLS), claims JWT ni contextos de sesión autenticada de usuario final**. Las pruebas de autorización RLS/JWT deben realizarse por separado en un entorno autenticado.

El ejecutor ejecuta de forma integrada cuatro consultas de solo lectura:

1. **Catálogo de Ingredientes:**
   ```sql
   SELECT id, name, unit, cost, stock
   FROM public.ingredients
   WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870' AND deleted_at IS NULL
   LIMIT 5;
   ```
2. **Facturas de Compra (Deserialización con Nuevas Columnas):**
   ```sql
   SELECT id, invoice_number, status, received_at
   FROM public.purchase_invoices
   WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870'
   LIMIT 1;
   ```
3. **Invocación Privilegiada de Identidad de Staff:**
   ```sql
   SELECT cr_order_private.can_operate_custom_batch('8bba00ba-331b-42c8-9283-4e3836ffb870'::uuid);
   ```
4. **Lotes de Producción de Cocina:**
   ```sql
   SELECT id, status
   FROM public.kitchen_production_batches
   WHERE tenant_id = '8bba00ba-331b-42c8-9283-4e3836ffb870'
   LIMIT 5;
   ```

---

## 5. Contingencia No Destructiva

1. **Si falla el Preflight:**  
   Cero efectos en la base de datos (se ejecuta estrictamente en transacción `READ ONLY`).
2. **Si falla la Instalación DDL:**  
   Todo el lote de 6 migraciones se ejecuta en una única transacción atómica protegida por `SET LOCAL lock_timeout = '5s'`. Un error provoca `ROLLBACK` total. El ledger y el esquema permanecen en su estado previo idéntico.
3. **Si se detecta anomalía tras la Instalación DDL:**  
   **NO ejecutar `DROP TABLE CASCADE` ni borrar estructuras.** Como el Worker actual no utiliza las nuevas tablas ni RPCs, la presencia aditiva de las estructuras no afecta a la operativa. Si fuera necesario inhabilitar puntos de entrada, se revocan permisos de ejecución de las RPCs vía los scripts `_down.sql` correspondientes sin tocar datos.
4. **Si falla el Backfill:**  
   La transacción de backfill realiza `ROLLBACK`. Si se requiriese anular un backfill ya completado, se ejecuta la función quirúrgica:  
   `SELECT public.rollback_gate_b1_backfill_v1('<execution_id>');`  
   la cual elimina únicamente los saldos y discrepancias generados en esa corrida específica, preservando intacto el stock legacy de `ingredients`.
