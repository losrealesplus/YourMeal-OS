# YOURMEAL OS — DATA ONBOARDING ENGINE CONTRACT (B3.6)
## ARQUITECTURA, CONTRATO DE INGESTA Y PROTOCOLO DE CONCILIACIÓN CON APROBACIÓN HUMANA

---

## 1. Principio Fundamental & Pipeline de Ingesta

El motor de onboarding de datos de YourMeal OS (**Data Onboarding Engine**) opera bajo un principio inmutable: **Cero Asunciones Automáticas**. Ninguna fila, columna o archivo proveniente de un cliente externo es persistido en la base de datos operativa sin atravesar un ciclo determinista de 9 etapas con compuerta de aprobación humana obligatoria:

```text
                 ARCHIVO ORIGINAL (Excel / PDF / CSV)
                                  │
                                  ▼
                            1. INGESTA
                     (SHA-256 / File Registry)
                                  │
                                  ▼
                           2. EXTRACCIÓN
                     (Hojas / Celdas / OCR si aplica)
                                  │
                                  ▼
                          3. NORMALIZACIÓN
                  (E.164 / Minúsculas / Cero Pérdida)
                                  │
                                  ▼
                       4. MAPEO SEMÁNTICO
                  (Propuesta de Mappings + Confianza)
                                  │
                                  ▼
                           5. VALIDACIÓN
                  (Categorías: 🟢 Green / 🟡 Yellow / 🔴 Red)
                                  │
                                  ▼
                        6. PREVISUALIZACIÓN
                                  │
                                  ▼
                    7. COMPUERTA DE APROBACIÓN HUMANA
                   ┌──────────────┴──────────────┐
                   ▼                             ▼
              [ RECHAZAR ]                  [ APROBAR ]
             (Corrección)                        │
                                                 ▼
                                            8. IMPORT
                                       (Transaccional)
                                                 │
                                                 ▼
                                        9. RECONCILIACIÓN
                                       (100% Filas Contabilizadas)
```

---

## 2. Registro Canónico de Archivos (File Registry)

Cada archivo recibido se registra en la tabla aislada del tenant con su hash criptográfico y metadatos de trazabilidad:

```typescript
export interface OnboardingFileRecord {
  id: string;                      // UUID único del archivo
  tenantId: string;                // Aislamiento estricto por tenant
  fileName: string;                // Nombre original del archivo
  mimeType: string;                // application/vnd.openxmlformats..., application/pdf, etc.
  sizeBytes: number;               // Tamaño en bytes
  sha256Hash: string;              // Detección de duplicados e idempotencia
  source: "web_upload" | "sftp";   // Origen de la ingesta
  uploadedBy: string;              // UUID del operador
  uploadedAt: string;              // Timestamp ISO 8601
  status: OnboardingFileStatus;    // Máquina de estados del archivo
  storageBucket: string;           // <tenant>-onboarding (Privado)
  storagePath: string;             // uploads/{year}/{month}/{fileId}
}
```

### Máquina de Estados del Archivo:
`RECEIVED` $\rightarrow$ `PROCESSING` $\rightarrow$ `EXTRACTED` $\rightarrow$ `MAPPED` $\rightarrow$ `VALIDATION_REQUIRED` $\rightarrow$ `READY` $\rightarrow$ `IMPORTING` $\rightarrow$ `IMPORTED` $\rightarrow$ `RECONCILED` (o `FAILED`).

---

## 3. Modelo de Extracción (Excel & PDF)

* **Excel (.xlsx, .xls, .csv):**
  * Extracción multipestaña con detección de nombres de hojas.
  * Análisis de cabeceras en primeras $N$ filas con detección de filas vacías.
  * Preservación de tipos de datos nativos (strings, números, fechas seriales de Excel, fórmulas evaluadas).
* **PDF (.pdf):**
  * Clasificación inicial del documento:
    1. **PDF Textual:** Extracción directa de streams de texto estructurado.
    2. **PDF Tabular:** Detección de rejillas y tablas mediante análisis de coordenadas espaciales.
    3. **PDF Escaneado:** Activación de OCR **únicamente cuando no existan streams de texto legibles**.
    4. **PDF Mixto:** Procesamiento híbrido por páginas.

---

## 4. Modelo de Normalización (Preservación de Datos Originales)

**Regla de Oro:** La normalización **nunca destruye el valor original**. Siempre se almacenan en paralelo `rawValue` y `normalizedValue`:

* **Teléfonos:** Limpieza de caracteres no numéricos y conversión al estándar internacional **E.164** (ej. `612345678` $\rightarrow$ `+34612345678`).
* **Emails:** Eliminación de espacios perimetrales y conversión estricta a minúsculas (`  User@Domain.COM  ` $\rightarrow$ `user@domain.com`).
* **Texto y Nombres:** Normalización de espacios múltiples y caracteres Unicode (`Carlos   Mendoza` $\rightarrow$ `Carlos Mendoza`).
* **Fechas:** Conversión a formato estándar **ISO 8601** (`YYYY-MM-DD`).
* **Importes Monetarios:** Normalización a enteros en céntimos para evitar errores de coma flotante (`12,50 €` $\rightarrow$ `1250`).

---

## 5. Modelo de Mapeo Semántico (Semantic Mapping)

El motor evalúa los nombres de columnas mediante un diccionario ponderado de expresiones regulares y similitud semántica en español e inglés, generando una propuesta con **puntuación de confianza (0.00 a 1.00)** y evidencia explicativa:

| Cabecera Origen | Campo Destino Propuesto | Confianza | Evidencia del Mapeo | Estado Inicial |
| :--- | :--- | :---: | :--- | :---: |
| `Nombre Completo` | `customer.displayName` | **98%** | Regex match `^nombre\s*completo$` | 🟢 Propuesto |
| `Correo Electronico`| `customer.email` | **99%** | Regex match `^correo\s*electronico$` | 🟢 Propuesto |
| `Teléfono móvil` | `customer.phone` | **97%** | Regex match `^telefono$` | 🟢 Propuesto |
| `Empresa` | `customer.companyName` | **92%** | Regex match `^empresa$` | 🟡 Revisar |
| `Ref. Interna` | `UNMAPPED_FIELD` | **0%** | Sin coincidencia en diccionario | 🔴 Manual |

---

## 6. Motor de Validación y Detección de Duplicados

Cada fila extraída se categoriza según su nivel de severidad:

* 🟢 **GREEN (Listo para Importar):** Todos los campos obligatorios presentes, sintaxis válida, sin colisiones de unicidad.
* 🟡 **YELLOW (Requiere Confirmación Humana):**
  * Detección de **potencial duplicado difuso** (ej. `Carlos Mendoza Ruiz` vs `Carlos Mendoza R.` con mismo teléfono/email y similitud > 90%).
  * Nombres de empresas que difieren ligeramente de empresas existentes (ej. `TechAcme Solutions SL` vs `TechAcme`).
* 🔴 **RED (Bloqueante / Requiere Corrección):**
  * Email con sintaxis inválida (sin `@` o dominio malformado).
  * Teléfono con número de dígitos imposible.
  * Campo obligatorio vacío (ej. cliente sin nombre).
  * **Ninguna fila marcada en Rojo puede ser importada.**

---

## 7. Modelo de Aprobación Humana (Human-in-the-Loop)

La interfaz de usuario presenta una compuerta de decisión explícita:

1. **Revisión de Mappings de Cabeceras:** El operador confirma o reasigna el destino de cada columna del archivo.
2. **Revisión de Filas en Amarillo/Rojo:**
   * **[ Confirmar ]:** Acepta la propuesta del sistema (ej. confirmar que es un nuevo cliente o fusionar con existente).
   * **[ Corregir ]:** Modifica el dato directamente en la UI de previsualización antes de persistir.
   * **[ Rechazar ]:** Excluye la fila de la importación (marcada como `REJECTED` en la reconciliación).

---

## 8. Motor de Importación Transaccional & Conciliación (100%)

La importación se ejecuta dentro de transacciones de base de datos aisladas por tenant. Para cada fila se emite un estado de reconciliación:

* `CREATED`: Nuevo registro creado con éxito.
* `UPDATED`: Registro existente enriquecido o actualizado tras confirmación.
* `SKIPPED`: Fila ignorada intencionadamente por el operador.
* `DUPLICATE`: Fila descartada por ser duplicado exacto.
* `REJECTED`: Fila rechazada por validación o decisión humana.
* `FAILED`: Error transaccional en base de datos.

### Ecuación de Conciliación Obligatoria (100%):
$$\text{Total Filas Origen} = \text{Creados} + \text{Actualizados} + \text{Omitidos} + \text{Rechazados} + \text{Fallidos}$$

---

## 9. Trazabilidad Completa y Pista de Auditoría (Audit Trail)

Cada entidad persistida en PostgreSQL contiene un enlace a su registro de auditoría (`public.import_audit_trail`):
* `fileId`: Identificador del archivo fuente.
* `sheetOrPage`: Hoja de Excel o página del PDF.
* `rowPosition`: Número de fila exacto en el archivo original.
* `sourceValues`: JSON con los valores crudos originales.
* `approvedBy`: Operador humano que autorizó la importación.
* `approvedAt`: Fecha y hora de la aprobación.
* `entityId`: UUID de la entidad generada en la base de datos.

---

## 10. Seguridad, Aislamiento de Tenants e Idempotencia

* **Aislamiento Físico:** Cada tenant sube sus archivos exclusivamente a su bucket privado (`<tenant>-onboarding`).
* **Protección RLS:** Las políticas de PostgreSQL impiden que un operador del Tenant A pueda visualizar o importar archivos del Tenant B.
* **Idempotencia vía SHA-256:** Si se sube exactamente el mismo archivo dos veces, el sistema detecta la coincidencia por hash, advierte al operador y evita la creación duplicada de registros.

---

## 11. Fixture Sintético de Pruebas (Golden Test Dataset)

Para la validación del motor se utiliza un dataset sintético correspondiente a una empresa ficticia (**VerdeOliva Catering SL** en Madrid), garantizando que **no se utiliza ni un solo dato real de EatClean ni de terceros**:

* `Carlos Mendoza Ruiz` (techacme.es) $\longrightarrow$ 🟢 Válido / Creación limpia.
* `Laura Gómez Serrano` (consultingbeta.com) $\longrightarrow$ 🟢 Válido / Creación limpia.
* `David Fernández` (techacme.es) $\longrightarrow$ 🟢 Válido / Creación limpia.
* `Carlos Mendoza R.` (techacme.es) $\longrightarrow$ 🟡 Candidato a duplicado (Similitud 94%).
* `Marta Invalida` (email sin arroba / teléfono 12345) $\longrightarrow$ 🔴 Inválido / Bloqueado.
