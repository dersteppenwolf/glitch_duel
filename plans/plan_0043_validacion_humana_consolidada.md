# Exec Plan: validacion humana consolidada

## Objetivo

Concentrar en un unico plan todas las verificaciones que no pueden demostrarse con Node, mocks, inspeccion estatica o un navegador automatizado: hardware fisico, lectores de pantalla, percepcion visual/audio, rendimiento en equipos nombrados y estudios con jugadores.

Este plan no implementa gameplay. Su salida es evidencia anonima y decisiones: cerrar items ya implementados, conservarlos Partial o abrir un ExecPlan separado para una correccion reproducible.

Queda fuera del alcance:

- Agregar telemetria, backend, dependencias, build step o persistencia de resultados dentro del juego.
- Corregir hallazgos durante la misma sesion sin convertirlos antes en escenario reproducible y plan acotado.
- Activar GLITCH CANCEL en Versus/Carrera, implementar `#17/#19` o ampliar IA sin gate humano y plan posterior.
- Presentar mocks, seeds o snapshots como sustituto de usuarios, hardware o AT real.

## Contexto Actual

- Los planes `0029` a `0042` completaron su alcance automatizable. La baseline consolidada pasa `155/155` pruebas, sintaxis de todos los JS y `git diff --check`.
- GitHub Pages publico correctamente el commit `87448f3`: el run `32202168953` completo `validate` antes de `deploy` y la URL publica responde.
- Las matrices automatizadas cubren seguridad, storage, foco, bindings, pointer/gamepad mocks, fixed-step, eventos de combate, trials, IA contextual, GLITCH CANCEL, debug y audio idempotente.
- Los pendientes humanos antes dispersos en `AGENTS.md`, `BACKLOG.md` y planes `0029-0042` se transfieren a este documento. Es la unica fuente para validacion humana pendiente.
- `#77` fue aceptado como gate de implementacion por direccion explicita, pero no existen registros de seis jugadores nuevos ni cuatro recurrentes. No se considera evidencia completada.

Suposiciones:

- Cada participante usa un identificador anonimo; no se guardan nombres, audio, video, IP ni datos personales.
- Una seed reproduce RNG, no input humano. Todo defecto se reduce despues a pasos, configuracion y traza por ticks cuando sea posible.
- La validacion de AT se realiza con el lector y navegador reales; inspeccionar ARIA en DOM no equivale a escuchar el flujo.
- La validacion de rendimiento registra equipo, SO, navegador, display y DPR; no compara numeros sin ese contexto.

## Diseno Propuesto

### 1. Navegador, seguridad y teclado

En la pagina servida localmente y en GitHub Pages:

- Confirmar consola sin violaciones CSP ni recursos bloqueados.
- Inyectar markup en storage de stats desde DevTools y verificar que Game Over lo presenta como texto, sin ejecucion.
- Recorrer inicio, reinicio, pausa, ayuda, controles, onboarding y Game Over con teclado fisico.
- Verificar foco Canvas al iniciar/reanudar, orden Canvas -> Estado -> Pausa -> controles visibles, Shift+Tab inverso y salida natural sin wrap.
- Verificar Ctrl/Alt/Meta, cambio de pestana, historial, Enter/Space en controles nativos, remapeo, reset y persistencia.
- Cambiar/ocultar ventana y confirmar limpieza de input y pausa sin reanudacion automatica.

### 2. Touch, hibrido y gamepad fisicos

- Touch: movimiento/bloqueo sostenido con otro dedo atacando, combos, trials, Especial y GLITCH CANCEL.
- Probar taps cortos, pointercancel/capture loss, rotacion, safe areas y ningun input retenido.
- Hibrido: alternar teclado/touch/gamepad, comprobar guia reciente/manual y gasto unico con fuentes simultaneas.
- Gamepad standard: stick/D-pad, botones 0/1/2/3, bumpers, Start 9, Estado 8, menus y dialogos.
- Desconectar/reconectar gamepad durante combate/pausa y verificar muestra neutral sin acciones fantasma.
- Para `#73`, ejecutar cinco oportunidades de segundo input por teclado, touch y gamepad; registrar fallos percibidos por fuente.

### 3. Visual, responsive y preferencias

Viewports minimos: `1440x900`, `1366x768`, `844x390`, `667x375`, `390x844` y alturas entre 320-400 CSS px.

- Revisar menu, overlays con scroll, toolbar, Estado expandido, HUD, arena, pausa, touch y Training.
- Revisar ocho arenas y cuatro rivales en estados idle, ataque, hit, block, crouch, aire y final.
- Confirmar que nombres largos, badges, mensajes, trial y GLITCH CANCEL quedan dentro de limites.
- Probar zoom real 200%, text scaling, forced colors/Windows High Contrast y contraste pixel-real.
- Probar reduced motion manual y del sistema: informacion equivalente sin shake/pulso/cortes en movimiento.
- Confirmar orientacion portrait degradada y landscape sin solapamientos criticos.

### 4. Lectores de pantalla

Matriz minima: NVDA + Firefox/Chrome, Narrator + Edge y VoiceOver + Safari.

- Nombres de dialogos, entrada al titulo, containment, restauracion y `inert`.
- Controles ES/EN, bindings remapeados, slots, selector de trial y botones touch.
- Estado de combate no-live, consulta explicita y ausencia de speech por frame.
- Anuncios de peligro, 10s, 5s y resultado exactamente una vez por ronda/evento.
- Trials: instruccion, retry, progreso y completado; GLITCH CANCEL ready/used/coste y activacion click de AT.
- Game Over conciso, sin lectura duplicada del Canvas o contenido oculto.

### 5. Rendimiento y audio en hardware nombrado

- Registrar CPU/GPU/RAM, SO, navegador/version, display Hz, viewport y DPR raw/efectivo.
- Medir 30/60/120 Hz donde exista hardware, con debug apagado y encendido por separado.
- Ejecutar cinco muestras cuando sea practico; registrar p95 de frame work frente al presupuesto del display.
- Probar DPR raw 1/2/3 y confirmar limite efectivo 1/2/2 y backing store razonable.
- Ante RAF gaps, capturar Performance trace antes de atribuir el problema al juego.
- Ejecutar Web Audio durante 20 minutos y dejar 5 minutos en reposo; registrar grafos creados/finalizados/activos y residuos.
- Escuchar ataque, impacto, UI, Special y GLITCH CANCEL con audio disponible y silenciado; el audio nunca es informacion exclusiva.

### 6. Cohortes y decisiones de jugabilidad

Primera sesion, seis jugadores nuevos: dos teclado, dos touch y dos gamepad.

- Sin coaching: iniciar, moverse, bloquear, ejecutar combo y usar Especial.
- Gate: al menos 5/6 completan todo y ninguna fuente acumula dos fallos.
- Registrar tarea, exito, confusion y accion interpretada como perdida.

Profundidad, cuatro jugadores recurrentes/fighting-game:

- Normal y Hard en orden contrabalanceado con seed/config registradas.
- Probar libre, spam punch/kick, saltos, whiffs, bloqueo sostenido, esquinas y energia completa.
- Evaluar justicia Easy/Normal/Hard, whiff punish, bait, crouch y aire; identificar exploit reproducible.
- Los cuatro trials deben entenderse sin coaching y sin falsos positivos percibidos.

Piloto GLITCH CANCEL con cuatro recurrentes:

- 4/4 explican whiff-only, coste25, cuota una vez por secuencia y Special neutral100.
- 4/4 ejecutan Cancel y Special normal con su fuente.
- Al menos 3/4 prefieren revancha con la regla; maximo 1/4 la considera obligatoria.
- Ninguna fuente acumula dos fallos; cada participante identifica cuando ahorrar energia.
- Decision final obligatoria: `Reject`, `Retain Training-only` o `Promote to Versus`.

### 7. Salida y gates

- Un fallo tecnico se documenta con navegador/dispositivo, modo, seed, pasos y resultado esperado/real.
- Si puede automatizarse, agregar primero una regresion fallida y abrir un plan de correccion separado.
- Actualizar estados de `#32`, `#72`, `#73`, `#9`, `#24`, `#25`, `#69`, `#74`, `#75`, `#16`, `#76` y `#77` solo con evidencia correspondiente.
- `#17/#19` solo se desbloquean con escenario reproducible. GLITCH CANCEL Versus/Carrera requiere un ExecPlan nuevo tras `Promote`.

## Archivos A Modificar

- `plans/plan_0043_validacion_humana_consolidada.md`: registrar matriz, evidencia, fallos y decisiones.
- `BACKLOG.md`: actualizar estados despues de completar cada gate.
- Plan de correccion nuevo: solo si aparece un fallo reproducible que exige codigo.

No modificar `src/` ni `tests/` como parte normal de este plan.

## Plan De Implementacion

1. Congelar commit, URL publicada, navegador, hardware y configuracion.
2. Ejecutar navegador/seguridad/teclado y registrar resultados.
3. Ejecutar touch/hibrido/gamepad por fuente.
4. Ejecutar matriz visual, responsive, preferencias y contraste.
5. Ejecutar matriz AT con los tres lectores.
6. Ejecutar baseline de rendimiento/audio en hardware nombrado.
7. Ejecutar seis primeras sesiones y cuatro sesiones recurrentes.
8. Ejecutar piloto GLITCH CANCEL y tomar decision explicita.
9. Convertir cada fallo tecnico en reproduccion; no corregir por intuicion.
10. Reconciliar backlog y cerrar este plan solo cuando no queden celdas sin resultado.

## Pruebas Y Validacion

Antes de iniciar y despues de cualquier correccion separada:

```powershell
Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object {
    node --check $_.FullName
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}
node --check tests\game.test.js
node --test tests\game.test.js
git diff --check
```

Cada fila humana registra: commit, fecha, equipo/fuente, navegador, idioma, modo, seed si aplica, resultado, observacion anonima y decision.

## Documentacion

- Este plan es la unica lista de validacion humana pendiente.
- `AGENTS.md` y `Readme.md` deben enlazar aqui, no duplicar matrices.
- Los planes `0029-0042` conservan historia y evidencia automatica, pero remiten aqui cualquier residual humano.

## Riesgos Y Mitigaciones

- Riesgo: presentar automatizacion como evidencia humana. Mitigacion: separar baseline tecnica de cada fila fisica/AT/usuario.
- Riesgo: recopilar datos personales. Mitigacion: identificadores anonimos y sin grabaciones/telemetria.
- Riesgo: matriz inmanejable. Mitigacion: ejes ortogonales y muestras minimas, no producto cartesiano completo.
- Riesgo: corregir mientras se observa y contaminar cohortes. Mitigacion: congelar commit por cohorte y corregir despues en plan separado.
- Riesgo: promover GLITCH CANCEL por preferencia aislada. Mitigacion: umbrales 4/4, 3/4, max1/4 y razones para ahorrar energia.

## Validacion Del Plan Con Skill

Se cargo `karpathy-guidelines` antes de crear este plan.

- El plan no agrega producto, abstracciones ni telemetria.
- Reutiliza una matriz unica en lugar de checklists duplicados.
- Separa hechos automatizados de evidencia humana.
- Cada gate tiene resultado observable y salida acotada.
- Todo cambio de codigo requiere reproduccion y plan posterior.

## Criterios De Aceptacion

- Todas las filas de navegador, hardware, visual, AT y rendimiento tienen resultado registrado.
- Se completan seis sesiones nuevas y cuatro recurrentes sin datos personales.
- `#73`, trials, ayuda/status e IA tienen decision basada en evidencia.
- GLITCH CANCEL termina en Reject, Retain Training-only o Promote to Versus.
- Fallos tecnicos tienen reproduccion y plan separado; no quedan notas ambiguas.
- BACKLOG refleja evidencia real y los planes anteriores no mantienen checklists humanos activos paralelos.

## Commit Y Push

- Evidencia/documentacion: `Record consolidated human validation`.
- Correcciones: commits y ExecPlans separados por defecto.
- No hacer commit/push de resultados salvo solicitud explicita.

## Estado De Implementacion

Ready.

La baseline automatica esta completa. Todas las filas de este plan requieren navegador real, hardware, AT o participantes y permanecen pendientes.
