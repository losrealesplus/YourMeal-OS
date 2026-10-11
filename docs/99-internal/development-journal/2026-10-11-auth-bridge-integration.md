# 2026-10-11 — Integración revisable del puente de identidad

El propietario autoriza una rama, nueva migración, activación compatible, tests, commit/push y un PR; prohíbe merge/SQL/deploy productivos. Base 7e652d36; reutilización del experimento 0f086665.

Instalación cerrada y activación separada con huellas de funciones, RLS/triggers y ACL del puente. Historial GRANT intacto; secuencia SQL selectiva documentada sin falsa aplicación ni reparación del ledger. Evidencias sintéticas y manifiesto en docs/10-validation/p0-orders/auth-bridge-integration. Sin Gate7 modificado ni flags activados. La cocina podrá recuperar la captura administrativa tras autorizaciones futuras.
