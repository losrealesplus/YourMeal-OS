# SMOKE_HP-001 — evidencia de demostración

**No es desarrollo.** Es evidencia para ORR.  
**Precondiciones:** PR #23 en `main` + migración `program_draft_order` aplicada.

Si **cualquier** paso falla → sigue siendo **bloqueo de ORR**, no fallo de FOV.

---

## Recorridos

```text
Producto:  Login → Dish → Weekly Menu → Program Order → Summary → Confirm
Técnico:   Draft → Confirm → Persist → Audit → Invalidate → Confirmed
```

---

## Evidencia mínima (responder con hechos)

| Paso | Evidencia esperada | ☐ / ref |
|------|--------------------|---------|
| Login | Usuario autenticado (+ tenant activo) | ☐ |
| Weekly Menu | Menú published cargado correctamente | ☐ |
| Program Order | Draft creado (order + items) | ☐ |
| Summary | Totales calculados por **servidor** (no cliente) | ☐ |
| Confirm | Confirmación aceptada (`status=confirmed`) | ☐ |
| Persist | Pedido almacenado en BD | ☐ |
| Audit | Evento(s) en `audit_log` (`create` + `status_change`) | ☐ |
| Invalidate | UI actualizada sin inconsistencias (sin CTA Confirm) | ☐ |

Complemento: Dish lectura real · sin mocks en flujo live · ownership/tenant coherente.

---

## Resultado

```text
Resultado smoke:  ok | parcial | fallo
Commit / tag:
Fecha:
Ejecutor:
Notas:
```

Tras smoke **ok** → [ORR](../22-implementation/ORR.md) · acta `ORR_HP-001.md` solo al cerrar.
