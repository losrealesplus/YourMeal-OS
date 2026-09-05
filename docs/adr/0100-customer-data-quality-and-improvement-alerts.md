# ADR 0100 — Customer Data Quality & Customer Improvement Alerts

## Estado

**Accepted** — 2026-09-05  
**Track:** CORE-CUSTOMER-002 · Phase 2 (Implementation & Decision Protocol)  
**Context:** Universal Customer Directory (`src/modules/customer-directory/`)

---

## Contexto

A medida que YourMeal OS consolida directorios de clientes procedentes de diversas fuentes operativas (importaciones B2C, onboarding B2B, canales directos y capturas en cocina/reparto), la calidad de los datos de contacto y entrega es heterogénea.

Sin embargo, en el diseño de software para operaciones de misión crítica, la detección automática de discrepancias o posibles duplicados conlleva un riesgo si el software toma decisiones irreversibles sin intervención humana.

---

## Principio Fundamental

### `DETECCIÓN ≠ DECISIÓN`

1. **El motor de calidad solo detecta hipótesis y evalúa señales en memoria en tiempo de ejecución.**
2. **El software NUNCA fusiona, modifica ni borra registros de clientes de forma automática.**
3. **Toda fusión, corrección, override o descarte de alerta es una decisión humana explícita, auditada y registrada en el `audit_log`.**

---

## Decisiones de Arquitectura

### 1. Clasificación (`CustomerQualityStatus`) en lugar de Score
No se computa una métrica artificial de "puntuación numérica de cliente" para evitar degradación a rankings sin significado operativo. Se establecen tres estados canónicos:
- `complete`: Datos completos de identificación, teléfono, dirección y sin bloqueos de entrega.
- `improver`: Cuenta con identidad y contacto activo (teléfono o email), pero tiene datos parciales que pueden completarse progresivamente.
- `needs_attention`: Falta de contacto esencial (sin teléfono ni email), nombre vacío o perfil con ubicación variable no instruida.

### 2. Evidencia Fuertemente Tipada (`QualitySignalEvidence`)
Queda terminantemente prohibido el uso de `unknown` o `any` en las evidencias emitidas por el evaluador:
```typescript
export type QualitySignalEvidence = {
  ruleCode: string;
  field: string;
  detectedValue?: string | number | boolean | null;
  conflictingCustomerId?: string | null;
  conflictingCustomerName?: string | null;
  rationale: string;
};
```

### 3. Semántica de Descarte de Alertas (`DismissReason`)
Se separa explícitamente el descarte temporal o de conveniencia operativa de la desestimación de duplicados:
- `not_now`: El operador decide posponer la acción ("Ahora no").
- `not_same_customer`: El operador certifica que dos clientes con coincidencias son personas distintas ("No son la misma persona").
- `not_relevant`: La alerta no aplica al contexto operativo del cliente.
- `other`: Otras razones documentadas con notas explicativas.

### 4. Arquitectura Híbrida de Persistencia
- **Evaluación Dinámica (Runtime):**
  - `missing_phone`, `missing_address`, `missing_delivery_instructions`, `variable_location_without_instruction`, `incomplete_profile`, `duplicate_phone`, `duplicate_email`.
- **Persistencia de Decisiones:**
  - Tabla `public.customer_quality_dismissals` con RLS estricto por `tenant_id` que almacena descartes, motivos, autor y marcas de tiempo.

### 5. Reglas Deterministas de Duplicados (Cero Falsos Positivos por Nombre)
Dos clientes con nombres idénticos o similares (por ejemplo, "Pedro Madroñal" vs "Pedro Adeje") **NUNCA** disparan alertas de duplicado a menos que compartan de manera determinista:
- Mismo teléfono normalizado (últimos 9 dígitos).
- Mismo email normalizado.

### 6. 0x Math Client (Proyección Pura para Frontend)
El cliente UI recibe proyecciones precalculadas de `CustomerQualityEvaluation` y `CustomerImprovementAlert[]` desde el Core. La interfaz no implementa heurísticas de evaluación.

### 7. Auditoría y RBAC
- Lectura: Requiere `customers.read` o `support.read`.
- Acciones y descartes: Requiere `customers.write` o `support.write`.
- Toda acción persiste rastro inmutable mediante `AuditService` en `public.audit_log`.

---

## Consecuencias

- **Aislamiento Total:** El motor reside exclusivamente en Core (`YourMeal-OS`) y beneficia a todos los tenants de la plataforma.
- **Seguridad e Integridad:** Los datos de clientes no sufren mutaciones silenciosas durante escaneos de calidad.
- **Trazabilidad:** Cada descarte de alerta o decisión queda respaldado por el usuario operador y su motivo.

---

## Referencias

- ADR [0015](./0015-b2b-b2c-customer-model.md) · [0006](./0006-soft-delete-audit.md) · [0098](./0098-experience-law-001.md)
