# Actores — Lenguaje ubicuo de YourMeal OS

**Fuente de verdad de actores del dominio.**  
Complementa [UBIQUITOUS_LANGUAGE.md](./UBIQUITOUS_LANGUAGE.md).

**Código:** inglés · **Docs / razonamiento:** español (ADR 0010)

---

## Propósito

Este documento define los **actores oficiales** del dominio de YourMeal OS.

Su objetivo es eliminar ambigüedades durante el análisis, diseño, desarrollo y documentación del sistema.

> A partir de este documento queda **prohibido** utilizar la palabra **«Cliente»** sin un contexto que indique claramente a qué actor se hace referencia.

Cada actor representa un **rol** dentro del dominio y no necesariamente una persona o empresa concreta.

Una misma persona puede desempeñar distintos roles en diferentes contextos.

---

## Principio

YourMeal OS **no** modela personas.

Modela **roles dentro del negocio**.

Las decisiones del dominio siempre deben basarse en el rol que desempeña cada actor durante una operación.

---

## Organización

### Definición

Empresa u organización que contrata y utiliza YourMeal OS para gestionar su operación.

Representa el **Tenant** del sistema.

Ejemplos:

- EatClean
- Singular Street Food
- Healthy Kitchen

### Responsabilidades

- administrar la plataforma;
- configurar el negocio;
- gestionar usuarios;
- definir procesos;
- operar el servicio.

La **Organización** es el cliente directo de YourMeal OS (relación comercial SaaS).

### Identificador en código

`Organization` / `Tenant`

---

## Administrador

### Definición

Usuario interno con capacidad para configurar y administrar la Organización.

Ejemplos:

- propietario;
- gerente;
- administrador;
- supervisor.

### Responsabilidades

- configuración;
- permisos;
- usuarios;
- parámetros;
- supervisión.

No representa al consumidor final.

### Identificador en código

`Administrator` (roles de staff con capacidades de administración, p. ej. `company_admin`)

---

## Empleado

### Definición

Usuario interno que participa en la operación diaria de la Organización.

Ejemplos:

- cocinero;
- nutricionista;
- repartidor;
- atención al cliente;
- producción.

### Responsabilidades

- ejecutar procesos;
- gestionar pedidos;
- producir;
- preparar;
- entregar;
- operar el sistema.

No compra servicios.

No representa ingresos para la Organización.

### Identificador en código

`Employee` / staff operativo (`kitchen`, `production`, `driver`, …)

> **Nota:** no confundir con filas históricas `company_employees` (eso son **Beneficiarios** en el lenguaje ubicuo).

---

## Consumidor

### Definición

Persona que adquiere productos o servicios **directamente** de la Organización.

Ejemplo:

Juan compra un menú semanal de EatClean.

### Responsabilidades

- realizar pedidos;
- modificar pedidos (según reglas);
- consultar su información;
- recibir notificaciones.

El Consumidor utiliza los servicios de la Organización.

No utiliza YourMeal OS como plataforma de gestión.

### Identificador en código

`Consumer` (antes se usó `Customer` de forma ambigua — preferir `Consumer`)

---

## Cuenta Empresa

### Definición

Organización que contrata servicios para un colectivo de personas.

No representa necesariamente una empresa mercantil.

Puede ser:

- empresa;
- colegio;
- hotel;
- residencia;
- gimnasio;
- asociación;
- fundación;
- administración pública.

### Responsabilidades

- contratar servicios;
- gestionar acuerdos;
- aprobar presupuestos;
- recibir facturación;
- administrar beneficiarios.

La Cuenta Empresa puede ser únicamente la entidad pagadora.

No necesariamente consume los servicios.

### Identificador en código

`CompanyAccount` / `Company` (tabla `companies`)

---

## Beneficiario

### Definición

Persona que recibe el servicio contratado por una **Cuenta Empresa**.

Ejemplo:

Una Cuenta Empresa contrata almuerzos para sus trabajadores.

Los trabajadores son los **Beneficiarios**.

### Responsabilidades

- recibir el servicio;
- personalizar pedidos (si procede);
- consultar información;
- recibir comunicaciones.

No realiza necesariamente el pago.

### Identificador en código

`Beneficiary` (persistencia cercana hoy: `company_employees`)

---

## Relaciones

```text
                    YourMeal OS
                          │
                    Organización
                     (Tenant)
                          │
          ┌───────────────┴───────────────┐
          │                               │
    Administrador                    Empleado
          │                               │
          └───────────────┬───────────────┘
                          │
                  Operación diaria
                          │
          ┌───────────────┴───────────────┐
          │                               │
     Consumidor                  Cuenta Empresa
   (persona particular)         (organización)
                                          │
                                          │
                                   Beneficiarios
```

---

## Reglas de lenguaje

Durante todo el proyecto utilizaremos exclusivamente estos términos.

### Correcto

- Organización
- Administrador
- Empleado
- Consumidor
- Cuenta Empresa
- Beneficiario

### Evitar (sin contexto explícito)

- Cliente
- Cliente final
- Usuario cliente
- Empresa cliente
- Cliente empresa
- Particular
- Empresa pagadora

Siempre deberá utilizarse el **nombre oficial del actor**.

### Excepción controlada

En documentos comerciales o de implantación SaaS, «cliente de YourMeal OS» significa **Organización**, y debe preferirse escribir **Organización** (o «Organización cliente», si hace falta contraste).

---

## Ejemplos

### Correcto

- El **Consumidor** realiza un pedido.
- La **Cuenta Empresa** aprueba el presupuesto.
- El **Beneficiario** modifica su menú.
- El **Administrador** configura la Organización.
- El **Empleado** prepara la producción.

### Incorrecto

- El cliente hizo un pedido.
- La empresa aceptó el presupuesto.
- El usuario cambió el menú.

Estas expresiones son ambiguas y no deben utilizarse en documentación, código, ADRs, Pull Requests ni conversaciones técnicas.

---

## Principio del dominio

Los actores representan **responsabilidades**, no identidades.

Una misma persona puede desempeñar distintos roles dependiendo del contexto.

Ejemplo:

- María es **Administradora** de EatClean.
- María es **Consumidora** de otra Organización.
- María también es **Beneficiaria** del servicio de comedor de su Cuenta Empresa.

El dominio siempre interpreta el rol que desempeña durante una operación concreta.

---

## Mapa de migración (términos antiguos)

| Antes (ambiguo / legado) | Ahora (oficial) |
|--------------------------|-----------------|
| Cliente (SaaS) | Organización |
| Cliente / Customer (pedido B2C) | Consumidor |
| Empresa cliente / Company | Cuenta Empresa |
| Empleado de empresa (`company_employees`) | Beneficiario |
| Staff / trabajador de cocina | Empleado |
| Admin de tenant | Administrador |

Renombrar identificadores de código/BD solo con ADR cuando el coste lo justifique. Hasta entonces: docs y dominio usan el término oficial; el código legado se documenta en este mapa.

---

## Declaración final

Un lenguaje consistente produce un dominio consistente.

Cada actor tiene un único significado.

Cada significado tiene una única responsabilidad.

Cuando todos hablamos el mismo lenguaje, el dominio, el código y el producto evolucionan en la misma dirección.
