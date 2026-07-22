# Finanzas — Ubiquitous Language

**Área:** cobro y liquidación  
**Espina:** … → Delivery → Payment

---

# Payment · `Payment`

## Definición

Liquidación económica asociada a un Order / Invoice en el momento que la operación lo exige (anticipo, contra entrega, factura…).

## Qué es

El **cobro / pago** registrado.

## Qué NO es

No es la Invoice completa.  
No es el estado del Order por sí solo.  
No es el Delivery (aunque pueda ocurrir en la entrega).

## Existe cuando...

Hay un compromiso de cobro (Due / Pending) o se captura un importe.

## Finaliza cuando...

Queda Settled / Closed (o Failed documentado).

## Responsable principal

Administración · repartidor (si cobro en ruta) · Consumer / Company Account (pagador).

## Se relaciona con

Order · Invoice · Delivery · Consumer / Company Account

## Operational Checks habituales

Pendiente de cobro en Delivery · cuenta al día

## Capabilities relacionadas

Payments · Accounting · Deliveries

## Sinónimos prohibidos

Cobro (solo Nivel 2 ES) · Cargo · Charge (ambiguo) · Transaction (técnico)

## Notas

El momento exacto (anticipo vs contra entrega) es regla de la Organization; el concepto es el mismo.

---

# Invoice · `Invoice`

## Definición

Documento / compromiso de facturación emitido a un Consumer o Company Account.

## Qué es

La **factura** (o equivalente) que agrupa importes a liquidar.

## Qué NO es

No es el Payment (la liquidación).  
No es el Order (aunque lo referencie).

## Existe cuando...

Se emite según reglas de la Organization.

## Finaliza cuando...

Se anula o queda saldada vía Payment(s).

## Responsable principal

Administración.

## Se relaciona con

Order · Payment · Consumer / Company Account

## Operational Checks habituales

—

## Capabilities relacionadas

Accounting · Payments

## Sinónimos prohibidos

Factura (solo Nivel 2 ES) · Bill · Ticket (ambiguo)

## Notas

Puede madurar después de Payment en ruta; no sobre-modelar flujos fiscales en v0.1.
