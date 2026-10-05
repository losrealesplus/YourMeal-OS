# CR-ORDER A2 — Compatibilidad downstream antes de escritura

Alexander autoriza dos PR independientes tras #493: A2 y Offer Pricing M1. Este PR solo A2, base 54614a2ef29aba36977acf433a629d013d9b1305. Razón: permitir transportar conocimiento capturado sin perder identidad, raciones ni incertidumbre antes de abrir persistencia custom. Reutiliza Orders y Operations existentes; no introduce almacenamiento paralelo.

Lecturas snapshot-first, claves tipadas y NULL solo como ausencia real de Dish. Propuestas custom pendientes no crean pedidos ni se aplican a plantillas legacy. Confirmación/modificación/lotes/repetición se cierran ante custom/v2. El contrato congelado permanece íntegro; constraints A1 y proveedor no se modifican.

Revisión independiente detectó composición mixta DECLARED/UNKNOWN agrupada, identidades sentinela y colisiones en serialización del fingerprint. Se endurecieron agregados conservadores, metadatos por UUID de origen, etiquetas por línea, helper de identidad y tuplas JSON con pruebas. CSV añade tres columnas de trazabilidad tras las 14 existentes; fingerprint versiona schema2. Ver CR_ORDER_A2_DOWNSTREAM_COMPATIBILITY para el impacto de export y referencia histórica.

Tests, typecheck, lint de archivos tocados, build y governance se registran en el informe del PR. Lint global mantiene deuda previa fuera de este alcance. No evidencia productiva inventada ni certificación A4. Estado final: PR OPEN / READY FOR HUMAN REVIEW; siguiente actor Alexander. Merge y aplicación de proveedor permanecen fuera de autorización.
