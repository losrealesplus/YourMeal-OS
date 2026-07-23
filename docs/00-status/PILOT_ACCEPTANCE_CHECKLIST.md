# PILOT_ACCEPTANCE_CHECKLIST · EatClean

**Última actualización:** 2026-07-23  
**Propósito:** visión única del estado real del piloto — no depender de recordar qué PR implementó cada pieza.  
**Regla cero humo:** nada visible puede ser decorativo. Visible sin funcionalidad = **BLOCKED** para G-02.  
**Relacionado:** [ORR Party/B2B/B2C](./ORR_B2B_B2C_PARTY.md) · [CURRENT_PHASE](./CURRENT_PHASE.md) · [Functional Completeness](./EATCLEAN_PILOT_FUNCTIONAL_COMPLETENESS_REVIEW.md)

---

## Por qué existe este documento

Con los PR **#30–#34** el sistema deja de ser solo “recibir pedidos” y pasa a una **cadena operativa continua**. FOPEBA puede observar un Operational Journey completo.

Antes de declarar **Pilot Ready**, este checklist es el control único:

| Pregunta | Respuesta esperada |
|----------|-------------------|
| ¿Qué pantallas existen? | Columna Visible |
| ¿Hacen trabajo real? | Funciona |
| ¿El dato sobrevive? | Persiste |
| ¿Quién puede verlas? | RBAC |
| ¿Qué ORR las cubre? | ORR |
| ¿Listas para campo? | Estado |

**Leyenda Estado**

| Símbolo | Significado |
|---------|-------------|
| ✅ | Aceptado para piloto (evidencia en app + persistencia) |
| 🟡 | Parcial / hueco funcional — no bloquea un piloto *acotado* si se declara fuera de alcance |
| ❌ | Hueco — bloquea G-02 si la pantalla es visible o el flujo es obligatorio |
| — | No aplica |
| ☐ | Pendiente de validación humana en entorno real |

---

## Operational Journey (mínimo cerrado)

```text
Cliente
    │
    ▼
Onboarding
(B2C / Employee)
    │
    ▼
Pedido
    │
    ▼
Centro de Operaciones
    │
    ├── Cocina
    │       │
    │       ▼
    │   Preparación
    │
    └── Reparto
            │
            ▼
        Entrega
            │
            ▼
     Pedido cerrado
```

Ese recorrido es el **Operational Journey** mínimo del piloto.  
No se abren más módulos hasta completar este checklist y el gate **G-02**.

---

## Tabla maestra · estado real del piloto

> Valores iniciales = auditoría de código (2026-07-23) sobre la línea PR-034 + Party/B2B.  
> Sustituir ☐ / 🟡 / ❌ por ✅ solo tras validación en entorno con migraciones aplicadas y RBAC real.

| Área | Visible | Funciona | Persiste | RBAC | ORR | Estado | Notas |
|------|:-------:|:--------:|:--------:|:----:|:---:|:------:|-------|
| Login | ✅ | ✅ | ✅ | ✅ | ORR-001 | ☐ | `/auth` · Supabase |
| Recuperar contraseña | ✅ | ✅ | ✅ | — | ORR-001 | ☐ | `/reset-password` |
| Onboarding Particular | ✅ | ✅ | ✅ | — | ORR-001 | ☐ | `ensure_individual_customer` |
| Onboarding Empleado | ✅ | ✅ | ✅ | ✅ | ORR-003 | ☐ | Company Code → sede → OU |
| Alta Empresa (staff) | ✅ | ✅ | ✅ | ✅ | ORR-002 | ☐ | `/admin/companies` · no self-reg |
| Home cliente | ✅ | ✅ | ✅ | ✅ | ORR-001 | ☐ | Menú real |
| Menú semanal | ✅ | ✅ | ✅ | ✅ | ORR-001 | ☐ | Published menu |
| Carrito / Resumen | ✅ | 🟡 | ✅ | ✅ | ORR-001 · 006 | 🟡 | Draft real; dirección UI incompleta |
| Confirmación | ✅ | ✅ | ✅ | ✅ | ORR-001 · 006 | ☐ | CAP-006 |
| Historial | ✅ | ❌ | ❌ | — | — | ❌ | Empty / CAP-007 scaffold |
| Perfil | ✅ | 🟡 | ❌ | — | — | 🟡 | Lectura; edición limitada |
| Direcciones | 🟡 | ❌ | ❌ | — | ORR-006 | ❌ | Botón muerto / schema sin UI |
| Alergias | 🟡 | ❌ | ❌ | — | — | ❌ | Botón muerto |
| Métodos de pago | 🟡 | ❌ | ❌ | — | — | ❌ | Botón muerto |
| Ops Home | ✅ | ✅ | ✅ | ✅ | ORR-004 | ☐ | Atención del día (no KPI dashboard) |
| Cocina | ✅ | ✅ | ✅ | ✅ | ORR-004 | ☐ | PR-034 · pedidos reales |
| Reparto | ✅ | ✅ | ✅ | ✅ | ORR-004 | ☐ | PR-034 · pedidos reales |
| Pedidos (ops) | ✅ | ✅ | ✅ | ✅ | ORR-004 | ☐ | Lista + timeline |
| Clientes (ops) | ✅ | ❌ | ❌ | ✅ | ORR-004 | 🟡 | Mock / incompleto — **cero humo** |
| Inventario | ✅ | ❌ | ❌ | ✅ | ORR-004 | 🟡 | Placeholder; home cuenta `stock≤min` |
| Branding | ✅ | ✅ | ✅ | ✅ | ORR-005 | ☐ | Tenant-managed |
| Sedes / OU (portal) | ✅ | ✅ | ✅ | ✅ | ORR-002 | ☐ | `/app/company/*` |
| Company Codes | ✅ | ✅ | ✅ | ✅ | ORR-002 | ☐ | Generados en alta |
| Usuarios (admin UI) | ❌ | ❌ | — | — | ORR-005 | 🟡 | Sin pantalla; roles en DB |
| Roles (admin UI) | ❌ | ❌ | — | ✅ | ORR-005 | 🟡 | Matriz en código; sin UI |
| Ciclo pedido E2E | — | ✅* | ✅ | ✅ | ORR-004 · 006 | ☐ | *vía UI Cocina/Reparto — validar en campo |
| RBAC roles piloto | — | ✅ | — | ✅ | ORR-005 | ☐ | kitchen · delivery · ops_manager · saas |

\*El ciclo de estados existe en UI + RPC `transition_order_status`; falta evidencia firmada en entorno EatClean.

---

## 1 · Customer App — pantalla a pantalla

| Pantalla | Visible | Funciona | Persiste | RBAC | Estado |
|----------|:-------:|:--------:|:--------:|:----:|:------:|
| Login | ☐ | ☐ | ☐ | ☐ | ☐ |
| Recuperar contraseña | ☐ | ☐ | ☐ | — | ☐ |
| Onboarding Particular | ☐ | ☐ | ☐ | — | ☐ |
| Onboarding Empleado | ☐ | ☐ | ☐ | ☐ | ☐ |
| Home | ☐ | ☐ | ☐ | ☐ | ☐ |
| Menú semanal | ☐ | ☐ | ☐ | ☐ | ☐ |
| Carrito / Resumen | ☐ | ☐ | ☐ | ☐ | ☐ |
| Confirmación | ☐ | ☐ | ☐ | ☐ | ☐ |
| Historial | ☐ | ☐ | ☐ | ☐ | ☐ |
| Perfil | ☐ | ☐ | ☐ | ☐ | ☐ |
| Direcciones | ☐ | ☐ | ☐ | ☐ | ☐ |
| Alergias | ☐ | ☐ | ☐ | ☐ | ☐ |
| Métodos de pago | ☐ | ☐ | ☐ | ☐ | ☐ |

**Acción si visible y no funciona:** ocultar, o implementar, o marcar “Próximamente” **fuera** del camino crítico del piloto (preferible ocultar = cero humo).

---

## 2 · Centro de Operaciones — pantalla a pantalla

| Pantalla | Visible | Funciona | Persiste | RBAC | Estado |
|----------|:-------:|:--------:|:--------:|:----:|:------:|
| Home | ☐ | ☐ | ☐ | ☐ | ☐ |
| Cocina | ☐ | ☐ | ☐ | ☐ | ☐ |
| Reparto | ☐ | ☐ | ☐ | ☐ | ☐ |
| Pedidos | ☐ | ☐ | ☐ | ☐ | ☐ |
| Clientes | ☐ | ☐ | ☐ | ☐ | ☐ |
| Inventario | ☐ | ☐ | ☐ | ☐ | ☐ |
| Administración / Settings | ☐ | ☐ | ☐ | ☐ | ☐ |
| Branding | ☐ | ☐ | ☐ | ☐ | ☐ |

---

## 3 · Administración comercial / tenant

| Pantalla | Visible | Funciona | Persiste | RBAC | Estado |
|----------|:-------:|:--------:|:--------:|:----:|:------:|
| Empresas | ☐ | ☐ | ☐ | ☐ | ☐ |
| Sedes | ☐ | ☐ | ☐ | ☐ | ☐ |
| Organizational Units | ☐ | ☐ | ☐ | ☐ | ☐ |
| Company Codes | ☐ | ☐ | ☐ | ☐ | ☐ |
| Usuarios | ☐ | ☐ | ☐ | ☐ | ☐ |
| Roles | ☐ | ☐ | ☐ | ☐ | ☐ |
| Branding | ☐ | ☐ | ☐ | ☐ | ☐ |

---

## 4 · Operación — ciclo de pedido sin tocar la BD

Confirmar en UI (Centro de Operaciones) que un pedido real recorre:

```text
Pedido creado
    ↓
Confirmado (= Pendiente en Cocina)
    ↓
En preparación
    ↓
Preparado
    ↓
Listo para reparto
    ↓
En reparto
    ↓
Entregado
```

| Paso | Actor | Pantalla | ☐ |
|------|-------|----------|---|
| Onboarding + pedido draft | Cliente | App | ☐ |
| Confirmación | Cliente | Confirmación | ☐ |
| Aparece en Cocina | Kitchen | `/admin/kitchen` | ☐ |
| → En preparación | Kitchen | Cocina | ☐ |
| → Preparado | Kitchen | Cocina | ☐ |
| → Listo para reparto | Kitchen | Cocina | ☐ |
| Aparece en Reparto | Delivery | `/admin/delivery` | ☐ |
| → En reparto | Delivery | Reparto | ☐ |
| → Entregado | Delivery | Reparto | ☐ |
| Timeline actualizado | Ops | Detalle / Pedidos | ☐ |
| Sin SQL manual | — | — | ☐ |

**Incidencia (opcional piloto):** En reparto → Incidencia → En reparto → Entregado.

---

## ORR → esta checklist

| ORR | Tema | ¿Cubre? | Resultado ORR |
|-----|------|---------|---------------|
| ORR-001 | Particular B2C | Login → pedido | ☐ PASSED · ☐ BLOCKED |
| ORR-002 | Empresa (alta EatClean) | Empresas · códigos · sedes | ☐ PASSED · ☐ BLOCKED |
| ORR-003 | Empleado | Onboarding empleado + stamp B2B | ☐ PASSED · ☐ BLOCKED |
| ORR-004 | Operaciones | Cocina · Reparto · ciclo | ☐ PASSED · ☐ BLOCKED · ~~DEFERRED~~ |
| ORR-005 | RBAC | Roles piloto + branding caps | ☐ PASSED · ☐ BLOCKED |
| ORR-006 | Integridad pedido | demand_channel · empresa · sede · DG | ☐ PASSED · ☐ BLOCKED |

Detalle ejecutable: [ORR_B2B_B2C_PARTY.md](./ORR_B2B_B2C_PARTY.md).

---

## Huecos conocidos (no abrir módulos nuevos)

Prioridad = **cerrar o esconder**, no expandir superficie.

| Hueco | Impacto piloto | Decisión sugerida |
|-------|----------------|-------------------|
| Inventario = PlaceholderPanel | Cero humo en Ops | Ocultar nav / Entrar hasta UI real, o implementar lista mínima de alertas |
| Clientes ops = mock | Cero humo | Ocultar o cablear lectura real |
| Historial / direcciones / alergias / pago | CJ-001 parcial | Fuera de alcance del piloto **o** ocultar entradas muertas |
| Usuarios / Roles UI | Admin | Aceptable si roles se asignan por SQL/seed documentado en piloto |
| Dirección en pedido | ORR-006 | Stamp site address / address_id en confirmación |

---

## Gate G-02 · Pilot Readiness

**Después** de completar esta checklist y los ORR obligatorios.

### Condiciones (todas)

1. Todos los ORR obligatorios del piloto en **PASSED** (o ítem explícitamente fuera de alcance firmado).
2. Ningún botón visible sin funcionalidad (cero humo).
3. Ninguna pantalla vacía en el camino crítico del Operational Journey.
4. Ningún flujo roto en Cliente → Pedido → Cocina → Reparto → Entregado.
5. Ningún dato crítico simulado cuando deba ser real (pedidos, estados, empresas, memberships).
6. RBAC validado para roles del piloto: `kitchen`, `delivery` / `logistics`, `operations_manager`, `company_admin`, `saas_admin`, customer/employee.
7. Un pedido recorre el ciclo completo **sin intervención manual en la base de datos**.

### Resultado

| Campo | Valor |
|-------|-------|
| Fecha | |
| Entorno | |
| Evidencia (links / capturas / FOV) | |
| **G-02** | ☐ PASSED · ☐ BLOCKED |

### Si G-02 = PASSED

YourMeal OS **deja la fase de construcción** y entra en **validación operacional** (FOV / conocimiento de campo).  
Ahí FOPEBA genera el mayor valor: observar fricción real, no inventar módulos.

### Si G-02 = BLOCKED

Registrar bloqueos en esta tabla; no abrir módulos nuevos; resolver huecos o reducir alcance del piloto por escrito.

| Bloqueo | Área | Acción | Dueño |
|---------|------|--------|-------|
| | | | |

---

## Disciplina de actualización

1. Un PR funcional → actualizar **fila** de la tabla maestra (no un documento paralelo por PR).
2. Validación en entorno → marcar ☐ de secciones 1–4.
3. ORR firmado → volcar resultado aquí + en [ORR_B2B_B2C_PARTY](./ORR_B2B_B2C_PARTY.md).
4. Solo entonces proponer **G-02**.

**No** declarar Pilot Ready por acumulación de PRs. Declararlo cuando esta hoja diga que el viaje operativo está cerrado y limpio.
