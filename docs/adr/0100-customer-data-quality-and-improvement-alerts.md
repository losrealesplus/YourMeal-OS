# ADR 0100 — Customer Data Quality & Customer Improvement Alerts

## Estado

**Accepted** — 2026-09-05  
**Track:** CORE-CUSTOMER-002 / CORE-CUSTOMER-003 · Customer Improvement Architecture
**Context:** Universal Customer Directory (`src/modules/customer-directory/`)

---

## Contexto

A medida que YourMeal OS consolida directorios de clientes procedentes de diversas fuentes operativas (importaciones B2C, onboarding B2B, canales directos y capturas en cocina/reparto), la calidad de los datos de contacto y entrega es heterogénea.

Sin embargo, en el diseño de software para operaciones de misión crítica, la detección automática de discrepancias o posibles duplicados conlleva un riesgo si el software toma decisiones irreversibles sin intervención humana.

---

## Principio Fundamental

### `DETECCIÓN ≠ DECISIÓN ≠ MUTACIÓN`

1. **Detección (Runtime Engine):** El motor técnico (`Customer Data Quality`) evalúa hechos y discrepancias objetivas en memoria en tiempo de ejecución.
2. **Decisión (Customer Improvement Layer):** La capa de experiencia de producto proyecta las oportunidades al operador humano con evidencia neutral y un catálogo de acciones permitidas. El motor nunca decide la acción.
3. **Mutación (Domain Services & Audit):** Cualquier modificación de datos (añadir teléfono, dirección, notas) se ejecuta exclusivamente a través de los servicios ordinarios de dominio, con verificación de `Capability` (RBAC), validaciones de esquema y registro inmutable en `AuditService`.

---

## Regla de Oro sobre Coincidencia de Nombres

### `NAME SIMILARITY IS NEVER DUPLICATE EVIDENCE`

Queda **estrictamente prohibido**:
- Algoritmos de similitud difusa (fuzzy matching) basados en nombres o apellidos.
- Distancias de edición (Levenshtein, Jaro-Winkler, etc.).
- Inferencia heurística basada en Inteligencia Artificial o Embeddings vectoriales.
- Asunciones geográficas deducidas del nombre del cliente (p. ej. inferir que *"Pedro Adeje"* vive en Adeje o que es la misma persona que *"Pedro Madroñal"*).

### Ejemplos Canónicos Obligatorios:
1. **Pedro Madroñal** vs **Pedro Adeje** (o nombres idénticos como **Pedro** vs **Pedro**):
   - Sin evidencia determinista adicional $\rightarrow$ **0 ALERTAS DE DUPLICADO** (NO ALERTA).
2. **Pedro Madroñal** vs **Pedro Adeje** + **mismo enlace o coordenadas canónicas de Google Maps**:
   - $\rightarrow$ **Alerta `duplicate_maps`** (Hipótesis para revisión humana; NUNCA fusión automática).
3. **Pedro Madroñal** vs **Pedro Adeje** + **mismo teléfono normalizado + misma dirección**:
   - $\rightarrow$ **Alerta `possible_duplicate`** (Múltiples señales coincidentes; NUNCA fusión automática).

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

### 3. Señales Deterministas de Duplicidad Soportadas

1. **`duplicate_phone`**:
   Mismo teléfono normalizado a 9 dígitos canónicos (extrayendo prefijos nacionales e internacionales).
2. **`duplicate_email`**:
   Mismo correo electrónico normalizado (lowercase, sin espacios).
3. **`duplicate_maps`**:
   Misma URL canónica de Google Maps o coordenadas geográficas (`lat`/`lng` redondeadas a 5 decimales).
4. **`duplicate_address`**:
   Misma dirección estructurada normalizada (calle normalizada con prefijos estándar + municipio + código postal, con longitud $\ge 5$ caracteres y descartando placeholders genéricos).
5. **`possible_duplicate`**:
   Combinación de $\ge 2$ señales deterministas independientes entre dos fichas de cliente.

### 4. Contrato de Acciones Permitidas (`ImprovementActionKind`) y Exhaustividad en Compilación
Cada alerta proyecta explícitamente las acciones que un operador puede ejecutar mediante un diccionario estricto y exhaustivo `ALLOWED_ACTIONS_BY_ALERT: Record<QualityAlertCode, readonly ImprovementActionKind[]>`.

Queda **terminantemente prohibido** el uso de cláusulas `default:` o fallbacks permisivos en `allowedActionsForAlert(alertType: QualityAlertCode)`. Si en el futuro se añade un nuevo `QualityAlertCode`, TypeScript forzará un error de compilación inmediato mediante tipado `never` si no se declara explícitamente su matriz de acciones.

```typescript
export type ImprovementActionKind =
  | "add_phone"
  | "add_address"
  | "add_delivery_instructions"
  | "confirm_distinct_customer"
  | "defer_review"
  | "dismiss_irrelevant";

export const ALLOWED_ACTIONS_BY_ALERT: Record<QualityAlertCode, readonly ImprovementActionKind[]> = {
  missing_phone: ["add_phone", "defer_review", "dismiss_irrelevant"],
  missing_address: ["add_address", "defer_review", "dismiss_irrelevant"],
  missing_delivery_instructions: ["add_delivery_instructions", "defer_review", "dismiss_irrelevant"],
  variable_location_without_instruction: ["add_delivery_instructions", "defer_review", "dismiss_irrelevant"],
  incomplete_profile: ["defer_review"],
  duplicate_phone: ["confirm_distinct_customer", "defer_review"],
  duplicate_email: ["confirm_distinct_customer", "defer_review"],
  duplicate_maps: ["confirm_distinct_customer", "defer_review"],
  duplicate_address: ["confirm_distinct_customer", "defer_review"],
  possible_duplicate: ["confirm_distinct_customer", "defer_review"],
} as const;
```

#### Racional de `incomplete_profile` (Identidad Crítica):
- Un cliente sin `displayName` es una anomalía de severidad `critical` porque atenta contra el invariante de identidad del directorio.
- **No se puede descartar como irrelevante (`dismiss_irrelevant`)**: un perfil sin nombre jamás puede ser considerado un dato "irrelevante".
- **Solo admite `defer_review`**: el operador puede posponer la revisión temporalmente si está esperando datos del cliente, pero la alerta sólo desaparecerá de forma natural cuando el operador edite el cliente y asigne un nombre legítimo.

### 5. Semántica de Descarte de Alertas (`DismissReason`)
Se separa explícitamente el descarte temporal o de conveniencia operativa de la desestimación de duplicados:
- `not_now`: El operador decide posponer la acción ("Ahora no / Revisar más tarde").
- `not_same_customer`: El operador certifica que dos clientes con coincidencias son personas distintas ("No son la misma persona").
- `not_relevant`: La alerta no aplica al contexto operativo del cliente.
- `other`: Otras razones documentadas con notas explicativas.

### 6. Desaparición Natural de Alertas (Pure Disappearance)
- Las oportunidades resueltas (p. ej. añadir teléfono a un cliente con `missing_phone`) **desaparecen inmediatamente en tiempo de ejecución** al reevaluarse el directorio.
- No se persisten estados superfluos de "alerta resuelta"; la base de datos sólo persiste decisiones humanas de descarte / postergación (`customer_quality_dismissals`).

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
