# 2026-10-11 — Contrato de catálogo de activación

Autorizado un PR focalizado, sin SQL de escritura ni activación productiva. Base 5abb88ec. READ ONLY demuestra igualdad de 15 políticas/5 triggers bajo contexto fijo; hashes anteriores difieren por uid() frente a auth.uid() según search_path. Corrección: contexto pg_catalog,pg_temp y única huella canónica. Puente/migración no se alteran.

26/26 pruebas focalizadas PASS, incluido rechazo de drift, aislamiento y pedido sintético auditado. Evidencia en auth-bridge-integration/activation-catalog-contract-results.json. No nuevas auditorías ni Gate7 alterado. Pendiente revisión humana del único PR correctivo; SQL selectivo y activación necesitan aprobación independiente.
