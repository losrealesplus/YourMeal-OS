# Doctor UI

**Documento:** `DOCTOR_UI.md`  
**Track:** DEVELOPER-PLATFORM-006  
**Producto:** YourMeal OS **Developer Platform v1.3**  
**Código:** `src/runtime/runtime-doctor/ui/` · `DoctorPanel.tsx`  
**ADR:** [0042 — Doctor UI](../adr/0042-doctor-ui.md)  
**Engines:** [DOCTOR_ENGINE](./DOCTOR_ENGINE.md) · [INCIDENT_ENGINE](./INCIDENT_ENGINE.md)

> El Doctor es el **punto de entrada visual** del Developer Platform.  
> En menos de 5 segundos: salud · fallos · degradación · incidentes · evidencia.

---

## Objetivo

Convertir el Doctor en una consola profesional de glance diagnostics — no un formulario, no un debugger.

Referencias de sensación: Raycast · Linear · Vercel · GitHub Actions · Xcode Organizer.

---

## Estructura visual

```text
Doctor
──────────────────────────
Developer Health · Score · tone
PASS / WARNING / ERROR / INCIDENTS / EVIDENCES
──────────────────────────
Capabilities   (todas · Coming Soon si no hay checks)
  └─ Checks desplegables
Incidents      (Incident Engine · detalle)
Recommendations (lista simple)
Timeline       (cronológica)
Evidence       (FOPEBA · Copy JSON)
──────────────────────────
Run Again · Copy Report · Export JSON
```

---

## Componentes

| Componente | Rol |
|------------|-----|
| `DoctorDashboard` | Score + métricas inmediatas |
| `DoctorCapabilities` | Matriz de capabilities + expand checks |
| `DoctorIncidentsSection` | Open incidents + detalle |
| `DoctorRecommendations` | Lista (sin IA) |
| `DoctorTimelineSection` | Eventos Incident Engine |
| `DoctorEvidenceSection` | Ledger + Copy JSON por evidencia |
| `DoctorActions` | Run Again · Copy Report · Export JSON |
| `doctor-ui-helpers` | Tono / counts / Coming Soon (puro) |

**Regla:** la UI **no** modifica Doctor Engine ni Incident Engine. Solo consume APIs públicas.

---

## Navegación

```text
Developer Portal → Host → Doctor (Health)
```

Incidents también existe como módulo hermano; el Doctor UI **integra** open incidents para glance único.

---

## Experiencia de uso

1. Abrir Platform → Doctor.  
2. **Run Doctor** (o Run Again).  
3. Leer Health Score + contadores (< 5 s).  
4. Expandir capability fallida → checks.  
5. Abrir incidente → recommendation + evidence ids.  
6. Revisar Timeline / Evidence.  
7. **Copy Report** o **Export JSON** (doctor + incidents + timeline).

---

## Non-goals

Recovery · Knowledge · ZIP · AI · Remote · Sync · nuevos checks · reescritura de engines.

---

## Roadmap de evolución UI

| Siguiente | Qué aporta |
|-----------|------------|
| Recommendation Engine | Recomendaciones estructuradas (qué/por qué/cómo/confianza) |
| Recovery Engine | Acciones `recover()` visibles en Incident detail |
| Export ZIP | Sustituye / complementa Export JSON |
| Knowledge | Patrones conocidos en el dashboard |

Hasta entonces, la UI ya hace **visibles** Incident + Evidence + Timeline.
