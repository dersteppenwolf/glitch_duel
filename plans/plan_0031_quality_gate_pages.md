# Exec Plan: quality gate para Pages

## Objetivo

Implementar el item `#67 Pages validation quality gate` del backlog para que toda pull request ejecute la comprobacion de sintaxis y las pruebas unitarias, y para que GitHub Pages solo publique `src/` cuando esa validacion haya terminado correctamente.

La experiencia del jugador no cambia directamente. La mejora reduce el riesgo de publicar JavaScript con errores o regresiones cubiertas por pruebas. Quedan fuera del alcance agregar bundler, `package.json`, dependencias de aplicacion, linting, cobertura, pruebas visuales, branch protection automatica o cambiar el hosting de GitHub Pages.

## Contexto Actual

- `.github/workflows/pages.yml` se ejecuta en push a `main` o manualmente y contiene un unico job `deploy` que publica `src/` sin ejecutar `node --check` ni `node --test`.
- El workflow concede `contents: read`, `pages: write` e `id-token: write` a nivel global, por lo que hoy todos los jobs futuros heredarian permisos de publicacion.
- La concurrencia `pages` tambien esta a nivel global. Si se agrega `pull_request` sin moverla, una validacion de PR podria cancelar una ejecucion de despliegue no relacionada.
- Las Actions de checkout, configuracion, artefacto y despliegue ya estan fijadas a SHAs completos con comentarios de version.
- El proyecto no requiere instalacion: las pruebas usan `node:test` y los scripts se validan directamente con `node --check`.
- `Readme.md` documenta comandos individuales, pero omite actualmente `src/arena_render.js` y `src/hud_render.js`. Tambien describe el despliegue como una publicacion directa sin mencionar el gate.
- `AGENTS.md` indica los comandos correctos de forma general, pero no registra que Pages deba depender de validacion ni que las pull requests ejecuten el mismo gate.

Suposiciones:

- Se usara Node.js 24 como baseline explicito de CI, alineado con una version LTS moderna y con la validacion local reciente. Si el repositorio decide soportar otra version antes de ejecutar el plan, debe cambiarse aqui y en la documentacion de forma consciente.
- Se mantendra un solo archivo de workflow. Separar validacion y despliegue en workflows diferentes complicaria la dependencia obligatoria entre ambos sin aportar valor a este proyecto pequeno.
- El evento de PR sera `pull_request`, no `pull_request_target`, para que codigo no confiable nunca se ejecute con permisos del repositorio base.
- Hacer obligatorio el check para fusionar mediante branch protection es una configuracion de GitHub fuera del repositorio; se documentara como recomendacion manual, no como requisito para completar el codigo.

## Diseño Propuesto

Actualizar `.github/workflows/pages.yml` para contener dos jobs.

### Job `validate`

- Ejecutar en `ubuntu-latest` para `pull_request`, push a `main` y `workflow_dispatch`.
- Mantener solo `contents: read` a nivel de workflow.
- Hacer checkout con la Action oficial ya fijada a SHA.
- Agregar `actions/setup-node` fijada a un SHA completo verificado de su release oficial, con comentario de version, y configurar Node.js 24 sin cache porque no existen manifiestos de dependencias.
- Mostrar `node --version` para que el runtime quede visible en logs.
- Comprobar todos los archivos `src/*.js` mediante un bucle shell que termine al primer `node --check` fallido.
- Ejecutar `node --test tests/game.test.js` sin `npm install`.

### Job `deploy`

- Declarar `needs: validate` para impedir upload/deploy si sintaxis o pruebas fallan.
- Declarar `if: github.event_name != 'pull_request'` para que una PR solo valide y nunca publique.
- Mover `pages: write` e `id-token: write` a `permissions` del job; conservar `contents: read` global.
- Mover `concurrency` con grupo `pages` al job `deploy`, evitando que ejecuciones de PR interfieran con despliegues y conservando la cancelacion de publicaciones antiguas.
- Mantener environment, checkout, configuracion de Pages, upload de `src/` y deploy sin cambios funcionales.

### Documentacion y backlog

- Actualizar `Readme.md` para explicar que PRs y pushes ejecutan validacion, que `deploy` depende de ella y que los permisos de escritura pertenecen solo al job de publicacion.
- Sustituir la lista incompleta de sintaxis por un comando PowerShell que recorra todos los `src/*.js`, seguido del comando de pruebas.
- Actualizar `AGENTS.md` para que futuras sesiones preserven el quality gate y sepan que no se requiere instalacion en CI.
- Al completar la implementacion, mover `#67` a completados en `BACKLOG.md`, eliminarlo de la secuencia activa y dejar `#62 Frame-rate-independent combat simulation` como siguiente mejora recomendada.

## Archivos A Modificar

- `.github/workflows/pages.yml`: agregar trigger de PR, job `validate`, dependencia de despliegue, permisos y concurrencia por job.
- `Readme.md`: documentar CI, permisos y comandos completos de validacion.
- `AGENTS.md`: registrar que Pages solo despliega despues del gate y que PRs ejecutan pruebas/sintaxis.
- `BACKLOG.md`: marcar `#67` completado y promover `#62` al primer lugar de ejecucion.
- `plans/plan_0031_quality_gate_pages.md`: mantener el estado y resultados al ejecutar el plan.

## Plan De Implementacion

1. Agregar `pull_request` a los eventos de `.github/workflows/pages.yml` y reducir permisos globales a `contents: read`.
   Verificar: el workflow no usa `pull_request_target` y ninguna validacion recibe permisos de Pages u OIDC.

2. Resolver desde el repositorio oficial el SHA completo de `actions/setup-node` para la release elegida y agregar el job `validate` con Node.js 24, sintaxis de todos los `src/*.js` y `node --test tests/game.test.js`.
   Verificar: no hay `npm install`, cache de paquetes ni referencias `uses:` mediante tags movibles.

3. Hacer que `deploy` dependa de `validate`, se omita en PR y reciba sus permisos `pages: write`/`id-token: write` a nivel de job.
   Verificar: si `validate` falla, GitHub no puede iniciar configure/upload/deploy; en PR el job aparece como omitido.

4. Mover `concurrency: { group: pages, cancel-in-progress: true }` al job `deploy`.
   Verificar: validaciones de ramas o PRs no comparten el bloqueo de despliegue, mientras publicaciones antiguas de Pages siguen cancelandose.

5. Actualizar `Readme.md` y `AGENTS.md` con el flujo CI y un comando que compruebe todos los scripts actuales y futuros en `src/`.
   Verificar: la documentacion incluye `arena_render.js` y `hud_render.js` de forma automatica, no mediante una lista manual incompleta.

6. Actualizar `BACKLOG.md`: mover `#67` a completados, quitarlo de dependencias satisfechas y de la secuencia activa, y promover `#62` como siguiente recomendacion.
   Verificar: no quedan items activos bloqueados por `#67` una vez completado; sus otros prerequisitos se conservan.

7. Ejecutar la validacion local completa, revisar el diff YAML y publicar en una rama/PR o `main` segun instruccion del usuario.
   Verificar en GitHub: el job `validate` queda verde; en push a `main`, `deploy` comienza despues; en PR, `deploy` queda omitido y no solicita permisos de publicacion.

## Pruebas Y Validacion

Validacion local de codigo:

```powershell
Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object {
    node --check $_.FullName
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
node --test tests\game.test.js
git diff --check
```

Inspeccion local del workflow:

- Confirmar que todas las lineas `uses:` estan fijadas a 40 caracteres hexadecimales y conservan comentario de version.
- Confirmar que `permissions` global solo incluye `contents: read`.
- Confirmar que `pages: write`, `id-token: write`, `environment` y `concurrency: pages` aparecen solo en `deploy`.
- Confirmar que `deploy` declara tanto `needs: validate` como la condicion que excluye pull requests.
- Confirmar que el shell de CI expande `src/*.js` y falla si cualquier `node --check` devuelve error.

Toda validacion humana pendiente de este alcance se centraliza en plans/plan_0043_validacion_humana_consolidada.md.

## Documentacion

- `Readme.md`: documentar triggers, gate, permisos por job, baseline de Node y comando completo de validacion.
- `AGENTS.md`: preservar el workflow no-build con validacion obligatoria antes de deploy.
- `BACKLOG.md`: marcar `#67` completado y actualizar el orden recomendado/dependencias.
- `PLANS.md`: no requiere cambios.

## Riesgos Y Mitigaciones

- Riesgo: una PR reciba permisos de publicacion. Mitigacion: usar `pull_request`, permisos globales `contents: read`, permisos Pages solo en `deploy` y condicion que omite ese job en PR.
- Riesgo: la concurrencia de una PR cancele un despliegue. Mitigacion: aplicar el grupo `pages` solo al job `deploy`.
- Riesgo: fijar una version de Node distinta del entorno real o cambiarla accidentalmente. Mitigacion: declarar Node.js 24 explicitamente con `setup-node`, mostrar la version en logs y documentar el baseline.
- Riesgo: agregar una referencia mutable de Action al introducir `setup-node`. Mitigacion: resolver el SHA desde releases oficiales y conservar version legible en comentario.
- Riesgo: el glob de sintaxis no incluya scripts futuros por diferencias de shell. Mitigacion: usar Bash en `ubuntu-latest`, verificar que `src/*.js` encuentra los scripts actuales y mantener el comando local equivalente en PowerShell.
- Riesgo: YAML invalido solo se detecte tras push. Mitigacion: revisar diff/estructura localmente y usar la primera ejecucion remota como criterio obligatorio antes de marcar el plan completamente validado; no agregar una dependencia solo para parsear un workflow pequeno.
- Riesgo: branch protection no exija el check aunque el workflow lo ejecute. Mitigacion: documentar la configuracion manual opcional de `validate` como required status check.

## Validacion Del Plan Con Skill

Se cargo `karpathy-guidelines` antes de finalizar este plan.

- El alcance es quirurgico: un workflow existente, documentacion operativa, estado del backlog y este plan.
- Se mantiene el proyecto sin dependencias de aplicacion, build step, bundler o instalacion de paquetes.
- Se evita crear dos workflows, scripts auxiliares o una abstraccion CI innecesaria.
- Las suposiciones sobre Node, eventos de PR, permisos y branch protection estan explicitadas.
- Cada paso tiene criterios observables localmente o en GitHub Actions, incluida la prueba negativa que debe bloquear deploy.

## Criterios De Aceptacion

- Toda pull request ejecuta syntax check de todos los `src/*.js` y `node --test tests/game.test.js`.
- Push a `main` y ejecucion manual ejecutan el mismo job `validate` antes de desplegar.
- Un fallo de sintaxis o pruebas impide configure, upload y deploy de Pages.
- Las pull requests nunca ejecutan `deploy` ni reciben `pages: write` o `id-token: write`.
- La concurrencia `pages` solo gobierna publicaciones, no validaciones de PR.
- Todas las Actions estan fijadas a SHAs completos revisados.
- README y AGENTS describen el gate y los comandos reales sin omitir scripts.
- `#67` queda completado en el backlog y `#62` pasa a ser la siguiente mejora recomendada.
- La validacion local pasa y una ejecucion remota confirma el orden `validate -> deploy`.

## Commit Y Push

- Commit sugerido: `Add Pages validation gate`.
- Ejecutar validacion local antes del commit y confirmar la ejecucion de Actions despues del push.
- No hacer push salvo que el usuario lo solicite.

## Estado De Implementacion

Implementado localmente el 2026-07-23.

- Completado: `.github/workflows/pages.yml` ejecuta `validate` en pull requests, pushes a `main` y ejecuciones manuales con Node.js 24.
- Completado: el gate comprueba todos los `src/*.js` y ejecuta `node --test tests/game.test.js` sin instalar paquetes.
- Completado: `deploy` depende de `validate`, se omite en pull requests y concentra permisos Pages/OIDC, environment y concurrencia de publicacion.
- Completado: `actions/setup-node` v4.4.0 esta fijada al SHA oficial `49933ea5288caeca8642d1e84afbd3f7d6820020`; las demas Actions conservan sus SHAs revisados.
- Completado: `Readme.md` y `AGENTS.md` documentan el gate, Node.js 24, los permisos por job y el comando que recorre todos los scripts.
- Completado: `BACKLOG.md` marca `#67` completado, elimina sus dependencias satisfechas y promueve `#62` como siguiente mejora.

Validacion local ejecutada:

- `node --check` para todos los archivos `src\*.js`: correcto.
- `node --test tests\game.test.js`: 70 pruebas superadas.
- `git diff --check`: correcto.
- Inspeccion estatica: no hay `pull_request_target`, `npm install`, cache de paquetes ni referencias `uses:` mediante tags movibles.
- Inspeccion de permisos: globalmente solo `contents: read`; `pages: write`, `id-token: write` y concurrencia `pages` aparecen solo en `deploy`.

Plan cerrado.

- El run remoto `32202168953` confirma `validate -> deploy` exitoso en `main`.
- La suite consolidada verifica de forma permanente los triggers `pull_request`/`push`, `deploy.needs: validate`, la omision de deploy en PR, el comando de tests y los SHA fijados.
- La dependencia declarativa impide iniciar deploy cuando validate falla; no se crea una rama remota defectuosa solo para repetir ese contrato.
