# Actores — Ubiquitous Language

**Área:** quién actúa en la operación  
**Fuente de verdad ampliada:** [ACTORS.md](../../12-domain-model/ACTORS.md)

> Queda **prohibido** usar «Cliente» o `Customer` sin contexto que indique el actor exacto.

---

# Organization · `Organization` / Tenant

## Definición

Empresa que contrata YourMeal OS y posee toda la operación (Tenant).

## Qué es

El dueño de menús, producción, rutas, stock y cobros dentro de la plataforma.

## Qué NO es

No es el Consumidor final.  
No es la Cuenta Empresa a la que se sirve comida.  
No es el SaaS Administrator de la plataforma.

## Existe cuando...

Se crea el Tenant y queda operativo.

## Finaliza cuando...

Se archiva / desactiva el Tenant (raro; histórico se conserva).

## Responsable principal

Administrador de la Organización · SaaS Admin (plataforma).

## Se relaciona con

Todos los objetos canónicos (pertenecen a una Organization).

## Operational Checks habituales

—

## Capabilities relacionadas

Platform · Tenant · AuthZ

## Sinónimos prohibidos

Cliente (ambiguo) · Company (si se confunde con CompanyAccount) · «el negocio» sin nombre

## Notas

Alias de Tenant. En producto preferimos **Organization**.

---

# Consumer · `Consumer`

## Definición

Persona que compra directamente a la Organization (B2C).

## Qué es

Quien genera Orders por cuenta propia y suele ser también destinatario.

## Qué NO es

No es Beneficiario (B2B).  
No es Cuenta Empresa.  
No es «Customer» genérico.

## Existe cuando...

Hay relación comercial directa con la Organization.

## Finaliza cuando...

Se archiva el perfil comercial (histórico de Orders se conserva).

## Responsable principal

Administración / atención · el propio Consumer en self-service.

## Se relaciona con

Order · Weekly Menu · Payment · Delivery

## Operational Checks habituales

Estado de cobro · datos de entrega completos

## Capabilities relacionadas

Orders · Customers (módulo legacy: preferir Consumer en lenguaje nuevo)

## Sinónimos prohibidos

Cliente · Customer · Usuario (ambiguo con User/auth)

## Notas

Si alguien dice «cliente», preguntar: ¿Consumer, CompanyAccount o Beneficiary?

---

# Company Account · `CompanyAccount`

## Definición

Entidad que contrata servicio de comida para un colectivo (empresa, colegio, hotel, gimnasio, ONG…).

## Qué es

Parte contratante B2B; puede pagar sin recibir ella misma cada ración.

## Qué NO es

No es un Consumer.  
No es el Beneficiario.  
No es la Organization (Tenant).

## Existe cuando...

Hay contrato / cuenta activa con la Organization.

## Finaliza cuando...

Se archiva la cuenta (histórico se conserva).

## Responsable principal

Administración comercial de la Organization.

## Se relaciona con

Beneficiary · Order · Invoice · Payment · Delivery

## Operational Checks habituales

Cuenta al día · destinatarios activos en ruta

## Capabilities relacionadas

B2B / Companies · Orders · Accounting

## Sinónimos prohibidos

Cliente · Customer · Empresa (sin «Cuenta») · Consumer

## Notas

Tabla histórica cercana: `companies`. El término canónico de producto es **Company Account**.

---

# Beneficiary · `Beneficiary`

## Definición

Persona que recibe el servicio contratado por una Company Account.

## Qué es

Destinatario operativo de Orders / Deliveries en modelo B2B.

## Qué NO es

No es quien necesariamente paga.  
No es Consumer (salvo que también compre en B2C en otro contexto).

## Existe cuando...

Está vinculado a una Company Account activa.

## Finaliza cuando...

Se da de baja del colectivo (histórico se conserva).

## Responsable principal

Company Account · administración de la Organization.

## Se relaciona con

CompanyAccount · Order · Delivery · Label

## Operational Checks habituales

Beneficiario en ruta · alergias / Label · cobro (si aplica en entrega)

## Capabilities relacionadas

B2B · Orders · Delivery · Packaging

## Sinónimos prohibidos

Cliente · Empleado (si se confunde con Employee de cocina) · Consumer

## Notas

En cocina a menudo dicen «el de la empresa X». Canónico: **Beneficiary**.

---

# Employee · `Employee`

## Definición

Persona de la Organization que opera el día a día (cocina, packaging, reparto, admin).

## Qué es

Operador interno. Ejecuta Checks, Batches, Routes, Packaging.

## Qué NO es

No es Consumidor.  
No es Beneficiario.  
No es SaaS Admin.

## Existe cuando...

Tiene rol operativo en el Tenant.

## Finaliza cuando...

Se desactiva el acceso / vínculo laboral operativo.

## Responsable principal

Administrador de la Organization.

## Se relaciona con

Production Batch · Packaging · Delivery Route · Delivery · Operational Checks

## Operational Checks habituales

—

## Capabilities relacionadas

Todos los Asistentes operativos (como usuario)

## Sinónimos prohibidos

Usuario (solo auth) · Cliente · Staff sin matizar rol

## Notas

«User» es identidad de autenticación; **Employee** es el rol de negocio.
