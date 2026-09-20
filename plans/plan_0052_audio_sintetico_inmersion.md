# plan_0052_audio_sintetico_inmersion - completar audio sintetico y evaluar sprites

**Fecha:** 2026-09-20
**Ambito:** Web Audio, eventos de combate, activacion de audio, pruebas y documentacion
**Estado:** borrador

Este ExecPlan se mantiene conforme a `PLANS.md`.

## Proposito y alcance

Mejorar la claridad e inmersion sonora de GLITCH DUEL sin reemplazar el motor existente ni introducir dependencias. El alcance recomendado conserva `src/audio.js`, agrega una senal sintetica cuando P1 completa el medidor de energia mediante combate y asegura que las acciones de combate por teclado o botones accesibles intenten desbloquear Web Audio dentro del gesto confiable.

La propuesta de audio sprites se conserva solo como decision condicionada para un ExecPlan futuro. Se reconsiderara si una prueba de escucha identifica efectos concretos que la sintesis actual no pueda producir con calidad suficiente y existe un asset aprobado. Un sprite no se incorpora para reducir peticiones, latencia o memoria porque el juego actual no descarga ningun archivo de audio.

Resultado observable del MVP:

- Ataques, impactos, bloqueos, Especial y GLITCH CANCEL conservan sus perfiles actuales y no duplican sonidos.
- P1 recibe una senal corta y distinta cada vez que su energia cruza de menos de 100 a 100 por `hit`, `block` o `damage`; comunica medidor lleno, no disponibilidad inmediata del ataque.
- Cada accion valida y no repetida de combate por teclado, pointer o activacion nativa del boton intenta crear/reanudar el contexto durante el gesto del usuario.
- Audio deshabilitado, silenciado, suspendido o no soportado nunca bloquea ni modifica el combate.
- Los grafos siguen acotados a 24 y todos sus nodos se desconectan de forma idempotente.

Queda fuera del MVP:

- Crear `src/audio/SoundManager.js`, convertir el archivo actual a una clase o dividir scripts.
- Disparos, dash, teleport, parry, bloqueo perfecto u otras mecanicas inexistentes.
- Musica, voz, ambiente, pasos, aterrizajes, audio espacial o el item `#40` del backlog.
- AudioWorklet, workers, librerias, backend o build step.
- Variacion aleatoria de pitch, gain o duracion.
- Nuevos controles, canales, claves de almacenamiento o cambios de volumen por defecto.
- Afirmar latencia cero, ejecucion JavaScript en un subproceso, compatibilidad total o impacto nulo en FPS.
- Usar mocks como evidencia de calidad sonora, clipping real, autoplay, altavoces, auriculares o dispositivos.

## Progreso

- [x] 2026-09-20: revisados motor, disparadores, controles, pruebas, CSP, backlog y planes de audio previos.
- [x] 2026-09-20: contrastadas las afirmaciones y mecanicas de la propuesta con el runtime actual.
- [x] 2026-09-20: definido el MVP sintetico y el gate independiente para audio sprites.
- [ ] Autorizar y ejecutar el MVP sintetico.
- [ ] Completar validacion automatica y checklist real de escucha/navegador.
- [ ] Decidir con evidencia si se descartan sprites o se redacta un ExecPlan separado.

## Contexto actual

`src/audio.js` ya es el administrador central de audio del juego. Mantiene un unico `AudioContext`, perfiles sinteticos de ataques, impactos y UI, dos volumenes persistentes, un limite global de 24 grafos y diagnosticos de creacion, finalizacion y desconexion. `playTone()` programa envolventes y frecuencia con `audioCtx.currentTime`; cada oscilador y gain se desconectan una sola vez desde `onended`.

`Fighter.attack()` llama `playAttackSound()` cuando un ataque valido comienza. `Fighter.takeHit()` llama `playImpactSound()` para contacto o bloqueo. Los combos reutilizan la misma ruta y GLITCH CANCEL tiene un cue sintetico propio. Por tanto, golpe ligero, golpe pesado, bloqueos y efectos glitch ya existen con perfiles distintos; no hace falta crear un segundo motor.

La energia completa ya tiene un borde exacto en `Fighter.gainEnergy()`: cuando el valor anterior es menor que 100, el nuevo alcanza 100 y la fuente es `hit`, `block` o `damage`, se publica `energyReady`. El Canvas y el estado accesible tambien muestran el medidor. Falta solamente una senal sonora especifica y debe limitarse a P1 para no confundir energia rival con medidor propio. Alcanzar 100 no implica que el Especial pueda ejecutarse en ese tick: cooldown, postura, combo, hit-stun o cierre del round pueden impedirlo.

La inicializacion es lazy y tolera ausencia de `AudioContext`. Pointer de controles tactiles llama `initAudio()` directamente, mientras el ataque por teclado suele producir sonido en un paso fijo posterior. Los botones activados con Enter/Space o click asistido tampoco llaman explicitamente `initAudio()` en su handler local. El navegador puede conservar activacion transitoria hasta el siguiente paso o no hacerlo; el MVP mueve solo el intento de desbloqueo al gesto valido y mantiene reproduccion best-effort.

No existen assets de audio, `fetch`, `decodeAudioData`, `AudioBufferSourceNode` ni precarga. La CSP de `src/index.html` declara `connect-src 'none'`, y el proyecto admite abrir `src/index.html` directamente. Un sprite cargado con `fetch()` agregaria red/lectura, decodificacion asincrona, memoria PCM, manejo de primer sonido y un fallback para `file:`.

La documentacion afirma que el overlay debug muestra lifecycle de Web Audio, pero los contadores solo estan disponibles mediante `getAudioDiagnostics()` y no se dibujan en el overlay. Si se toca README en el MVP, se corregira esa frase; mostrar nuevos datos en Canvas queda fuera de alcance.

### Matriz real de la propuesta

| Elemento propuesto | Estado actual | Decision |
| --- | --- | --- |
| Sintetizador Web Audio | Implementado en `src/audio.js` | Extenderlo; no reemplazarlo |
| Golpe ligero | `punch` y `airPunch` tienen perfiles y capas propias | Conservar |
| Golpe pesado | `kick`, combos, back kick y Especial tienen perfiles mas graves/intensos | Conservar; no agregar ruido sin escucha comparativa |
| Glitch dash/teleport | No existe esa accion | No implementar; GLITCH CANCEL conserva su cue actual |
| Parry/bloqueo perfecto | Solo existe bloqueo con chip damage | Conservar sonido de bloqueo; no inventar parry |
| Overdrive listo | El equivalente real es medidor completo, no readiness inmediato | Agregar cue sintetico player-only en el cruce combatiente a 100 |
| Audio sprite | No hay muestras ni multiples peticiones que consolidar | Fuera del MVP; otro ExecPlan si existe necesidad sonora y asset aprobado |
| Variacion aleatoria de 5% | No existe y puede acoplar RNG/estado de mute | Excluir del MVP |

### Correccion de afirmaciones

- Web Audio ofrece programacion con reloj de audio y baja latencia, no latencia cero. Buffer del navegador, sistema operativo y hardware siguen participando.
- La creacion de nodos y llamadas de JavaScript se ejecutan en el hilo principal. El navegador renderiza el grafo internamente; una clase no crea un subproceso.
- Un sprite reduce peticiones frente a muchos samples, pero el juego actual tiene cero peticiones de audio. El buffer decodificado ocupa aproximadamente `duracion * sampleRate * canales * 4` bytes aunque el OGG comprimido pese menos.
- Construir `AudioContext` en el constructor al cargar la pagina viola la inicializacion lazy y puede ser bloqueado por autoplay.
- `resume()` es asincrono. Llamarlo no garantiza que el sonido ya sea audible.
- El ejemplo propuesto no carga ni decodifica `audioBuffer`, no inicializa `sprites`, omite volumen/mix headroom/limite de voces y no desconecta grafos.

## Diseno y plan de trabajo

### Hito 0. Baseline y contrato sonoro

Antes de codigo, registrar el estado del arbol y ejecutar la suite completa. Congelar esta taxonomia:

- Inicio de ataque: sonido incluso si luego falla.
- Impacto: capa adicional solo cuando hay contacto.
- Bloqueo: perfil comun de bloqueo con chip damage.
- GLITCH CANCEL: cue actual solo al cancel exitoso.
- Medidor lleno: nuevo cue solo para P1 y solo al cruzar `< 100 -> 100` por `hit`, `block` o `damage`. Se acepta que un KO pueda coincidir con el cue porque refleja el mismo evento existente; no se presenta como confirmacion de accion disponible.
- UI: permanece centrada conceptualmente y en canal `ui`.

Caracterizar antes de implementar que recargas que ya parten en 100, fuentes no combatientes y energia de CPU no deben crear el cue de medidor de P1. Incluir hit y chip damage letales para congelar que conservan el evento/cue de medidor lleno aunque el round termine. No cambiar el schema de `energyReady` ni agregar otro evento si la condicion puede reutilizarse en `gainEnergy()`.

Salida verificable: pruebas inicialmente fallidas para cue player-only, una sola emision por cruce y desbloqueo por teclado/boton. Pointerdown ya inicializa audio y se agrega como caracterizacion de regresion que pasa antes del cambio.

### Hito 1. MVP sintetico dentro de `audio.js`

Agregar `playEnergyFullSound()` usando `playTone()` y el canal `combat`. Perfil inicial acotado:

- Capa principal triangle: 520 Hz a 880 Hz, gain 0.08, 110 ms.
- Confirmacion square: 1040 Hz a 1320 Hz, gain 0.035, 90 ms, retraso de 40 ms.

La combinacion usa como maximo dos grafos, respeta volumen, `AUDIO_CONFIG.mixGain`, floor exponencial, reloj de audio y limite global. No introducir un sistema generico de presets adicional: dos llamadas locales son coherentes con `playGlitchCancelSound()`.

En `Fighter.gainEnergy()`, dentro de la condicion existente de cruce, invocar el cue solo cuando `this.isPlayer1`. Publicar `energyReady` para P1/CPU como hoy y no modificar energia, eventos, anuncios, estadisticas o readiness. Una llamada directa al cue con combate silenciado retorna antes de crear contexto; un gesto de gameplay puede inicializar/reanudar el contexto compartido aunque el canal este en cero, pero nunca crea grafos silenciados.

Endurecer el lifecycle minimo en `audio.js`:

- `initAudio({ forceResume = false } = {})` crea el contexto si falta y atrapa constructor/resume sincronos y rejection asincrona.
- Intentar `resume()` para estados recuperables `suspended` o `interrupted`; no intentar reutilizar un contexto `closed`.
- Mantener una sola referencia `audioResumePending`. Un llamado normal reutiliza esa promesa y no crea intentos adicionales; `forceResume: true` inicia un nuevo intento aunque exista uno pendiente y reemplaza la referencia. Cada `finally` limpia solo si aun referencia su propia promesa, para que una promesa antigua no borre otra mas reciente.
- `playTone()` conserva `initAudio()` sin force y retorna si el contexto no esta `running`, antes de reservar voz o crear nodos. `playUISound()` permanece playback-only porque tambien puede ser invocado por gamepad o codigo.
- Si el primer sonido ocurre mientras resume sigue pendiente, se pierde. No se agenda ni reproduce tarde; una accion futura puede sonar despues de un resume exitoso.

En los handlers de controles:

- Llamar `initAudio({ forceResume: true })` en cada `keydown` no repetido que se traduzca a una accion de combate valida durante `playing`, antes de registrar la fuente.
- En botones tactiles accesibles, usar un predicado compartido antes de `initAudio({ forceResume: true })` y de registrar la fuente: `playing`, Enter/Space, no repeat, sin Ctrl/Alt/Meta/Shift y Special listo cuando corresponda.
- Llamar `initAudio({ forceResume: true })` en el `click` valido de esos botones para cubrir activacion asistida que no pase por pointerdown.
- Conservar el `pointerdown` existente, usar `initAudio({ forceResume: true })` y exigir `gameState === 'playing'` antes de inicializar o registrar la fuente; mantener boton primario y Special listo.
- No inicializar por Tab, Escape, Backquote, captura de bindings, campos editables, shortcuts con modificadores, apertura de ajustes o movimiento de sliders.

No convertir `initAudio()` en promesa requerida por gameplay ni esperar `resume()`. El combate sigue sincrono y el sonido no se encola para reproducirse tarde. Conservar keyup, agregacion de fuentes y click de un snapshot sin doble gasto.

Salida verificable: el cue usa hasta dos grafos cuando el canal esta audible y el presupuesto los admite: dos con al menos dos slots, uno con un slot y cero sin slots. Canal silenciado/no soportado crea cero grafos; gestos validos pueden inicializar el contexto aun silenciado. Gestos reservados no lo hacen y ninguna prueba de combate cambia.

### Hito 2. Lifecycle y escucha real

Extender el mock para representar contexto `suspended`/`interrupted`/`running`/`closed`, resume pendiente/resuelto/rechazado/lanzado sincronicamente y conteo de intentos. Un contexto no running no debe crear oscillator/gain, reservar voz, disparar `start()` ni depender del `onended` sincrono del mock. Confirmar que muchos playbacks suspendidos comparten un intento, que un gesto con force inicia otro aun si el primero sigue pendiente, que el `finally` antiguo no limpia la referencia nueva y que no hay rejection sin manejar. No agregar cierre/suspension automatica del contexto: los sonidos duran pocos milisegundos y la pagina ya detiene nuevos eventos al pausar.

Ejecutar una comprobacion en navegador y registrar la evidencia exclusivamente en `plans/plan_0043_validacion_humana_consolidada.md`:

- Primer ataque por teclado, pointer y boton activado con Enter/Space.
- Energia de P1 que cruza a 100 por combate, gasto de Especial y nueva recarga por combate a 100.
- Energia CPU que cruza a 100 sin cue de medidor propio.
- Canal combate a 0%, UI audible; despues el caso inverso.
- Contexto suspendido/reanudado, cambio de pestana y retorno mediante gesto.
- Escucha de punch, kick, combo, block, Special, GLITCH CANCEL y energia lista a volumen comodo.
- Escuchar el cue aislado y superpuesto a un Special/impacto a volumen por defecto y al 100%, sin distorsion evidente. Si aparece clipping o enmascaramiento, bajar solo gains del cue y repetir. Una medicion offline futura requeriria separar el scheduler de nodos del guard `AudioContext.state`; no se agrega esa abstraccion solo para este MVP.

Node demuestra estructura, no calidad sonora ni autoplay real. Si el cue no se distingue de UI/Especial, ajustar solo sus dos perfiles y repetir escucha; no ampliar catalogo durante este hito.

### Hito 3. Decision sobre audio sprites

Los sprites quedan fuera de la implementacion de este plan. Si la sintesis no cumple el objetivo, abrir un ExecPlan separado solo despues de registrar todos estos insumos:

- Al menos un efecto nombrado que no pueda obtenerse con osciladores/capas actuales.
- Archivo final, licencia/origen, formato, canales, sample rate y segmentos exactos.
- Tamano comprimido objetivo medido en bytes y presupuesto PCM decodificado separado.
- Navegadores objetivo y politica de fallback.
- Autorizacion explicita para ampliar CSP a `connect-src 'self'` si se usa `fetch()`.

Ese futuro plan debe conservar sintesis como fallback, saltar `fetch()` bajo `file:`, cargar sin bloquear gameplay, definir un buffer-source mas gain como un solo grafo/voz, cubrir errores de setup/start con cleanup idempotente, usar filename hash o version en la URL real del asset y no cambiar `DUEL_RULES_VERSION`. Si se desea variacion, debe usar datos estables o un stream exclusivo de audio; nunca `randomSimulation()` ni consumo condicional de `randomCosmetic()`.

## Interfaces y dependencias

Archivos previstos para el MVP:

- `src/audio.js`: `playEnergyFullSound()`, manejo seguro de resume y guard de contexto running; conservar globals y lifecycle actuales.
- `src/fighter.js`: disparo player-only en el cruce ya existente de energia.
- `src/game.js`: `initAudio()` dentro de gestos validos de combate.
- `tests/game.test.js`: mock suspended/resume y pruebas de cue, lazy init, mute, eventos y combate intacto.
- `src/index.html`: actualizar cache keys de `audio.js`, `fighter.js` y `game.js` a `20260920-audio1`, preservando orden clasico.
- `Readme.md`: describir cue y activacion best-effort; corregir la afirmacion del overlay sobre diagnosticos de Web Audio.
- `plans/plan_0043_validacion_humana_consolidada.md`: unica ubicacion para evidencia real de escucha/navegador.
- Este plan: progreso, decisiones, resultados y desviaciones.

No se preven cambios en `src/config.js`, input, efectos, renderers, estilos, i18n, IA, controles de volumen, storage o reglas de juego. El audio espacial de `BACKLOG.md #40` requiere un ExecPlan separado.

## Pasos concretos

Desde `C:\opt\personal\glitch_duel`:

1. Registrar baseline:

       git status --short
       node --version
       Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object {
           node --check $_.FullName
           if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
       }
       node --check tests\game.test.js
       node --test tests\game.test.js
       git diff --check

   Exito: Node 24, sintaxis, suite y diff-check terminan con codigo cero. No modificar ni revertir cambios preexistentes, incluido `plan_0051` si sigue sin seguimiento.

2. Agregar caracterizaciones del Hito 0. Pointerdown es un baseline que ya pasa; su fixture debe entrar en `playing` antes de despachar eventos. Cue, teclado y boton accesible deben fallar antes del cambio. Exito: distinguen P1/CPU, cruce/no cruce, mute y gesto valido/reservado sin depender de escucha, con casos separados que rechazan pointer/key/click en menu o pausa.

3. Implementar Hito 1 con el cambio minimo en `audio.js`, `fighter.js` y `game.js`; actualizar cache keys y README.

4. Ejecutar validacion automatica completa. Exito: todos los scripts y pruebas pasan, `git diff --check` no reporta whitespace y el diff no contiene assets, clases, RNG ni cambios de combate.

5. Servir el juego:

       python -m http.server 8000

   Abrir `http://localhost:8000/src/?debug=1&seed=52`, ejecutar el checklist de Hito 2 y registrar solo evidencia observada en plan `0043`.

6. Cerrar el MVP. Si la escucha no demuestra una carencia concreta, registrar sprites como descartados.

7. Si Hito 3 identifica una carencia concreta, crear otro ExecPlan con asset, hash, licencia, segmentos, presupuesto, navegadores y decision CSP antes de escribir loader alguno.

## Validacion, aceptacion y evidencia

### MVP sintetico

- `playEnergyFullSound()` intenta hasta dos tonos con frecuencias, gains, duraciones y offset exactos; pruebas con 22/23/24 voces ocupadas fijan admision 2/1/0 y dropped voices.
- Un cruce P1 `99 -> 100` por `hit`, `block` o `damage` produce un cue; `100 -> 100`, `refill` y cualquier cruce CPU no lo producen. Hit/chip letal conservan el cue como evento de medidor, no de accion disponible.
- El evento `energyReady` conserva su schema y sigue publicandose para el actor correspondiente.
- Gastar Especial y volver a cargar permite un nuevo cue exactamente una vez.
- Una llamada directa con combat en cero no crea contexto ni grafos; un gesto valido silenciado puede crear/reanudar el contexto compartido, pero crea cero grafos. Canal UI sigue independiente.
- Falta de Web Audio, constructor fallido o resume pendiente/rechazado/lanzado no lanza errores ni impide registrar input/combatir.
- Mientras el contexto no esta running no se crean nodos, no aumenta activeGraphs y no queda sonido para reproducir al reanudar; otra accion posterior puede sonar.
- Playbacks best-effort suspendidos comparten un unico resume pendiente; un gesto posterior fuerza otro intento y puede habilitar un sonido nuevo sin revivir el anterior.
- Carga de pagina, render de ajustes y cambios de slider siguen sin crear contexto.
- Keydown de accion valida, pointerdown y activacion nativa valida intentan inicializar; teclas reservadas, modificadores, estados menu/paused y targets editables no lo hacen.
- Eventos repeat no multiplican intentos de inicializacion; keyup limpia la fuente y secuencias keydown/keyup/click no gastan dos acciones.
- Combos y ataques rechazados no reciben nuevos sonidos incidentales.
- Diagnosticos terminan con `activeGraphs === 0`, creados igual a terminados y osciladores/gains creados igual a desconectados.
- Un stress de capas no supera `AUDIO_CONFIG.maxVoices`; dropped voices permanece contabilizado.
- Un escenario sembrado identico compara snapshots de combate y siguiente valor de RNG con audio audible, combat muteado y `AudioContext` ausente; diagnosticos de audio se excluyen de la igualdad.
- La prueba HTML estatica conserva orden clasico y exige token `20260920-audio1` en `audio.js`, `fighter.js` y `game.js`.

### Evidencia real

- Escucha y browser/device evidence se registra unicamente en plan `0043`.
- Probar a volumen comodo en al menos altavoces y auriculares; telefono/tablet solo si se afirma soporte fisico.
- Medir `baseLatency` y `outputLatency` cuando existan, sin convertirlos en promesa de latencia cero.
- La escucha aislada y superpuesta se registra con navegador, dispositivo y niveles usados; no se afirma ausencia universal de clipping.
- No declarar calidad, inmersion o compatibilidad total a partir de mocks.

## Riesgos, idempotencia y recuperacion

- Riesgo: duplicar arquitectura. Mitigacion: extender `audio.js`; no clase ni archivo manager nuevo.
- Riesgo: autoplay pierde el primer sonido, acumula resumes o deja grafos pendientes. Mitigacion: deduplicar intentos normales, permitir force solo desde handlers humanos validados, programar solo con contexto running y no dejar audio viejo en cola.
- Riesgo: el cue se confunde con energia CPU o readiness inmediato. Mitigacion: sonido de medidor solo para P1 y documentado como cruce combatiente; el evento semantico conserva ambos actores.
- Riesgo: clipping por capas nuevas. Mitigacion: gains bajos, maximo dos grafos, voice cap y escucha aislada/superpuesta a volumen controlado.
- Riesgo: audio altera determinismo. Mitigacion: ningun RNG, temporizador de simulacion o callback de audio escribe gameplay.
- Riesgo: sprite empeora arranque. Mitigacion: excluirlo de este plan y exigir otro ExecPlan con evidencia, asset y sintesis fallback.
- Riesgo: CSP debilitada. Mitigacion: no cambiarla en MVP; si se autoriza sprite, limitar a `connect-src 'self'` y documentar la decision.
- Riesgo: menos de 1 MB se interpreta como memoria. Mitigacion: separar bytes comprimidos de PCM decodificado medido.
- Riesgo: soporte de codec desigual. Mitigacion: fallback sintetico y matriz de navegadores real.
- Riesgo: claims no verificables. Mitigacion: usar baja latencia/best-effort y registrar evidencia fisica solo donde corresponde.

Las pruebas y sintesis son repetibles. El MVP no migra datos ni cambia schema. Si falla, retirar el nuevo cue, el hardening de resume y las llamadas de desbloqueo sin tocar perfiles existentes. No se agrega asset, loader ni cambio CSP en este plan.

## Registro de decisiones

- Decision: conservar `src/audio.js` como unico motor y no crear `SoundManager`.
  Justificacion: ya centraliza contexto, perfiles, volumen, presupuesto y cleanup; una clase no agrega un lifecycle nuevo.
  Fecha/autor: 2026-09-20, OpenCode.
- Decision: implementar solo una nueva senal sintetica player-only para energia lista en el MVP.
  Justificacion: es el unico evento propuesto que existe y aun no tiene cue propio; se define como medidor lleno, no disponibilidad inmediata. Los demas ya estan cubiertos o no existen.
  Fecha/autor: 2026-09-20, OpenCode.
- Decision: no agregar pitch aleatorio.
  Justificacion: no hay evidencia de repeticion molesta y se evitaran acoplamientos con RNG, mute o capacidad del navegador.
  Fecha/autor: 2026-09-20, OpenCode.
- Decision: gatear audio sprites por contenido, no por rendimiento supuesto.
  Justificacion: frente al sistema actual, un sprite agrega fetch, decode, PCM, CSP y fallback en vez de eliminar costo existente.
  Fecha/autor: 2026-09-20, OpenCode.
- Decision: mover cualquier sprite a un ExecPlan futuro.
  Justificacion: faltan efecto deficitario, asset, licencia, codec, segmentos y presupuestos; no es ejecutable dentro del MVP.
  Fecha/autor: 2026-09-20, OpenCode.
- Decision: no programar nodos mientras el contexto no este running.
  Justificacion: evita sonidos obsoletos, grafos varados y agotamiento del voice cap durante resume pendiente o fallido.
  Fecha/autor: 2026-09-20, OpenCode.

## Resultados y retrospectiva

Pendiente. El analisis confirma que el sintetizador, capas, volumen, reloj de audio, voice cap y cleanup ya estan implementados. El plan propone completar el unico cue aplicable de la matriz, mejorar activacion y evitar grafos sobre contextos suspendidos. Sprites quedan fuera hasta demostrar una necesidad sonora concreta y redactar otro ExecPlan.

## Notas de revision

- 2026-09-20: plan inicial tras contrastar la propuesta con `audio.js`, disparadores, CSP, pruebas, backlog y evidencia de plan `0049`.
- 2026-09-20: revision tecnica preciso semantica de medidor lleno, resume/suspension, mute, admission parcial por voice cap, handlers accesibles y separo sprites en un plan futuro.
