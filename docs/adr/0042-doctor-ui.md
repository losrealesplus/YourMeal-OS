# ADR 0042 — Doctor UI

## Estado

**Accepted** — 2026-08-05  
**Track:** DEVELOPER-PLATFORM-006  
**Producto:** Developer Platform **v1.3**  
**Detalle:** [DOCTOR_UI](../05-architecture/DOCTOR_UI.md)

## Contexto

Con Doctor Engine (#298) e Incident Engine (#299 / DEVELOPER-PLATFORM-005), la plataforma ya produce Checks → Evidence → Incident → Timeline. El panel mínimo de Doctor no permitía entender el estado completo de un vistazo. Construir Recommendation / Recovery / Knowledge **antes** de una UI madura ocultaría motores detrás de una interfaz pobre.

## Decisión

1. Introducir **Doctor UI v1.3** como capa de presentación pura (`runtime-doctor/ui/` + `DoctorPanel`).  
2. Dashboard: Health Score · PASS/WARNING/ERROR · INCIDENTS · EVIDENCES.  
3. Mostrar **todas** las capabilities; las sin checks = `Coming Soon` (nunca ocultar).  
4. Integrar Incident Engine, Timeline y Evidence en el mismo glance.  
5. Acciones: Run Again · Copy Report · Export JSON (sin ZIP).  
6. **No** modificar lógica de Doctor Engine ni Incident Engine; **no** añadir checks.

## Consecuencias

- Doctor se convierte en el punto de entrada visual del Developer Platform.  
- Motores posteriores (Recommendation · Recovery · Export ZIP · Knowledge) serán inmediatamente visibles.  
- Sensación de consola profesional (Linear / Vercel / Actions) frente a formulario de debug.
