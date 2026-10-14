# Saneamiento local de verificadores

Se mantienen ocho verificadores existentes, sustituyendo el fallback al Llavero por configuración explícita `EATCLEAN_PRODUCTION_*` o `EATCLEAN_STAGING_*`. Se exige clave moderna, identidad de proyecto y URL coincidentes; staging rechaza el proyecto productivo. El transporte limita el destino y prohíbe redirects.

Validación exclusivamente sintética: 23 pruebas aprobadas. No se ejecutaron verificadores sobre servicios reales ni se consultaron valores de configuración privada. `.env.local`, Llavero y secrets remotos permanecen intactos; su actualización o retirada corresponde al propietario. Sin push, merge, deploy ni cambios al PR #527.

## 2026-10-14 · Cierre del PR #528

Se migran los cuatro consumidores pendientes, sin dotenv ni fallbacks legacy. Se exige entorno explícito y confirmación de escritura productiva vinculada al script/proyecto; bootstrap live utiliza transporte de solo lectura y CI no infiere live de las credenciales. 30 pruebas sintéticas PASS. No se ejecutaron operaciones reales.
