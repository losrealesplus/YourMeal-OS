# INCIDENTS — Errores de operación

## Propósito

Registrar errores **reales de operación**.

No son bugs del software (salvo que el software ya esté en uso y falle: entonces también ticket técnico, aparte).

Aquí: fallos del proceso humano / coordinación / información.

## Alcance

Pedidos incompletos, entregas equivocadas, cobros mal hechos, producción descuadrada, etc.

## Estructura

```text
INC-XXX

Fecha:
Empresa:
Área:

Qué ocurrió:
Causa observada:     (hechos; no culpar personas)
Consecuencia:
Tiempo / coste aproximado:
OF / WA relacionados:
Estado: Abierto | Cerrado | Patrón
```

## Reglas

- Sin soluciones en este archivo.  
- Si el mismo incidente se repite → [VALIDATED_PATTERNS.md](./VALIDATED_PATTERNS.md).

## Criterios de actualización

Tras cada incidencia relevante conocida (observada o reportada con hechos).

## Ejemplo

```text
INC-001

Fecha: 2026-07-21
Empresa: EatClean (ejemplo de plantilla)
Área: Packaging / salida

Qué ocurrió:
Pedido enviado sin postre.

Causa observada:
La bolsa fue cerrada antes de terminar el packaging.

Consecuencia:
Cliente incompleto / reclamación / reproceso.

Tiempo / coste aproximado: — (medir en campo)

Estado: Ejemplo — validar / sustituir con casos reales
```
