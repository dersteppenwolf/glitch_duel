# Exec Plan: Optimizacion de AGENTS.md

## Estado

Completado. La validacion de sintaxis y las 163 pruebas unitarias finalizaron correctamente.

## Objetivo

Convertir `AGENTS.md` en un contrato operativo mas preciso: responsabilidades por archivo, comandos ejecutables, validacion por tipo de cambio, invariantes agrupadas, fuentes de verdad y reglas de revision. Corregir en `PLANS.md` las referencias arquitectonicas y los comandos de validacion obsoletos. No cambiar juego, pruebas ni CI.

## Contexto Actual

`AGENTS.md` contiene buenas restricciones, pero mezcla arquitectura durable con detalles funcionales y expresa la validacion de sintaxis sin un comando completo. `PLANS.md` asigna IA y render a `src/fighter.js` y sus plantillas solo comprueban cinco de los once archivos JavaScript, mientras CI comprueba todos.

## Diseño Propuesto

- Mantener un solo `AGENTS.md` en la raiz.
- Organizar instrucciones por contrato, rutas de codigo, ejecucion, validacion, invariantes, fuentes de verdad, revision y planes.
- Conservar todas las restricciones de simulacion, entrada, accesibilidad, entrenamiento, UI, IA, audio y diagnostico que evitan regresiones.
- Usar el mismo bucle PowerShell de validacion completa documentado en `Readme.md`.
- Actualizar solo las secciones obsoletas de `PLANS.md`.

## Archivos A Modificar

- `AGENTS.md`: reorganizar y precisar las instrucciones del repositorio.
- `PLANS.md`: actualizar responsabilidades y validacion completa.
- `plans/plan_0047_optimizacion_agents.md`: registrar y mantener este plan.

## Plan De Implementacion

1. Reestructurar `AGENTS.md` sin eliminar invariantes de comportamiento.
2. Sustituir comandos ambiguos por la validacion PowerShell completa y declarar Node.js 24.
3. Actualizar en `PLANS.md` el mapa de archivos y sus tres bloques de validacion.
4. Revisar el diff para detectar sobrealcance, inconsistencias y rutas inexistentes.
5. Ejecutar la validacion automatica completa.

## Pruebas Y Validacion

```powershell
Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object {
    node --check $_.FullName
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
node --test tests\game.test.js
```

Validacion documental:

- Confirmar que cada ruta y simbolo citado existe.
- Confirmar que `PLANS.md` ya no atribuye IA o render completo a `fighter.js`.
- Confirmar que los tres ejemplos de validacion recorren todos los archivos `src/*.js`.

## Documentacion

- `AGENTS.md`: resultado principal.
- `PLANS.md`: alineacion de arquitectura y validacion.
- `Readme.md`: sin cambios; sus comandos y arquitectura ya son correctos.

## Riesgos Y Mitigaciones

- Riesgo: perder una invariante al reorganizar. Mitigacion: contrastar cada nota original con la version nueva.
- Riesgo: aumentar instrucciones sin mejorar su utilidad. Mitigacion: cada seccion debe resolver una decision operativa concreta.
- Riesgo: duplicar fuentes de verdad. Mitigacion: declarar explicitamente la autoridad de README, CI, PLANS, evidencia humana y codigo/pruebas.

## Validacion Del Plan Con Skill

- Se cargo `karpathy-guidelines` antes de finalizar el plan.
- El cambio queda limitado a tres archivos documentales y no introduce abstracciones, dependencias ni cambios de producto.
- Los criterios son observables mediante diff, busqueda de rutas y validacion automatica.

## Criterios De Aceptacion

- `AGENTS.md` contiene comandos completos y una matriz de validacion.
- Las invariantes originales siguen representadas y estan agrupadas por dominio.
- `PLANS.md` refleja los archivos actuales y valida los once JavaScript.
- La validacion automatica termina correctamente.
- No cambia ningun archivo de producto o prueba.

## Commit Y Push

- Commit sugerido: `docs: optimize repository agent guidance`
- Push: solicitado; publicar el commit en la rama `main` del remoto `origin`.
