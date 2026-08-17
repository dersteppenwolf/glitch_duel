# Exec Plan: entrada por acciones, gamepad y remapeo

## Objetivo

Implementar una unica capa de entrada para teclado, controles tactiles y gamepad estandar. El jugador podra remapear de forma persistente las acciones de teclado desde un dialogo accesible y usar un mando para jugar y operar los dialogos principales.

La experiencia cambia de forma verificable:

- `Fighter` recibe acciones canonicas y deja de conocer teclas fisicas.
- Teclado, tactil y gamepad pueden mantener la misma accion sin liberaciones cruzadas.
- Los bindings de teclado usan `KeyboardEvent.code`, se validan y sobreviven a una recarga.
- Ayuda, onboarding, menu, pausa y controles tactiles muestran bindings actuales o textos neutrales.
- Un gamepad estandar mueve, ataca, bloquea, usa especial, pausa y confirma acciones de UI.
- Blur, visibility, pausa, cambios de estado y desconexion liberan fuentes sin reactivar entradas retenidas.

Queda fuera del alcance el remapeo de botones del gamepad, mappings no estandar, vibracion, perfiles multiples, macros, segundo jugador local, cambios de balance y cambios en la regla izquierda/derecha simultaneas.

## Contexto Actual

- `src/game.js` mantiene `keys` como una mezcla de teclas fisicas y nombres de acciones, registra teclado y Pointer Events, controla estados, modales y el bucle fijo.
- `src/fighter.js` traduce directamente `a/d/w/c/s/i/j/k/l` y aliases arrow a movimiento y ataques.
- `src/index.html` contiene botones tactiles nativos, ayuda con teclas hardcodeadas y overlays con foco/inert.
- `src/i18n.js` contiene resumen de controles, onboarding y resumen de pausa con teclas fijas.
- `tests/game.test.js` usa mocks de DOM/canvas/audio y carga scripts clasicos concatenados; el mock aun no modela `KeyboardEvent.code` ni `navigator.getGamepads`.
- `BACKLOG.md:57` define #4 como mejora L y pide capa de acciones, Gamepad API y mappings persistentes de teclado.

La simulacion fija y las reglas de ataques no se modificaran. La deteccion actual de flancos en `Fighter` (`prevPunchPressed`, `prevKickPressed`, `prevSpecialPressed`) se conserva para reducir riesgo.

## Diseño Propuesto

### Capa de entrada

Agregar `src/input.js` antes de `fighter.js` y `game.js`. Definira las acciones `left`, `right`, `jump`, `crouch`, `block`, `punch`, `kick`, `special` y `pause`, con almacenamiento por fuente:

```text
action -> Set(sourceId)
sourceId -> action
```

El estado canonico se obtiene con `getActionSnapshot()`. Las fuentes seran `keyboard:<code>`, `pointer:<id>` y `gamepad:<index>:<control>`. La capa tambien expondra flancos de UI/gamepad, persistencia versionada, validacion, etiquetas de bindings y limpieza total.

### Teclado y remapeo

Persistir `glitchDuelKeyboardBindings` con `version: 1` y `KeyboardEvent.code`. Defaults: flechas/A-D para movimiento, W/up para salto, C/down para agacharse, S/I para bloqueo, J/K/L para ataques y P para pausa. Escape, Tab, Backquote, modificadores y atajos del navegador quedan reservados.

El dialogo `#controls-screen` se abrira desde el menu, tendra una fila por accion remapeable, captura de una tecla, reset, feedback `aria-live`, conflicto/reservada y scroll interno. La politica de modal y foco permanece en `game.js`.

### Gamepad

Consultar `navigator.getGamepads()` una vez por frame antes de la simulacion. Usar mapping estandar: stick/D-pad para movimiento, A/B/X/Y para salto/patada/golpe/especial, bumpers para bloqueo y Start para pausa. Los ejes tendran deadzone con histeresis. Los flancos de Start/confirm/cancel se procesaran una sola vez. Desconexion, blur y visibility limpiaran fuentes y exigiran neutralizacion antes de rearmar entradas retenidas.

### Compatibilidad

`game.js` conservara estados, modales, ciclo de vida y politica de Escape. `Fighter` consumira solo el snapshot de acciones. Los combos, prioridad de bloqueo/agacharse, hitboxes, timer y coordenadas logicas `1000x500` permaneceran iguales.

## Archivos A Modificar

- `src/input.js`: capa canonica, persistencia, teclado, gamepad, ejes y fuentes.
- `src/index.html`: cargar `input.js`, agregar boton/dialogo de controles y placeholders de bindings.
- `src/styles.css`: filas de remapeo, estados de captura/conflicto y responsive del dialogo.
- `src/fighter.js`: consumir acciones canonicas y usar hint de combo neutral.
- `src/game.js`: conectar input, pointer sources, polling, focus/modal, routing de UI y render dinamico.
- `src/i18n.js`: textos de acciones, remapeo, gamepad y mensajes dinamicos.
- `tests/game.test.js`: ampliar mocks y cubrir acciones, persistencia, remapeo, gamepad, lifecycle y contrato HTML.
- `Readme.md`: controles, remapeo, gamepad, persistencia, limitaciones y smoke tests.
- `AGENTS.md`: checklist manual de bindings, gamepad, desconexion y modales.
- `BACKLOG.md`: marcar #4 completado solo tras pasar todas las fases.
- `plans/plan_0037_entrada_acciones_gamepad_remapeo.md`: registrar estado, pruebas y riesgos residuales.

## Plan De Implementacion

1. Crear `src/input.js` con acciones, defaults, validacion/persistencia, agregacion por fuente y snapshots. Verificar defaults y datos invalidos de `localStorage` sin DOM.
2. Migrar `Fighter` y el bucle de `game.js` a acciones canonicas; conectar botones tactiles por `pointer:<id>`. Verificar que teclado y tactil conservan combate, multitouch y liberacion por fuente.
3. Agregar dialogo de remapeo y render dinamico de bindings en ayuda, onboarding, menu, pausa y touch labels. Verificar captura, conflicto, teclas reservadas, reset, foco e i18n.
4. Integrar polling de gamepad estandar, ejes con histeresis, flancos de pausa/UI, desconexion y neutralizacion despues de lifecycle. Verificar combate y navegacion de overlays.
5. Ampliar mocks y pruebas; actualizar documentacion y contratos estaticos. Verificar que no quedan referencias fisicas en `fighter.js` ni textos activos obsoletos.
6. Ejecutar sintaxis, suite, `git diff --check` y smoke browser en desktop, mobile vertical/horizontal, ayuda, controles, pausa, game over y una partida con gamepad simulado.

## Pruebas Y Validacion

```powershell
Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object {
    node --check $_.FullName
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
node --test tests\game.test.js
git diff --check
```

La suite debe cubrir: acciones canonicas, dos fuentes para una accion, pointer cancellation, `KeyboardEvent.code`, persistencia valida/invalida, reset/conflictos/reservadas, ausencia de Gamepad API, mapping estandar, deadzone/histeresis, Start sin repeticion, desconexion, neutralizacion despues de blur/visibility y routing de confirm/cancel por modal.

Smoke manual: remapear golpe y pausa, recargar, confirmar textos dinamicos, jugar con teclado/tactil, conectar/desconectar un mando estandar, pausar/reanudar, operar menu/ayuda/pausa/game-over y confirmar que las acciones retenidas no reaparecen al volver al foco.

## Documentacion

- `Readme.md` documentara defaults, remapeo fisico por `KeyboardEvent.code`, mapping estandar, limitacion de audio user-activation y clave de almacenamiento.
- `AGENTS.md` agregara los escenarios manuales de input y gamepad al checklist durable.
- `BACKLOG.md` movera #4 a Completed solo cuando keyboard, tactil, gamepad, UI y lifecycle esten cubiertos.
- `PLANS.md` no cambia.

## Riesgos Y Mitigaciones

- Riesgo: una fuente libera una accion mantenida por otra. Mitigacion: conjuntos por `sourceId` y pruebas cruzadas teclado/pointer/gamepad.
- Riesgo: Start alterna pausa por polling. Mitigacion: flancos ascendentes y neutralizacion despues de transiciones.
- Riesgo: un mapping invalido deja al jugador sin control. Mitigacion: schema versionado, defaults por accion, reset visible y no aceptar conflictos.
- Riesgo: captura de remapeo dispara pausa o combate. Mitigacion: modo de captura con prioridad y consumo completo del evento.
- Riesgo: gamepad retenido vuelve a activarse despues de blur. Mitigacion: baseline neutral y bloqueo hasta release.
- Riesgo: textos muestran J/K/L despues del remapeo. Mitigacion: render centralizado de bindings y hints neutrales en combate.
- Riesgo: se altera el combate al migrar. Mitigacion: conservar edge detection, precedencias, snapshot por frame y pruebas existentes adaptadas.
- Riesgo: crecimiento excesivo de `game.js`. Mitigacion: aislar mecanismo de dispositivos y mappings en `src/input.js`.

## Validacion Del Plan Con Skill

Se cargo y aplico `karpathy-guidelines` antes de ejecutar el plan.

- El alcance se limita al requisito #4 y excluye extensiones no necesarias.
- La agregacion por fuentes resuelve el defecto estructural sin duplicar estados por dispositivo.
- Las decisiones de `KeyboardEvent.code`, teclas reservadas, neutralizacion y mapping estandar son explicitas.
- Cada fase tiene una verificacion automatizable y la suite existente protege combate.
- No se agregan dependencias ni build step.

## Criterios De Aceptacion

- `Fighter` no contiene aliases de teclas fisicas y combate usa acciones canonicas.
- Teclado, tactil y gamepad pueden compartir y liberar acciones sin clobbering.
- Bindings validos persisten; JSON invalido, conflicto y tecla reservada tienen fallback/feedback seguro.
- El dialogo de controles es accesible, enfocable, traducible y scrollable en movil.
- Menu, ayuda, onboarding, pausa y touch labels no quedan con bindings obsoletos.
- Gamepad estandar funciona en combate y permite confirm/cancel en los modales definidos.
- Blur, visibility, pausa y desconexion no dejan entradas atascadas ni ataques fantasma.
- No cambian reglas de combate, IA, timer, hitboxes, balance ni coordenadas `1000x500`.
- `node --check`, `node --test` y `git diff --check` pasan.
- README, AGENTS, BACKLOG y este plan reflejan exactamente el resultado.

## Commit Y Push

- No hacer commit ni push salvo solicitud expresa del usuario.
- Si se solicita, preferir un commit funcional completo despues de la validacion final; no mezclar cambios ajenos.

## Estado De Implementacion

Completado.

- `src/input.js` agrega acciones canonicas, agregacion por fuente, persistencia versionada de `KeyboardEvent.code`, captura validada, polling Gamepad API estandar, deadzone con histeresis y neutralizacion despues de lifecycle.
- `src/game.js` migra teclado/pointer, conecta remapeo, controles dinamicos y navegacion confirm/cancel de modales; `src/fighter.js` consume acciones sin aliases fisicos.
- `src/index.html`, `src/styles.css` y `src/i18n.js` agregan el dialogo responsive y textos dinamicos en espanol/ingles.
- `tests/game.test.js` cubre la migracion y eleva la suite de 87 a 93 pruebas.
- Validacion ejecutada: `node --check` de todo `src/*.js`, `node --test tests\\game.test.js` (93/93), `git diff --check` y smoke browser de menu, controles, ayuda, inicio y pausa en viewport movil.
- Riesgo residual: no se probo un mando fisico en el navegador; el mapping estandar y los ciclos de desconexion/neutralizacion estan cubiertos con mocks.
