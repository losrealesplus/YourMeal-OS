# 01 · Validation Principles

Reglas del juego de **Operational Validation**.  
Innegociables durante FASE 5.

---

## Principio rector

> **La validación no busca confirmar. Busca refutar.**

Formular cada ejercicio como:

> ¿Qué tendría que pasar para que este modelo dejara de ser válido?

Si no encontramos grietas tras un esfuerzo honesto, el modelo gana credibilidad.  
Si encontramos grietas, **mejor ahora que en producción**.

---

## Reglas del juego

### 1. No se añaden features durante la validación

- Ninguna Capability nueva.  
- Ninguna pantalla. Ninguna API de producto.  
- Ningún «ya que estamos, implementamos…».

La validación prueba el **modelo**, no el software.

### 2. Toda anomalía debe clasificarse

Cada hallazgo recibe:

- Tipo (escenario · edge case · campo)  
- Dictamen (ver [05 validation-reports](./05-validation-reports/README.md))  
- Referencia a objetos / Invariants implicados

Sin clasificación, el hallazgo no cuenta.

### 3. Ninguna corrección entra directamente en el Operational Model

> **Todo cambio al modelo debe estar respaldado por un Validation Report.**

Flujo obligatorio:

```text
Hallazgo → VR-xxx → (si aplica) MC-xxx en 06-model-changes → edición 17-operational-model
```

Modificaciones impulsivas fracturan la Constitución.

### 4. Primero se demuestra, luego se modifica

- No «arreglar» el modelo mientras se ejecuta el escenario.  
- Documentar el dictamen completo.  
- Solo entonces proponer cambio en `06-model-changes/`.

### 5. La pregunta es de coherencia, no de UI

❌ «¿La pantalla de pedidos lo permite?»  
✔ «¿Order → Production Plan sigue siendo válido con pedido masivo?»

### 6. Intentar romper Invariants a propósito

Los edge cases deben apuntar a [Invariants](../17-operational-model/05-invariants/README.md).  
Un edge case que no tensiona al menos un Invariant o Lifecycle es demasiado blando.

### 7. Field observation valida, no descubre procesos nuevos

En EatClean (cuando se active):

- No es Discovery de «qué podríamos construir».  
- Es comprobar si el modelo **explica** lo que ya ocurre.

Plantilla: [04-field-observation](./04-field-observation/README.md).

### 8. Discovery y Validation no se mezclan en el mismo acto

| Momento | Carpeta | Pregunta |
|---------|---------|----------|
| Evolución futura del producto | 16 Discovery | ¿Qué aprendimos? |
| Resistencia del modelo actual | 18 Validation | ¿Dónde falla el modelo? |

Un finding de Discovery puede **inspirar** un escenario de validación. No sustituye el dictamen.

### 9. El modelo gobierna; la validación no lo reescribe

Jerarquía intacta:

```text
Invariant → Lifecycle → Operational Check → Capability
```

La validación puede proponer ajustes. No puede invertir la jerarquía.

### 10. Certificación y niveles de confianza

Alpha → Beta → RC → **Certified v1.0**. Ver [07-certification](./07-certification.md).  
Tras Certified v1.0, todo cambio al modelo requiere VR → MC.

### 11. Auditoría, no walkthrough

Ejecutar escenarios con [protocolo de 6 preguntas](./02-validation-scenarios/audit-protocol.md) por paso.  
La sexta: **¿necesitamos inventar un concepto nuevo?** — Si sí, grieta.

### 12. Medir estabilidad, no solo fallos

Actualizar [validation-coverage](./05-validation-reports/validation-coverage.md) tras cada VR/MC.

### 13. La carga de la prueba recae sobre el cambio

> **Toda anomalía debe intentar explicarse primero con el modelo existente.**  
> **Solo cuando esa explicación sea imposible se propone una modificación del modelo.**

Ante «este caso no encaja, añadamos un objeto»:

1. ¿Se explica con Objects · Dependencies · Lifecycles · Checks · Invariants **actuales**?  
2. ¿Es solo imprecisión documental? → VR **Clarified** (sin inflar vocabulario).  
3. ¿Imposible sin ampliar? → VR **Extended** o **Contradicted** + MC con evidencia.

El modelo no crece por comodidad.

### 14. Rigor sí; blindaje ante evidencia, no

El principio 13 evita inflar el modelo. Este principio evita el sesgo inverso:

> **El modelo merece ser defendido con rigor, pero nunca protegido de la evidencia.**

| Correcto | Incorrecto |
|----------|------------|
| Exigir evidencia para **cambiar** | «El modelo siempre tiene razón» |
| VR **Contradicted** → MC sin drama | Validación como **defensa** del diseño |
| Modificar tras refutación real | Ignorar VR porque «ya lo decidimos» |

Una contradición demostrada no es derrota del proceso. **Es su resultado esperado.**

### 15. Cada VS rompe una dimensión distinta

> **Nunca repetir el mismo tipo de tensión.**

Seis escenarios que prueban lo mismo no son validación: son repetición.

| VS | Dimensión |
|----|-----------|
| VS-001 | Adaptabilidad operativa |
| VS-002 | Continuidad operativa |
| VS-003 | Trazabilidad / seguridad alimentaria (recorrido **inverso**) |
| VS-004 | Error humano y recuperación |
| VS-005 | Escalabilidad extrema |
| VS-006 | Generalización del dominio |

Roadmap: [02-validation-scenarios](./02-validation-scenarios/README.md).

### 16. No corregir el modelo tras cada VS

> **Primero los seis VR. Luego el análisis conjunto. Solo entonces cambios al Operational Model.**

| Correcto | Incorrecto |
|----------|------------|
| Acumular MC **propuestos / aparcados** | Aplicar MC-001 al cerrar VS-001 |
| Buscar causas estructurales comunes | Sobreajustar a un único caso |
| Priorizar brechas tras VS-001…006 | Tratar síntomas aislados |

Una grieta de VS-001 puede ser la **misma** que en VS-003 y VS-006. Corregir pronto = riesgo de síntoma, no de causa.

Flujo FASE 5:

```text
VS-001…006 → VR-001…006 (+ MC propuestos aparcados)
        ↓
Análisis conjunto de brechas
        ↓
Priorizar MC → aplicar a 17-operational-model
```

---

## Dictámenes permitidos

| Símbolo | Significado |
|---------|-------------|
| ✔ | Modelo confirmado |
| ⚠ | Ajuste menor (documentar en MC) |
| 🔁 | Requiere ampliar o corregir Lifecycle |
| 🚨 | Rompe o tensiona un Invariant |

Detalle: [05-validation-reports](./05-validation-reports/README.md).

---

## Anti-patrones (prohibidos)

| Anti-patrón | Por qué |
|-------------|---------|
| «Ya tenemos suficiente, empecemos a programar» | Excepciones en 6 meses |
| Parche en código sin tocar modelo | El producto lo define el parche |
| Añadir Core Object «por si acaso» | Rompe filtro 02 |
| Confirmar sin intentar refutar | Sesgo de confirmación |
| Mezclar validación con diseño de UI | Pregunta equivocada |

---

## Relacionado

- [README](./README.md)  
- [02 validation-scenarios](./02-validation-scenarios/README.md)  
- [06 model-changes](./06-model-changes/README.md)
