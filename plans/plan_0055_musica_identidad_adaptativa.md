# plan_0055_musica_identidad_adaptativa - Banda sonora coherente, reconocible y adaptativa

**Fecha:** 2026-10-03

**Ámbito:** síntesis musical, composición, transporte, adaptación, mezcla, controles y validación

**Estado:** bloqueado

Este ExecPlan se mantiene conforme a `PLANS.md`. El usuario solicitó ejecutarlo; queda bloqueada la aceptación perceptiva hasta disponer de escucha/evidencia real.

## Propósito y alcance

Implementar las siete mejoras propuestas: recuperar la coherencia del motor, crear un motivo de GLITCH DUEL, acortar la estructura, responder a la tensión del duelo, diferenciar los seis estilos, dar remates a eventos importantes y mejorar mezcla/controles. El resultado debe escucharse como una composición con identidad y desarrollo durante una ronda de 60 segundos, con bajo y melodía completos, transiciones suaves y efectos de combate claros.

Se conserva el proyecto estático, sin dependencias ni build; `src/audio.js` continúa siendo el motor central, con Web Audio lazy y síntesis local. No se modifican física, daño, hitboxes, IA, fixed-step, inputs, trials, estadísticas, formatos de retos o `DUEL_RULES_VERSION`. La música es presentación: nunca decide ni retrasa combate. No se añaden archivos de audio, sprites, voz, nuevas mecánicas, telemetría ni preferencias adicionales a los tres volúmenes y la selección musical existentes. El trabajo de cue de energía y desbloqueo general de SFX del borrador `plan_0052_audio_sintetico_inmersion.md` no se ejecuta implícitamente aquí.

## Progreso

- [x] 2026-10-03: revisión de `PLANS.md`, código, UI y suite; baseline `8c0d1d9`, con 231 pruebas aprobadas antes de ejecutar.
- [x] Hito 0: baseline 231 y mocks de audio con reloj/conexiones/AudioBuffer/PeriodicWave; se añadieron regresiones de motor. Desviación: al implementar primero el scheduler, las regresiones fueron añadidas después de los cambios, no como una suite roja previa.
- [x] Hito 1: escala/grados, bajo, síntesis, buses, cap musical independiente y cleanup idempotente.
- [x] Hito 2: scheduler de audio, ventana de 120 ms, pausa/reanudación, mute y pump de presentación.
- [x] Hito 3: motivo común A–C–E–B–A, compás 4/4 y estructura de 16 compases.
- [x] Hito 4: perfiles rítmicos/tímbricos de seis estilos y progresión de acordes compartida.
- [x] Hito 5: intensidad por vida/contactos/tiempo, hysteresis, acentos y remates.
- [x] Hito 6: selector restaurado, tema actual, preview cancelable, tres canales y traducciones.
- [x] Hito 6b: render offline de seis estilos × tres intensidades y mezcla combinada; el stress combinado inicial superó 0.98, por lo que se agregó compresión/limitación compartida y se repitió la medición. Números registrados en plan 0043.
- [ ] Hito 6c: comparar trims/timbre mediante escucha perceptiva antes de aceptarlos.
- [ ] Hito 7: completar escucha/dispositivos y registrar evidencia; sintaxis, suite y smoke de navegador completados, pero aceptación perceptiva pendiente.

Cada hito con JavaScript requiere la suite completa antes de avanzar. La percepción musical se valida después del arreglo completo; no declarar cierre total si queda pendiente la escucha de aceptación.

## Contexto actual

### Archivos y responsabilidades

| Ruta | Implementación actual relevante |
| --- | --- |
| `src/audio.js` | Contexto compartido y SFX; `generateMusicBarEvents()`, `tickMusic()`, buses, voz/cue lifecycle, volumen, preview y transporte musical. |
| `src/config.js` | Escala/tónica/motivo de `MUSIC_CONFIG`, `AUDIO_CONFIG`, límites y ruta Arcade con estilo musical por enfrentamiento. |
| `src/game.js` | Match/style lifecycle, pausa/reanudación, intensidad por salud/contactos/tiempo, `recordCombatEvent()`, cues, preview, tema actual y pump de presentación. |
| `src/index.html` | `#music-select`, resumen del estilo, toolbar musical, tres volúmenes y botones de prueba de combate/UI/música. |
| `src/i18n.js` / `src/styles.css` | Traducciones ES/EN y presentación de ajustes/toolbar. |
| `tests/game.test.js` | Mocks Canvas/DOM/AudioContext con reloj, aristas, BufferSource y PeriodicWave; regresiones de combate y música. |
| `Readme.md` | Instrucciones/features; descripción sonora anterior a buena parte del motor musical actual. |
| `plans/plan_0043_validacion_humana_consolidada.md` | Única ubicación para evidencia de navegador, escucha, dispositivos, AT y rendimiento. |

Las claves existentes de música son `bitDuel`, `baroqueBash`, `neonFury`, `glitchAssault`, `retroGroove` y `voidReach`, a 145/165/155/200/125/90 BPM. Arcade fija respectivamente Baroque, Bit, Neon, Glitch y Void en sus cinco enfrentamientos. La selección manual se guarda en `glitchDuelMusicStyle`; `''` significa aleatoria, ahora elegida con RNG musical independiente y una vez por match. Los volúmenes se guardan en `glitchDuelAudioVolumes`, versión 1, con defaults 65/55/50% para combate/UI/música.

Ejecución: los instrumentos de música se generan con `generateMusicBarEvents()` y se envían a buses separados; `tickMusic()` solo bombea audio/presentación, sin tocar la simulación fixed-step. `pauseMusic()` conserva bar y pulso; `stopMusic()` reinicia escenas. El ruido percusivo usa un buffer determinista por contexto y las fuentes musicales tienen presupuesto propio de 24, separado de los 32 grafos SFX.

### Defectos de la baseline confirmados antes de la ejecución

- `MUSIC_CONFIG.notePool` contiene ocho notas MIDI. Los offsets de melodía y armonía se usan como índices de ese array, a menudo fuera de rango. En la frase inicial de intensidad 3, Bit Duel, Baroque Bash, Neon Fury y Retro Groove tienen cero notas válidas. La calidad armónica de un acorde también se confunde con posición dentro de la escala.
- `bassForBeat()` espera número, pero `scheduleMusicBar()` llama `pattern.bass({ beat, total })`: se obtuvieron cero eventos de bajo principal. Además, duraciones de cuatro tiempos se consultan dentro de un bloque de 16 negras.
- `getMusicIntensityFromHealth()` usa `health / displayHealth` para P1. Cuando la vida animada alcanza la real, P1 con 5% y CPU con 100% vuelve a intensidad 1.
- Los instrumentos conectan directamente a `musicMasterGain`, omitiendo los buses de capa. `applyLayerGains()` cambia buses sin señal; los multiplicadores usados al crear voces no afectan voces ya programadas. El fundido usa un contador por llamada rAF y asigna intensidad inmediatamente.
- `scheduleMusicVoice()` no es llamado por los instrumentos. `stopMusic()` no cancela las notas normales ya programadas. Su helper elimina la voz al programar `stop(futureTime)`, en lugar de al terminar. Pads se acumulan hasta stop y `scheduleGlitchNote()` inicia un LFO sin stop/disconnect.
- `startMusic()` reinicia compás/sección; pausar/reanudar pierde posición. Volumen por nota implica que mute no corta inmediatamente todo lo programado; el ruido continuo no aplica por sí mismo la preferencia musical.
- `getMusicTiming()` considera un bloque de 16 negras como compás; ocho bloques duran 38–85 segundos. Muchas rondas apenas llegan a la segunda sección.
- `NES_PULSE_WIDE/NARROW` se calculan antes de existir contexto y quedan `null`. `createPulseWave()` contiene solo un armónico, insuficiente para construir el pulso prometido. Baroque Bash no coincide con la clave `baroquePunk` de su tabla de melodías y cae en default. Rhythm/octave de `STYLE_MELODY_CELLS` no gobiernan el arreglo normal.
- El filtro creado en `musicCriticalHitLP()` no se conecta a la música. `musicStutter()` suma tonos y atenúa, sin cortar realmente el acompañamiento. `musicChorusGain` no tiene destino útil; `pickWave()` y varios helpers/variables no participan en playback.
- Los mocks actuales carecen de `sampleRate` realista, reloj avanzable y conexiones inspeccionables; varias pruebas no llegan a programar música. Sus passes no prueban timbre, continuidad ni calidad percibida.

Estos hallazgos son caracterización técnica; no se ha hecho escucha comparativa de la banda sonora actual. Conservar en el plan hechos reproducibles, no juicios de calidad inventados.

La ruta de reproducción nueva ya no usa los patrones por 16 negras, índices de escala ni los buses del código anterior. La voz de pulso se crea de forma lazy con 32 armónicos; los efectos de critical/combo ahora automatizan el filtro conectado; el scheduler nuevo registra y limpia fuentes de instrumento y buffer de ruido. La medición OfflineAudioContext está registrada en plan 0043; la escucha sigue pendiente.

## Diseño y plan de trabajo

### Hito 0 — Regresiones y baseline

Extender `createMockAudioContext()` en `tests/game.test.js` con `sampleRate = 44100`, IDs de nodos, aristas reales de `connect()`, parámetros que registren automatización y un reloj que avance explícitamente. Fuentes deben conservar su stop futuro hasta que el reloj entregue `onended`; stop/disconnect repetidos se contabilizan sin duplicar cleanup. Incluir `createPeriodicWave()`, `setPeriodicWave()`, fuentes de buffer y cancelación de automatizaciones. Mantener disponibles los modos simplificados que requieren los tests existentes, sin alterar pruebas de gameplay.

Añadir primero regresiones que fallen por: notas inválidas en 6 estilos × 3 intensidades; bajo ausente; peligro P1; voz musical que sobrevive pausa; mute sobre voz/pad/ruido activos; buses ignorados; pulso sin inicialización lazy; cambio a Baroque que cae en default. Para transporte futuro, probar horarios con reloj controlado y calls 30/60/120 Hz, sin atribuir audio real a mocks. Congelar traces de combate con música audible/mute/ausente para demostrar que el trabajo posterior no cambia simulación ni RNG.

### Hito 1 — Coherencia tonal, instrumentos y lifecycle

En `src/config.js`, expresar escala como offsets en semitonos y tónica MIDI, separadas de motivos en grados. Diseño inicial: La menor natural, tónica A3/MIDI 57 para referencia, escala `[0, 2, 3, 5, 7, 8, 10]`. Convertir grados positivos/negativos con división por siete y octava; construir acordes mediante raíz MIDI más intervalos explícitos. Bajo usa registros A1–A2, melodía A3–A5 y pad registros intermedios. Rango permitido inicial MIDI 24–96: datos fuera de él fallan validación de configuración, no se ocultan con silencios. El acorde dominante mayor puede elevar la sensible de forma explícita; no es un índice fuera de escala.

Corregir la firma de eventos musicales y bajo. Preferir una representación pequeña de eventos `{ beat, durationBeats, layer, notes, velocity, instrument }`, con offsets expresados en negras, que pueda programarse igual en reproducción y en `OfflineAudioContext`. Una función local de generación por compás reutiliza los instrumentos; no crear un framework de partituras ni un segundo compositor para tests. Bajo genera sus onsets una vez, no una nota duplicada por cada consulta de duración.

Inicializar/cachar formas de pulso después de crear el contexto, con suficientes coeficientes armónicos (32 como punto inicial). Compartir el cache por contexto; no crear ondas al cargar la página. Igualar amplitud de presets mediante normalización y escucha. Corregir el nombre de Baroque y usar las claves del selector como fuente única del catálogo.

Reconectar todos los instrumentos al bus correspondiente: percusión → drums; bajo → bass; melodía/contramelodía/cuerda → melody; glitches → glitch; pad/drone → pad. Cada fuente y sus gains/filtros/moduladores se registran antes de start y se liberan idempotentemente en `onended`, fin de cola o cancelación. Un stop futuro no retira el registro antes de tiempo. Los nodos compartidos del bus no se desconectan al limpiar una voz. LFOs locales terminan con su fuente; mods globales se crean una sola vez y quedan silenciados al detener transporte.

Preservar el límite SFX actual `AUDIO_CONFIG.maxVoices = 32`; añadir límite musical explícito inicial de 24 fuentes activas/programadas, incluyendo pad/drone/LFO local. Prioridad musical: pulso/bajo/motivo antes que adornos. Si no hay slots, omitir adornos sin dejar grafos parciales. Contadores separados describen música y SFX con claridad. Reutilizar buffers cortos de percusión por contexto; no reconstruir ruido para cada nota. Todas las ramas musicales requieren cleanup, incluidos noise floor y efectos de evento.

Retirar solo helpers/variables musicales que hayan sido sustituidos y no tengan callers; conservar API de SFX. El ruido base debe ser muy bajo y pasar por volumen de música; si la escucha no aporta valor, retirarlo.

Aceptación: notas finitas en todos los arreglos, bajo con onsets válidos, conexiones a buses verificadas, cleanup completo y presupuestos acotados. Suite completa aprobada.

### Hito 2 — Transporte de audio y transiciones

Separar el reloj de sonido (`audioCtx.currentTime`) del reloj de combate. `tickMusic()` mantiene una ventana corta de programación de 120 ms, con margen de arranque 20 ms, evaluada por rAF; compás = cuatro negras, subdivisión base = semicorchea. Mantener tempo fijo por estilo durante el enfrentamiento. La humanización cambia posiciones hasta ±6 ms y velocidades hasta ±10%, con acentos propios; nunca produce start en pasado ni cambia duración de frase. Retirar rubato de tempo por compás para evitar inconsistencias entre patrón y scheduler.

El transporte lleva escena, estilo, índice de compás, posición de pulso y cursor de eventos; solo un cursor activo. La composición es estable con una seed de música de sesión independiente: no consumir `randomSimulation()` ni `randomCosmetic()`, ni guardar/transmitir seed musical. La generación de cada compás puede derivarse de esa seed + estilo + índice + intensidad para evitar que polls/mute decidan las notas futuras.

`setMusicIntensity()` solicita un destino. Ganancias se interpolan con AudioParam durante 200 ms, y densidad/arreglo cambian al siguiente compás. No usar contadores rAF para fundidos. El volumen de usuario va en el bus maestro; envelopes, ducking y cambios de escena usan gains distintos para que un efecto no restaure accidentalmente volumen sobre mute.

Definir suspensión musical distinta de parada: pausa guarda la posición audible del compás en el instante de suspensión y cancela las fuentes futuras/activas con release breve. El cursor guardado se calcula desde el reloj actual, no desde el último evento adelantado por lookahead: las notas futuras canceladas deben poder programarse al reanudar. Resume rebasa los eventos restantes al reloj actual con entrada de 40 ms, sin replay del tiempo de pared ni reset al compás cero; una nota sostenida interrumpida puede retomar su duración restante con nueva envolvente. Menu/new match sí reinician la escena musical. Detener/reanudar es idempotente y no duplica scheduler.

Si rAF llega tarde, abandonar eventos vencidos y rebasar al próximo pulso musical; no reproducir en ráfaga el historial. Limitar trabajo de pump a la ventana corta y al presupuesto musical. Suspensión/hidden detiene música, cancela previews y libera voces; volver visible no reanuda partida automáticamente. `resume()` del contexto sigue best-effort y sin esperar desde combate. No programar fuentes cuando el contexto esté suspended/closed ni crear contexto por slider, idioma, carga o render. Si SFX/UI están muteados, un gesto explícito de empezar/probar música debe poder inicializarla.

Mover el pump desde `advanceSimulation()` a una ruta de presentación del `gameLoop()` apta para música de menú e intro y remates de resultado. Esto no permite update/physics fuera de `playing`: en menú/resultado solo agenda audio de su escena; en pausa no reproduce. Eventos de cierre ya programados con reloj de audio pueden terminar sin avanzar juego.

Aceptación: continuidad tras pausa, mute inmediato con rampa máxima 20 ms, scheduler único, no notas vencidas/catch-up, fundidos independientes de FPS y combate idéntico.

### Hito 3 — Motivo común y frases breves

Componer el motivo inicial en grados `[0, 2, 4, 1, 0]`, equivalente A–C–E–B–A en La menor, con duraciones `[0.5, 0.5, 1, 0.5, 1.5]` negras (un compás). Es una decisión de partida: puede ajustarse tras escucha, conservando una frase corta recurrente. Escribirlo una vez en configuración y derivar variantes de octava, articulación o respuesta; no copiar arrays de notas para cada pantalla.

Estructura inicial de combate de 16 compases: 2 de entrada, 4 de tema A, 4 de respuesta B, 2 de respiro y 4 de retorno/cierre. Repeticiones posteriores conservan A y varían finales/ornamentos por ciclo, sin perder motivo. La sección A aparece en 2.4–5.3 s; la B en 7.2–16 s con los BPM existentes. En alta tensión, el respiro conserva pulso y bajo; no elimina el impulso de una ronda decisiva.

Armonía inicial por frase: tónica menor → subdominante menor → dominante explícita → tónica. Bajo/drone acompañan la raíz vigente; las voces usan inversiones cercanas para evitar saltos arbitrarios. Motivo y contramelodía se alternan: ninguna respuesta ocupa siempre el mismo registro/onset del tema. Reposos declarados son `rest`, no resultado de índices inválidos. En cada tema A y retorno, todos los estilos deben presentar el motivo completo; Void lo puede extender a dos compases.

Tema de menú: derivación ligera del motivo, menor densidad, sin golpes de tensión. Comienza solo tras un gesto válido de interacción y contexto running; cargar página sigue silencioso. Ayuda/Controls mantienen el mismo acompañamiento suave si ya estaba iniciado. Durante onboarding bajar densidad/mezcla para no competir con instrucciones. Una intro breve retoma el motivo y enlaza al primer downbeat de combate sin alargar `VS_INTRO_FRAMES` ni bloquear inputs.

El estilo aleatorio se elige una vez por enfrentamiento, se conserva entre sus rondas y no vuelve a sortearse por pause/resume. La ruta musical de Arcade permanece configurada como hoy; la elección manual sigue respetada fuera de Arcade.

Aceptación: longitudes exactas de compases/secciones, motivo presente, progresión común coherente y rondas con desarrollo audible antes de 20 s en los seis tempos.

### Hito 4 — Identidad de los seis arreglos

Preservar labels/keys/BPM. Crear datos compactos de articulación, patrón rítmico, registro y mezcla por estilo; no mantener seis motores distintos. Notas de armonía y motivo vienen del hito 3. Swing por estilo se aplica a corcheas débiles y nunca al kick fundamental.

| Estilo | Arreglo inicial verificable |
| --- | --- |
| Bit Duel | Pulso 25% para lead y 12.5% como acento, bajo triangular, kick/snare compacto y hats regulares; tema legato corto con articulación 70%. |
| Baroque Bash | Lead articulado/cuerda pulsada, arpegios de semicorcheas en B, bajo de raíces y contramelodía contraria; motivo íntegro en A. Reducir batería en A para dejar espacio. |
| Neon Fury | Saw filtrada, bajo sincopado anticipando tiempos 2/4, acordes sostenidos e introducción progresiva de filtro; groove recto, sin copiar arpegio barroco. |
| Glitch Assault | Riff grave de raíz/quinta, kick fuerte, subdivisión más densa en intensidad alta; glitches al final de frase con cooldown, no barrido constante. |
| Retro Groove | Bajo con anticipaciones y notas fantasma limitadas, stabs en contratiempo y swing inicial 56:44; hats con acentos alternados, menos lead sostenido. |
| Void Reach | Drones ligados a los acordes, motivo dos compases y percusión escasa; entrada del jefe con pulso grave/motivo completo, progresión de densidad hacia el duelo, sin convertir los 90 BPM en otro estilo. |

Humanización respeta el perfil: jitter máximo 2 ms para Glitch y 6 ms para Retro/Baroque; no añadir variación de timbre aleatoria a cada nota. Chorus/delay solo donde aporte identidad, con mezcla limitada y mono-safe. El LFO global debe conectarse a un parámetro real o retirarse. Mantener drums capaces de kick+hat simultáneos mediante eventos separados; hoy el first-match de percusión impide parte de las capas.

Aceptación: tests distinguen firmas de ritmo/timbre/registro; escucha reconoce diferencias entre los seis temas y su motivo común.

### Hito 5 — Adaptación y momentos memorables

En `src/game.js`, sustituir la división por `displayHealth`: normalizar vida P1 con el máximo inicial de su estilo (`100 * FIGHTER_STYLES[style].health`, redondeado como `applyStyle()`), CPU con 100; no depender de propiedades visuales. Reutilizar tiempo efectivo de Training para que “sin tiempo” no cree tensión final.

Reglas iniciales, configuradas y testables:

- Nivel base por vida mínima normalizada: 1 sobre 70%, 2 a 70% o menos, 3 a 30% o menos. Incluir ambos actores, valores exactos de frontera y estilos.
- Ronda decisiva 1–1 eleva como mínimo a 2; reloj efectivo a 10 s o menos eleva a 3. No aplica timer final en práctica sin tiempo.
- Actividad reciente: ventana de 180 pasos fijos, máximo 12 contactos `attackResolved`. Un hit aporta 1 y block 0.5; whiff no aporta. Suma 3 eleva a 2 y suma 5 a 3. Ventana/cooldowns se actualizan exclusivamente en fixed-step, por eventos reales.
- Ascenso de objetivo se solicita inmediatamente; descenso requiere 120 ticks sin condición superior. Cambio estructural al compás siguiente; ganancia empieza transición suave. Reset, cambio de trial y KO limpian actividad; pause congela y conserva, hidden no acumula eventos.

Usar `recordCombatEvent()` para actividad/contactos y `triggerSpecialFeedback()` para Special ejecutado (incluye whiff legítimo). Consolidar disparadores musicales para que un Special que también impacta no ejecute doble acento. No alterar `attackResolved`, `energyReady`, sus reducers o estadísticas.

Efectos musicales:

- Special: bajar acompañamiento 6 dB en 15 ms, dos cortes cortos en un gain dedicado (duración total 120–180 ms) y vuelta marcada. El SFX inmediato conserva su tiempo; el acento tonal puede entrar en la siguiente semicorchea si está a 120 ms o menos. Si la siguiente subdivisión está más lejos, emitir el acento de inmediato con margen de audio de 20 ms, especialmente en Void a 90 BPM. No añadir silencio previo que retrase el ataque.
- Combo conectado: acento armónico breve y ducking de 3 dB, máximo uno cada 45 ticks; bloqueos/whiffs no lo disparan. Un Special tiene prioridad sobre combo.
- Fin de ronda: cancelar futuras notas de combate y programar remate del motivo una sola vez; ascendente para victoria y descendente/resolutivo para derrota, neutro para empate. Máximo 900 ms para dejar margen en el intermedio de 1400 ms existente.
- Resultado final: cadencia del motivo de hasta 1.6 s, distinguida por victoria/derrota y cierre Arcade. Victoria a 5% o menos puede usar pickup corto “último bit”; no cambia medalla/resultado. `finishRound()` y `finishMatch()` no duplican remate. Reinicio/Menu invalidan callbacks musicales viejos.
- Pause: release suave y retoma de la frase guardada con entrada corta; no cue obligatorio adicional sobre UI resume.

`musicCriticalHitLP()` automatiza un filtro ya conectado en bus; `musicStutter()` modula realmente la música. Ducking/filtro/corte son acotados y no crean automatizaciones ilimitadas con spam. Si los nombres se reemplazan, actualizar sus callers/pruebas; no dejar funciones que aparenten efectos inexistentes.

Aceptación: eventos musicales exactamente una vez, prioridades/cooldowns, tensión en fronteras y neutralización/reset; trace de combate y RNG intactos con audio off/on.

### Hito 6 — Mezcla y experiencia de usuario

Ruteo implementado: instrumento → gain de capa → bus de efectos/filtro de música → ducking → volumen de usuario → compresor musical → compresor/limitador final compartido → salida. Mantener ducking/envelope de escena separados del volumen de usuario. Valores 0% se respetan aun durante fades, ruido, remates o callbacks. Conservar SFX/UI y sus niveles por defecto; la música deja espacio en registros medios/agudos durante impactos importantes. No aumentar el volumen global para ocultar notas faltantes.

Normalizar los seis arreglos por trim de estilo. Renderizar muestras offline representativas con el mismo compositor/instrumentos de producción: 16 compases por estilo e intensidad, más special/combo/remate. Medir peak/RMS, finitud y discontinuidades de muestra; no convertir RMS en prueba de volumen percibido. Objetivo técnico inicial: peak musical ≤ 0.8; diferencias RMS entre estilos de similar densidad dentro de 4 dB. Caso combinado música + SFX/UI al 100% debe quedar bajo 0.98, con margen. Si se necesita limitación global, justificar y acotar el cambio a salida compartida, conservando mute y pruebas SFX; no ampliar arquitectura sin medición.

Escucha decide trims, dureza de lead, ruido y graves; no imponer la misma densidad a Void y Glitch. Delay/chorus no deben hacer desaparecer motivo en mono ni tapar SFX. Evitar clicks con envelopes y parar moduladores/colas al ocultar página.

En UI:

- Añadir `#test-music-audio` a `.audio-preview-actions` con `PROBAR MÚSICA / TEST MUSIC`. Toggle a `DETENER PRUEBA / STOP PREVIEW`; muestra 8 s del estilo elegido en intensidad media (aleatoria usa Bit para un preview estable), sin partida ni escritura de stats. Una sola preview activa, cancelada por cierre de utilities, ayuda/controls, arranque de modo o hidden; vuelve al menú musical suavemente si correspondía.
- Mostrar `#music-now-playing` en toolbar con texto localizado de tema actual; actualizar solo al cambiar estilo/escena, no live ni por frame. Tamaño/ellipsis no debe ocultar PAUSA o estado del combate. Mostrar también nombre previsto junto al selector, particularmente al usar aleatoria.
- Leer `glitchDuelMusicStyle` con validación `''` o seis claves antes de render inicial; errores/valores desconocidos → aleatoria. Escribir solo cambios explícitos del usuario. Arcade aplica su estilo de sesión y restaura la selección del menú sin sobrescribir storage.
- Cambiar volumen actualiza de inmediato bus musical si existe, sin crear contexto. Si se pasa de 0 a audible, reanudar escena solo si el contexto ya está running y hubo gesto habilitante; nunca reproducir una preview cancelada ni cues antiguos.

Localizar labels/estado ES/EN en `src/i18n.js`, preservar disclosures nativos/focus y no agregar controles por defecto al menú cerrado. La música no es información exclusiva de juego; Canvas/DOM/announcements existentes siguen disponibles cuando audio es cero.

Aceptación: preview/mute/selección/restauración y focus correctos, mezcla con medición y escucha aprobadas, sin autoplay en carga.

### Hito 7 — Cierre, evidencia y documentación

Ejecutar la suite completa, escenarios de reloj y export offline; luego navegador real y escucha. Actualizar `Readme.md` con seis estilos, menú/preview, tres canales, adaptación y pausa; corregir 24-voice histórico para distinguir cap SFX de cap musical. Actualizar `AGENTS.md` solo si hay contratos duraderos nuevos sobre ruteo/relojes/transport. No declarar este hito terminado con solo tests.

Versionar `audio.js`, `config.js`, `game.js`, `i18n.js` y CSS modificados en `src/index.html`; conservar orden de scripts. La publicación de `src/` continúa sin build y tras validación. Solo incluir en backlog cambios realmente entregados; no marcar audio espacial ni plan 0052 completados.

Si no hay acceso a escucha/dispositivos, registrar “implementación automatizable entregada; escucha pendiente”, mantener el plan activo/bloqueado para esa validación y señalar el pendiente al usuario. No asumir aprobación humana.

## Interfaces y dependencias

Las interfaces de composición/transporte descritas a continuación son propuestas a crear, no símbolos existentes que otro ejecutor pueda llamar hoy:

| Propuesta | Ubicación y contrato |
| --- | --- |
| Conversión grado/octava y eventos por compás | Helpers locales `src/audio.js`, configuración tonal `src/config.js`; salida finita/pura con seed musical propia. |
| Suspender/reanudar transporte | `src/audio.js`; preservar cursor, liberar fuentes y rebasar reloj, sin escribir estado de juego. |
| Solicitar escena/intensidad y acento | `src/audio.js`; llamadas desde transiciones/eventos existentes de `src/game.js`, idempotentes y acotadas. |
| Ganancias master/layers/effects | `src/audio.js`; único escritor de cada automatización, cancelación/retarget sin restaurar mute. |
| Preview y tema actual | `src/game.js`, `src/index.html`, `src/i18n.js`, `src/styles.css`; session-only salvo preferencias existentes. |

No crear clase SoundManager, AudioWorklet, worker, archivos musicales por género ni nueva librería. Generación de eventos y pruebas comparten las mismas reglas; mocks/offline solo sustituyen reloj/contexto, no compositor.

## Pasos concretos

Desde la raíz `C:\opt\personal\glitch_duel`, antes de implementar y al cerrar cada hito JavaScript:

    git status --short
    node --version
    Get-ChildItem -LiteralPath "src" -Filter "*.js" | ForEach-Object {
        node --check $_.FullName
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }
    node --check tests\game.test.js
    node --test tests\game.test.js
    git diff --check

Exigir Node.js 24, salida exitosa en sintaxis/tests/diff; no fijar un conteo futuro. Caracterizaciones de hito 0 deben fallar por el defecto y pasar después, sin debilitar las garantías de combate.

Para navegador, desde la misma raíz:

    python -m http.server 8000

Abrir `http://localhost:8000/src/?seed=55` para revisión de modos y `?debug=1&seed=55` para diagnóstico separado. Si puerto ocupado, comprobar servicio y registrar URL real; no asumir que otro localhost sirve este checkout.

El ejecutor puede usar fixtures temporales same-origin para controlar reloj/`OfflineAudioContext` y exportar WAV mediante APIs nativas. La incógnita es si el arreglo/mix real cumple niveles y claridad; el éxito se decide con métricas y escucha. Definir antes cómo medir, usar los instrumentos de producción y retirar fixtures/WAV de `src/` antes del cierre. Guardar materiales locales fuera de publicación cuando sirvan a escucha; resultados reales solo en plan 0043. No introducir un comando de test/export inventado antes de crear y comprobar su script.

## Validación, aceptación y evidencia

### Matriz automatizada

| Requisito | Evidencia exigida |
| --- | --- |
| Notas y bajo | 6 estilos × 3 niveles × ciclo de 16 compases: MIDI/frecuencias finitas, duraciones positivas, reposos explícitos, bajo/motivo presentes y armonía construida por intervalos. |
| Reloj/estructura | Cuatro negras por compás, subdivisiones correctas, scheduler a 30/60/120 llamadas/s con mismos onsets; late poll no replay ni start pasado. |
| Buses/mezcla | Aristas instrument→layer→music volume correctas; AudioParam ramps afectan voces activas; usuario mute prevalece sobre eventos. |
| Lifecycle | Inicio/reinicio/pausa/hidden/preview cancel idempotentes, `onended` diferido, cero fuentes activas tras release y ningún crecimiento de arrays de pads/drones/LFO. Presupuesto incluso bajo spam. |
| Lazy/fallback | Carga/sliders/idioma no crean audio; constructor/resume ausentes, rechazados o pendientes no lanzan ni bloquean modo/input. Música desbloqueable con SFX/UI a cero mediante gesto explícito. |
| Adaptación | Fronteras 70/30%, estilos y vida animada irrelevante; timer efectivo, 1–1, heat/hysteresis en ticks, pause/reset/trial y actor correcto. |
| Eventos | Special una vez hit/block/whiff; combo solo conectado/cooldown; ronda/empate/partida/Arcade sin doble remate ni callbacks tardíos. |
| Preferencias/UI | Storage existente válido/inválido/excepción, aleatoria por enfrentamiento, Arcade no persiste selección temporal, ES/EN y preview único. |
| Simulación | Traces de combate y siguiente RNG iguales con música audible, 0%, Web Audio ausente y diferentes render FPS; nunca callbacks audio avanzan estados. |
| Salida offline | Muestras finitas, peak/RMS registrados, caso combinado bajo límite, silencio tras mute/stop. Métricas no equivalen a comodidad o reconocimiento. |

### Checklist real de navegador y escucha

Registrar exclusivamente en `plans/plan_0043_validacion_humana_consolidada.md`: commit/fecha, navegador/version, equipo/salida, idioma, modo/estilo/volúmenes, seed de combate si aplica, escenario, observado y pendiente. No duplicar resultados físicos en este plan.

1. Carga silenciosa, primera interacción, música con combate/UI muteados, preview de los seis estilos y cancelación. Probar guardado/restauración y fallo de storage cuando sea reproducible.
2. Escuchar al menos una frase completa y un ciclo de cada estilo; confirmar bajo, tema, respuesta y motivo identificable. Comparar parejas Bit/Baroque, Neon/Retro y Glitch/Void sin depender solo del tempo.
3. Escuchar nivel 1→2→3 con peligro P1 y CPU, vida estable, 1–1, últimos 10 s y Training untimed. Cambios deben ser perceptibles, sin bombeo repetitivo ni salto tonal inesperado.
4. Special con hit/block/whiff, combos repetidos, empate, win/loss, victoria ajustada y fin de Arcade. SFX deben conservar claridad; remates no duplicarse ni tapar UI.
5. Pause 2–5 s y resume en medio de frase; hidden/return, reinicio/Menu y apertura/cierre de preview. No notas viejas, clicks fuertes ni instrumentos que sigan tras stop/mute.
6. Escuchar en altavoces y auriculares, estéreo/mono y volumen cómodo; comparar trims entre estilos. Volumen 100% es un caso técnico de mezcla, no exige nivel físico incómodo. Registrar si agudos/graves o cortes molestan y ajustar solo parámetros justificados.
7. Revisar ES/EN, toolbar/preview en 1366×768, 390×844 y 844×390 cuando se disponga; Tab/focus y cambio de idioma sin per-frame speech. No afirmar AT sin lector real.
8. Sesión de 20 min con música y combate, seguida de mute/pausa; registrar equipo/DPR/display y presupuesto de nodos, residuos y frame work. Si hay gaps, medir trace antes de añadir cachés/workers.

Aceptación perceptiva mínima: motivo reconocible entre pantallas, seis arreglos distinguibles, transiciones y mute cómodos, y SFX entendibles durante mezcla. Registrar quién realizó la escucha de forma anónima y ajustes derivados; no afirmar preferencia de jugadores sin estudio.

## Riesgos, idempotencia y recuperación

- Recuperar bajo/melodía aumenta energía real de la mezcla: empezar con gains conservadores, medir y ajustar antes de sumar adornos. El compresor no reemplaza headroom.
- Pausa y preview pueden dejar eventos futuros: cursor único, generación de transporte/cancel tokens de sesión y cleanup por fuente; callbacks antiguos no restauran una escena cancelada.
- Clasificación por evento puede cambiar combate si se acopla a render/audio: recoger heat solo en fixed-step/eventos existentes y excluir estado de audio de snapshots/reglas/retos.
- Reloj musical y FPS: AudioParam y timestamps de audio, sin contadores rAF; límites para polls tardíos. Menú/resultados agenda presentación únicamente.
- Tensión demasiado constante: hysteresis, respiros breves y cooldowns; escuchar presión alta sostenida y priorizar quitar adornos antes que nuevos controles.
- Mute/lazy: gain de usuario separado, no iniciar por preferencias/render, y fallback silencioso ante Web Audio inaccesible. Contexto compartido no se cierra automáticamente y no se espera desde gameplay.
- Mantenimiento: corregir helpers existentes y retirar código muerto solo relacionado; no refactorizar input/IA/render ni ejecutar el plan 0052 por asociación.

Cada hito es repetible con las mismas seeds/configuración y reversible mediante su diff. Si falla mezcla, revertir/ajustar gains y efectos del hito correspondiente; si falla transporte, detener playback musical sin alterar combate/SFX hasta corregirlo. Preferencias usan las claves existentes: no migración destructiva. Conservar cambios ajenos. Este plan no autoriza commit/push/publicación.

## Registro de decisiones

- Decisión: sintetizador actual y seis estilos, con eventos por compás, escala explícita y buses conectados.
  Justificación: los recursos ya existen; hace falta composición/ruteo coherentes, no más dependencias o motores.
  Fecha/autor: 2026-10-03, asistente.
- Decisión: reloj de audio para transporte, fixed-step para datos de tensión, RNG exclusivo de música sin persistencia.
  Justificación: sonido estable sin hacer depender combate o elección musical del render, mute o callbacks.
  Fecha/autor: 2026-10-03, asistente.
- Decisión: motivo A–C–E–B–A y estructura inicial de 16 compases con cuatro negras cada uno.
  Justificación: identidad breve y desarrollo dentro de una ronda; notas/arreglo final se ajustan mediante escucha registrada.
  Fecha/autor: 2026-10-03, asistente.
- Decisión: presupuesto musical separado de 24 fuentes y cap SFX existente de 32; adornos tienen menor prioridad.
  Justificación: acotar síntesis sin perder impactos; no afirmar que el cap histórico ya cubre música.
  Fecha/autor: 2026-10-03, asistente.
- Decisión: preferencia y ruta Arcade conservadas; aleatoria una vez por enfrentamiento, preview de 8 s y tema actual no-live.
  Justificación: mejora coherencia y control reutilizando UI/storage, sin ampliar retos ni estadísticas.
  Fecha/autor: 2026-10-03, asistente.
- Decisión: sortear estilo aleatorio desde una secuencia musical de sesión, sin derivarlo del `matchSeed`.
  Justificación: presentación y preferencias musicales no deben depender del seed compartible de combate.
  Fecha/autor: 2026-10-03, asistente.
- Decisión: separar entrega automatizable de aprobación de escucha y dispositivos.
  Justificación: mocks/mediciones offline no demuestran atractivo, comodidad ni compatibilidad física.
  Fecha/autor: 2026-10-03, asistente.
- Decisión: usar un compresor/limitador final compartido entre música y SFX tras medir la mezcla offline a volumen máximo.
  Justificación: el escenario inicial de 32 fuentes SFX simultáneas con música excedió peak 0.98; el limiter mantiene margen y respeta los buses de volumen/ducking.
  Fecha/autor: 2026-10-03, asistente.

## Resultados y retrospectiva

Implementación automatizable entregada en `src/audio.js`, `src/config.js`, `src/game.js`, `src/index.html`, `src/i18n.js` y `src/styles.css`; documentación y regresiones actualizadas. La banda comparte motivo/progresión, seis perfiles, transporte de audio, volumen/capas, adaptación, eventos musicales y preview; selección manual restaura desde storage y el modo aleatorio conserva el mismo estilo entre rondas. El RNG de selección/composición musical queda separado del seed RNG de combate.

Node.js 24.19.0: sintaxis de todos los `src/*.js` y `tests/game.test.js` correcta, 243 pruebas aprobadas y `git diff --check` limpio. Node/mocks comprueban notas/rango, compás, motivo, perfiles, buses, cap/cleanup, scheduler a 30/60/120 llamadas por segundo, pausa/mute/preview, restauración, fronteras de vida/heat/hysteresis, persistencia de estilo y no consumo de simulation RNG. Un fixture same-origin temporal renderizó OfflineAudioContext con compositor/instrumentos reales: seis estilos × tres intensidades con peak/RMS y caso de mezcla máxima; el peak inicial combinado hizo necesaria la salida comprimida compartida y quedó bajo 0.98 después. El detalle numérico se registra solo en plan 0043. Browser smoke de 390×844/1440×900 comprobó selector, preview, toolbar, pausa/menú y ausencia de errores reportados por el panel. El fixture se retiró. No se escucharon los arreglos en forma perceptiva ni se comparó mono/estéreo/hardware, usuarios o AT. No se afirma reconocimiento/comodidad ni se cierra la aceptación perceptiva; completar Hitos 6c/7 según plan 0043.

## Notas de revisión

- 2026-10-03: borrador inicial tras la auditoría musical. Incluye las siete mejoras y corrige la prioridad hacia coherencia/lifecycle antes de arreglos y eventos; diferencia APIs propuestas de símbolos existentes.
- 2026-10-03: revisión final conforme a `PLANS.md`: precisado cursor audible de pausa frente al lookahead y acento inmediato para tempos donde la siguiente semicorchea excede el límite de espera. Archivo comprobado sin errores de whitespace; runtime sin cambios.
- 2026-10-03: ejecución iniciada y automatizable completada; se añadieron regresiones, scheduler/buses/composición/adaptación/UI, browser smoke y renders OfflineAudioContext. La mezcla combinada inicial excedió 0.98 y motivó compresión final compartida; la repetición quedó bajo el límite. La selección aleatoria usa RNG musical independiente del seed de combate. Escucha/dispositivos siguen pendientes en plan 0043, por lo que el estado permanece bloqueado.
- 2026-10-03: se cache-bustearon los recursos versionados y se acortó el resumen del estilo aleatorio tras inspección mobile. Las pruebas nuevas verifican el resultado funcional, pero no se ejecutaron contra la baseline antigua para observar fallos previos.
