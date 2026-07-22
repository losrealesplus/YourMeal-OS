# Logística — Ubiquitous Language

**Área:** salida y entrega  
**Espina:** … → Delivery Route → Delivery → …

---

# Delivery Route · `DeliveryRoute` (Route)

## Definición

Planificación logística de entrega para un conjunto de Orders dentro de una ventana temporal.

## Qué es

La **ruta** operativa del día / turno.

## Qué NO es

No es un mapa.  
No es el GPS.  
No es una Delivery individual.  
No es el Vehicle.

## Existe cuando...

Se crea / consolida la planificación para una ventana.

## Finaliza cuando...

Se completa (todas las Deliveries resueltas) y se cierra.

## Responsable principal

Logística / repartidor (Employee).

## Se relaciona con

Order · Packaging · Vehicle · Delivery · Payment (si cobro en ruta)

## Operational Checks habituales

Viabilidad en ventana · adelantar salida · redistribuir pedidos

## Capabilities relacionadas

Routes · Drivers · Deliveries

## Sinónimos prohibidos

Ruta (solo Nivel 2 ES) · Mapa · Trip · Journey

## Notas

En producto se puede decir **Route**; canónico completo **Delivery Route**.

---

# Vehicle · `Vehicle`

## Definición

Recurso de transporte asignable a una Delivery Route.

## Qué es

La furgoneta / medio que ejecuta la ruta.

## Qué NO es

No es la Route.  
No es el repartidor (Employee).

## Existe cuando...

Está dado de alta y disponible para asignación.

## Finaliza cuando...

Se da de baja / archiva.

## Responsable principal

Logística.

## Se relaciona con

Delivery Route · Delivery · Employee (conductor)

## Operational Checks habituales

Vehículo preparado · capacidad (futuro)

## Capabilities relacionadas

Routes · Drivers

## Sinónimos prohibidos

Furgoneta (Nivel 2/3) · Coche · Asset

## Notas

—

---

# Delivery · `Delivery`

## Definición

Confirmación de que una producción llegó al destinatario correcto en el momento correcto (o el registro de fallo / incidencia).

## Qué es

El **hecho** de entrega (parada / intento / resultado).

## Qué NO es

No es «un envío» genérico de mensajería.  
No es la Route entera.  
No es el Packaging.

## Existe cuando...

Hay una parada / entrega prevista en una Route (o intento).

## Finaliza cuando...

Queda Delivered / Failed / Incident y se cierra.

## Responsable principal

Repartidor (Employee).

## Se relaciona con

Delivery Route · Order · Consumer / Beneficiary · Payment · Label

## Operational Checks habituales

¿Debo cobrar? · destinatario correcto · ventana horaria

## Capabilities relacionadas

Deliveries · Payments · Orders

## Sinónimos prohibidos

Entrega (solo Nivel 2 ES) · Stop (si se usa solo técnico sin Delivery) · Shipment · Envío

## Notas

En Domain, **Delivery Stop** puede ser la unidad de parada; en producto **Delivery** nombra el hecho operativo.
