# Canal seleccionado de migración de EatClean

Este workflow instala exclusivamente el RPC v1 después de autorización humana. No despliega Worker,
no activa el flag, no ejecuta `db push`, no modifica pedidos y no instala ninguna otra migración pendiente.

## Antes de solicitar ejecución

1. Revisar y autorizar el merge del backend #548; revisar y mergear por separado el PR de este canal.
2. El propietario verifica `production-db`: reviewer soberano 292604102, ramas protegidas y bypass deshabilitado.
   La configuración observada permite bypass y el script la rechaza. Cualquier cambio de protección requiere
   autorización independiente. Con prevent_self_review=true, el run debe iniciarlo otro actor legítimo;
   no se elude esa regla ni se amplían permisos automáticamente.
3. El propietario confirma el secreto existente `SUPABASE_DB_URL_PROD` en production-db (no accesible en lectura
   con el PAT de esta sesión). Debe apuntar a EatClean, sesión pooler puerto5432 o host directo, BD postgres.
4. Confirmar que el SHA actual de main contiene exactamente los bytes de `rollback-v1-install.json` y la
   migración, y que el baseline de lectura sigue coincidiendo. Si cambió el schema/ledger, revisar y actualizar
   el baseline mediante otro commit; nunca aceptar drift desde un input de workflow.

## Preflight y posterior instalación — autorizaciones distintas

- Abrir el workflow versionado `migrate-production.yml` en main. Operación `preflight`, SHA actual de main,
  digest del manifiesto y motivo concreto. Se requiere revisión del entorno; sólo hay consultas read-only.
- Revisar el reporte `READ_ONLY_PREFLIGHT_PASS` y el target. Todavía no se instala nada.
- Sólo tras autorización expresa de instalación, iniciar un run nuevo en el mismo SHA revisado (o volver a
  revisar si main cambió), operación `install`, digest sellado, motivo y texto exacto
  `INSTALL_ONLY_20261023065216_ON_nhirlpkuvonggctdzzad`.
- El revisor aprueba únicamente `production-db` de ese run. El código comprueba autoridad otra vez y aplica
  transacción única. Revisar `INSTALLED_AND_VERIFIED`, ledger y firma/EXECUTE mediante lectura posterior.
- Si hay fallo o timeout tras comenzar: no repetir. Reconciliar ledger, firma, body digest y permisos en lectura.
  La emisión de un nuevo run no da autorización para un cambio distinto.

## Después

Validación de backend en staging. Luego retarget #549 a main y revisar aplicación. El flag continúa desactivado.
Un build nuevo con flag activo y el despliegue protegido requieren otra autorización independiente.
No se reutilizan las aprobaciones de la migración para el Worker.

## Pruebas locales

`node --test scripts/governance/rollback-migration.spec.mjs`

`node scripts/governance/rollback-migration.local-test.mjs`

La segunda usa únicamente Docker local con esquema actual y una base creada/eliminada por el test.
Nunca utiliza credenciales productivas ni el comando `main execute`.
