# Operational Flow Certification · EatClean

**Estado:** Plantilla preparada — **no ejecutar hasta Workspace Journeys (EP-OPS-003) CERTIFIED en el alcance**  
**Nivel:** 2 de certificación operacional (tras Entry + Journeys)  
**Predecesor:** [EP-OPS-003](../00-status/EP_OPS_003_WORKSPACE_OPERATIONAL_JOURNEY.md) · [ORC](./OPERATIONAL_READINESS_CERTIFICATION.md)  
**Piloto:** EatClean — valida una **operación completa entre departamentos**, no jornadas aisladas

---

## Por qué existe este nivel

Puedes tener:

```text
Customer CERTIFIED · Kitchen CERTIFIED · Support CERTIFIED
```

y aun así fallar el **traspaso entre departamentos**.

Eso no es Surface Gap. Es **Flow Gap**.

---

## Tipos de brecha

| Tipo | Definición | Ejemplo |
|------|------------|---------|
| **Surface Gap** | El usuario no puede completar su trabajo en su superficie | Kitchen no cierra lote |
| **Flow Gap** | Dos superficies funcionan por separado; el flujo entre ellas falla | Kitchen finaliza lote → Delivery no recibe información |

---

## Flujos críticos (piloto EatClean)

Rellenar solo tras Pasada 2. Evidencia: Session Log + capturas / notas.  
Resultado: ✅ completado · ⚠ Flow Gap + ID · ❌ bloqueado · □ pendiente

### Flujo A · Pedido normal

```text
Cliente → Programa pedido → Company Admin verifica → Kitchen produce
→ Delivery entrega → Cliente recibe → Historial actualizado
```

| Paso | Superficie / perfil | Resultado | Evidencia | Flow Gap (si no) |
|------|---------------------|-----------|-----------|------------------|
| Programa pedido | Customer | □ | | |
| Verifica | Company Admin | □ | | |
| Produce | Kitchen | □ | | |
| Entrega | Delivery | □ | | |
| Recibe / historial | Customer | □ | | |
| **Flujo A completo** | — | □ | | |

### Flujo B · Pedido personalizado

```text
Cliente → Menú personalizado → Kitchen detecta personalización
→ Producción → Entrega → Historial
```

| Paso | Superficie / perfil | Resultado | Evidencia | Flow Gap (si no) |
|------|---------------------|-----------|-----------|------------------|
| Personaliza | Customer | □ | | |
| Detecta / produce | Kitchen | □ | | |
| Entrega | Delivery | □ | | |
| Historial | Customer | □ | | |
| **Flujo B completo** | — | □ | | |

### Flujo C · Incidencia

```text
Cliente → Pedido → Incidencia → Customer Support
→ Resolución → Auditoría registrada
```

| Paso | Superficie / perfil | Resultado | Evidencia | Flow Gap (si no) |
|------|---------------------|-----------|-----------|------------------|
| Pedido / incidencia | Customer | □ | | |
| Atención | Support | □ | | |
| Resolución | Support (+ Ops si aplica) | □ | | |
| Auditoría | Tenant audit | □ | | |
| **Flujo C completo** | — | □ | | |

---

## Criterio de cierre de este nivel

Flow Certification **PASS** cuando:

1. Flujos A, B y C completados con evidencia.
2. No quedan Flow Gaps **P0/P1** abiertos (waiver explícito si se aceptan).
3. Surface Status de las superficies implicadas = **CERTIFIED** (o waiver documentado).

---

## Relación con ORR READY

Ver definición en [ORC](./OPERATIONAL_READINESS_CERTIFICATION.md#orr-ready).

```text
Surfaces CERTIFIED
        +
Flow Certification PASS
        +
Sin brechas P0/P1 abiertas
        ↓
ORR READY
```

---

## Registro de Flow Gaps (rellenar en ejecución)

| ID | Flujo | Brecha | Severidad | Estado |
|----|-------|--------|-----------|--------|
| | | | | |

Fecha · revisor · commit tip:
