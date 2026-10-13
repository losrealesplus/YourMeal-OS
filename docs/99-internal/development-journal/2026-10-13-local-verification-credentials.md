# Saneamiento local de verificadores

Se mantienen ocho verificadores existentes, sustituyendo el fallback al Llavero por configuración explícita `EATCLEAN_PRODUCTION_*` o `EATCLEAN_STAGING_*`. Se exige clave moderna, identidad de proyecto y URL coincidentes; staging rechaza el proyecto productivo. El transporte limita el destino y prohíbe redirects.

Validación exclusivamente sintética: 23 pruebas aprobadas. No se ejecutaron verificadores sobre servicios reales ni se consultaron valores de configuración privada. `.env.local`, Llavero y secrets remotos permanecen intactos; su actualización o retirada corresponde al propietario. Sin push, merge, deploy ni cambios al PR #527.
