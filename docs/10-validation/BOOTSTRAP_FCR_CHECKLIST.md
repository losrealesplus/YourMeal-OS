# Bootstrap Mode · Functional Completeness Review (operacional)

**Uso:** con `VITE_BOOTSTRAP_MODE=true` y banner visible.  
**No certifica Auth.** Certifica recorrido UI / operación de pantallas.  
**Práctica:** [Development Identity Adapter](../20-evidence-framework/11-development-identity-adapter.md)

---

## Severidad (una sola por hallazgo)

| | |
|--|--|
| **P0** | Bloquea la operación |
| **P1** | Existe pero no puede completarse |
| **P2** | UX |
| **P3** | Visual / detalle |

Registrar en notas: ruta · perfil · severidad · taxonomía FOPEBA (si aplica).

---

## Customer (`customer` → `/app`)

| # | Pantalla / flujo | □ | Hallazgo (P0–P3) | Notas |
|---|------------------|---|------------------|-------|
| C1 | Home | □ | | |
| C2 | Menú | □ | | |
| C3 | Pedido / programación | □ | | |
| C4 | Historial | □ | | |
| C5 | Favoritos / preferencias | □ | | |
| C6 | Perfil | □ | | |
| C7 | Entrada Centro Operaciones (si visible) | □ | | |

---

## Company Admin (`company_admin` → `/admin`)

| # | Pantalla / flujo | □ | Hallazgo (P0–P3) | Notas |
|---|------------------|---|------------------|-------|
| A1 | Dashboard Ops | □ | | |
| A2 | Clientes | □ | | |
| A3 | Empresas | □ | | |
| A4 | Cocina | □ | | |
| A5 | Producción | □ | | |
| A6 | Administración / settings | □ | | |
| A7 | Auditoría | □ | | |
| A8 | Pedidos / menús / resto nav visible | □ | | |

---

## SaaS Admin (`company_admin` + `saas_admin`)

| # | Pantalla / flujo | □ | Hallazgo (P0–P3) | Notas |
|---|------------------|---|------------------|-------|
| S1 | Entry «Centro de Operaciones YourMeal OS» visible | □ | | |
| S2 | `/saas` Overview | □ | | |
| S3 | Tenants | □ | | |
| S4 | Company Admins / Platform Owners UI | □ | | |
| S5 | Roles | □ | | |
| S6 | Auditoría SaaS | □ | | |
| S7 | Feature flags / settings / branding (si aplica) | □ | | |

---

## Perfiles operativos adicionales (opcional Day-0)

| Perfil | Home | Recorrido mínimo | □ |
|--------|------|------------------|---|
| Kitchen | `/admin/kitchen` | Vista cocina usable | □ |
| Delivery | `/admin/delivery` | Vista reparto usable | □ |
| Support | `/admin` | Support / hub | □ |
| Finance | `/admin` | Accounting / hub | □ |

---

## Cierre de sesión de evidencia

```text
Identity source (obligatorio en acta): BootstrapIdentityProvider
Banner visible en capturas: sí / no
Auth producción: NO certificada en esta pasada
```

Fecha · revisor · build/commit:
