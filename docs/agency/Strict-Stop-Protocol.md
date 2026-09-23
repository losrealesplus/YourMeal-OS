# Protocolo de Detención Estricta (Strict Stop Protocol)
## YourMeal Agency Core · Mecanismos de Bloqueo Fatal, Disparadores y Recuperación

---

## 1. Naturaleza y Propósito del Strict Stop

El **Strict Stop** no es un agente más ni una recomendación opcional: es un **mecanismo transversal de interrupción fatal e inmediata de la ejecución** ante la detección de anomalías críticas, violaciones de gobernanza, brechas de seguridad o ausencia de evidencia.

> **REGLA SUPREMA:**  
> Ante un disparo de `STRICT STOP`, ningún agente puede continuar ejecutando cambios, escribir código, crear commits, fabricar excepciones o ignorar el bloqueo. La ejecución se detiene fulminantemente y se emite un reporte de bloqueo.

---

## 2. Catálogo de Disparadores Fatales de Strict Stop

Cualquiera de las siguientes 10 condiciones obliga a la activación inmediata de un **STRICT STOP**:

### 🛑 1. Autoridad No Resuelta o Usurpación de Rol
- Intento de implementar código sin diseño de Software Architect.
- Intento de un agente de ingeniería o comercial de aprobar sus propios cambios.
- Falta de dictamen de Foundation Guardian en cambios que afectan L0/L1.

### 🛑 2. Ambigüedad en el Límite Core ↔ Instance
- Duda sobre si una funcionalidad, tabla, regla o precio pertenece al Core genérico de YourMeal OS o a una instancia particular (e.g. EatClean).
- Intento de introducir lógica específica de un cliente dentro del Core.

### 🛑 3. Evidencia Insuficiente o Contaminada
- Intento de certificar software basándose en afirmaciones verbales sin pruebas reproducibles (*No Evidence → No Certification*).
- Detección de tests tautológicos (`expect(true).toBe(true)`) como única prueba.
- Presentación de hipótesis o señales comerciales como hechos consumados.

### 🛑 4. Regresión Técnica o Fallo en CI
- Fallo en el typecheck de TypeScript (`tsc --noEmit`).
- Fallo en el linter (`npm run lint`).
- Fallo en cualquier prueba unitaria, de integración o E2E.

### 🛑 5. Brecha de Seguridad o Fuga Multi-Tenant
- Detección de acceso o modificación cruzada de datos entre tenants (*cross-tenant data leakage / BOLA / IDOR*).
- Aceptación de `tenant_id` suministrado por el cliente HTTP sin contrastar contra la sesión JWT.
- Desactivación o bypass de Row Level Security (RLS) o abuso indebido de `service_role`.
- Elusión del sistema de capabilities (`can('...')`) usando chequeos de roles crudos.
- Secretos, API keys o tokens expuestos.

### 🛑 6. Corrupción de Historial de Base de Datos
- Modificación o eliminación de archivos de migración histórica en `supabase/migrations/`.
- Intento de alterar la base de datos sin una migración *forward-only* versionada.

### 🛑 7. Contaminación del Alcance (Scope Contamination)
- Presencia en el diff de archivos o cambios no contemplados en la autorización original (*unrelated changes*).
- Inclusión de código experimental no certificado junto a un cambio aprobado.

### 🛑 8. Contradicción con la Constitución (FOUNDATION.md)
- Cualquier cambio que vulnere los principios *Human First*, *Simplicity Wins*, *Privacy by Design* o *Architecture Before Code*.

### 🛑 9. Dictamen Negativo o Inconcluso de QA
- `QA Certification Report` con resultado `BLOCKED`, `FAILED`, `NOT TESTED` o `UNKNOWN`.

### 🛑 10. Intento de Despliegue Autónomo
- Intento de ejecutar `git push`, `git merge` a ramas protegidas o despliegues a entornos productivos sin autorización humana explícita (*Human Approval Gate*).

---

## 3. Protocolo de Ejecución ante un Disparo de Strict Stop

Cuando un agente detecta un disparador de Strict Stop, debe seguir obligatoriamente la secuencia:

```text
1. HALT (Detención inmediata de toda modificación o escritura)
   │
   ▼
2. ISOLATE (Preservación del estado del workspace sin comandos destructivos)
   │
   ▼
3. DOCUMENT (Identificación precisa del disparador y la evidencia)
   │
   ▼
4. REPORT (Emisión del Block Report estructurado)
   │
   ▼
5. HANDOFF (Transferencia al rol o autoridad competente para resolución)
```

### Prohibiciones Expresas durante un Strict Stop:
- **NO ejecutar** `git reset --hard` ni `git clean -fd` que destruyan trabajo previo (*Zero Lost Changes*).
- **NO intentar** parches rápidos o atajos para silenciar el fallo.
- **NO transformar** un blocker crítico en una "condición aceptable".

---

## 4. Estructura del Informe de Bloqueo (Block Report)

```markdown
# STRICT STOP: Block Report

## 1. Disparador Identificado
- **Categoría:** [Brecha de Seguridad / Scope Contaminated / Fallo QA / etc.]
- **Agente Detector:** [Nombre del agente que detectó la anomalía]
- **Momento de Detección:** [Etapa del ciclo operativo]

## 2. Evidencia Empírica del Bloqueo
- **Hecho Observado:** [Descripción técnica precisa del fallo o violación]
- **Archivos / Artefactos Afectados:** [Rutas exactas]
- **Logs / Errores Relevantes:** [Output de error, stacktrace o test fallido]

## 3. Principio o Gate Vulnerado
- **Nivel Afectado:** [L0 / L1 / Gate x]
- **Regla Específica:** [Referencia a FOUNDATION.md, AGENTS.md o Change-Gates.md]

## 4. Acciones Requeridas para Desbloqueo
- [Paso 1 requerido por el rol competente]
- [Paso 2 requerido por el rol competente]

## 5. Autoridad de Handoff
- **Derivado a:** [Foundation Guardian / Software Architect / Human Authority]
- **Estado:** STRICT STOP ACTIVO (Ejecución detenida).
```
