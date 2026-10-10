# Cualificación local de staging y migraciones

Se creó el laboratorio SQL sintético sin red ni producción en la rama `codex/staging-migration-qualification`. Intención: caracterizar transición y evitar escrituras de pruebas en EatClean. Las dos migraciones originales conservaron hashes. A5 excluido.

Validación: 22 casos SQL, 62 unitarios afectados y 3 de aislamiento PASS; lint/sintaxis/diff PASS. Barrera de negocio probada solo en laboratorio, incluida SECURITY DEFINER y service_role. Cleanup PASS.

Se confirmó bloqueo del staging completo por registro canónico/EnvironmentStage ligado a producción. No se modifica el contrato ni el artefacto congelado en esta unidad. Informe único y evidencia en `reports/eatclean-sprint-02/STAGING_MIGRATION_QUALIFICATION_REPORT.md` del workspace de la conversación. Sin push/PR/merge ni deploy, conforme al alcance humano. P34 no reabierto; producción NO-GO.
