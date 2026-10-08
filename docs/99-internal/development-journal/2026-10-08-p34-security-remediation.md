# 2026-10-08 — P34 security remediation

Intención autorizada: impedir que la verificación de un cliente autorice otra ficha y liberar solicitudes en conflicto sin revivir aprobaciones. P2.2 ligado al contexto exacto; P2.3 cierre terminal con audit/ledger, membership, propietario y conflicto verificados en SQL. Migración nueva, mínimo privilegio, sin modificación histórica. P2.1 se incorpora en la rama UI apilada.

50 SQL/RLS, 405 CRM/order, 17 browser/SQL, 25 governance, typecheck, lint del alcance y ambos builds PASS. CI equivalente: start/reset/ledger 67/67 en proyecto temporal nuevo. Evidencia: `docs/10-validation/p34/P34_SECURITY_BACKEND_REMEDIATION.md`; logs completos fuera del repo en reports/eatclean-sprint-02.

Sin merge, proveedor ni producción. Revisión de seguridad y humana pendientes; OAuth legacy bloqueado; A5 HARD_DISABLED y A4b sin activación.
