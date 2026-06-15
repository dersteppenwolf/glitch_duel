# xkcd KOMBAT

Juego web arcade de pelea estilo stickman/xkcd, implementado con HTML, CSS y JavaScript puro, con renderizado sobre Canvas.

## Tabla De Contenido

- [Estado Del Proyecto](#estado-del-proyecto)
- [Mejoras Recientes Implementadas](#mejoras-recientes-implementadas)
- [Comandos Rapidos](#comandos-rapidos)
- [Prerrequisitos](#prerrequisitos)
- [Como Ejecutar](#como-ejecutar)
- [Validacion](#validacion)
- [Controles](#controles)
- [Arquitectura](#arquitectura)
- [Pruebas](#pruebas)
- [Filosofia De Desarrollo](#filosofia-de-desarrollo)
- [Limitaciones Conocidas](#limitaciones-conocidas)
- [Analisis Actual](#analisis-actual)
- [Sugerencias De Mejora](#sugerencias-de-mejora)
- [Backlog](#backlog)

## Estado Del Proyecto

`xkcd KOMBAT - Arcade VS AI` es un prototipo funcional de combate 1 vs 1 donde el jugador humano se enfrenta a una CPU con comportamiento basico de IA.

Estado actual:

- Juego web estatico sin dependencias externas.
- Menu principal implementado.
- Pantalla de ayuda accesible desde el menu principal.
- Seleccion de dificultad `FACIL`, `NORMAL` y `DIFICIL` desde el menu principal.
- Combate humano contra CPU implementado.
- Diferenciacion visual entre humano y CPU con etiquetas, acentos y detalles propios.
- Sistema de rondas al mejor de 3 implementado.
- Temporizador de 60 segundos por round implementado.
- IA con respuestas contextuales ante ataques, baja vida y distancia real de golpe.
- Combos simples `J, J`, `J, K` y `K, K` implementados.
- Feedback visual de combos con pista de ventana, texto y halo/trail implementado.
- Agacharse implementado con `C`, flecha abajo y boton tactil `CROUCH`.
- Movimiento alternativo con flechas implementado.
- Ataque especial con energia llena implementado en `L`.
- Arenas seleccionables desde el menu principal: cuaderno, cafeteria, laboratorio, reunion presencial y reunion remota.
- Estadisticas locales con victorias, derrotas y rachas.
- Pantalla de fin de juego con opciones `REINICIAR` y `MENU`.
- Controles de teclado y controles tactiles durante la partida.
- Controles moviles responsivos y aviso de orientacion vertical.
- Foco visible, etiquetas ARIA y opcion persistente de reducir movimiento.
- Pausa con `P`, `Esc` o boton `PAUSA` durante la partida.
- Balance base ajustado para diferenciar velocidad, daño, alcance y bloqueo.
- Barras de vida con transicion visual al recibir daño.
- Deteccion de golpes con hitboxes logicas de cuerpo y ataque.
- Indicador central para eventos como `FIGHT!`, `BLOCK` y `K.O.`.
- Canvas responsive con soporte para `devicePixelRatio`.
- Feedback de golpes con sacudida, hit-stop y particulas.
- IA y render de luchadores separados en archivos dedicados.
- Temporizador de round basado en delta time real de `requestAnimationFrame`.
- Pruebas unitarias basicas con `node:test`.

## Mejoras Recientes Implementadas

Las ultimas iteraciones cerraron deuda tecnica y mejoraron la experiencia sin agregar dependencias ni cambiar el flujo base del juego.

Impacto tecnico:

- `src/ai.js` separa la decision de la CPU en `chooseAIAction(...)`, lo que permite probar decisiones clave sin depender de todo el loop del juego.
- `src/fighter_render.js` separa el dibujo del luchador; `Fighter.draw()` queda como fachada y `src/fighter.js` conserva la logica de combate.
- El timer de round ahora usa `deltaMs` derivado de `requestAnimationFrame(timestamp)`, por lo que la duracion del round depende menos del frame rate real.
- `tests/game.test.js` usa helpers locales para iniciar partidas, ubicar luchadores, cargar energia, avanzar frames y simular controles tactiles.
- La validacion automatica cubre los nuevos archivos con `node --check` y mantiene pruebas sobre IA, render delegado, timer, combos, pausa y preferencias.

Impacto en UX:

- El menu principal distribuye mejor descripcion, selectores, resumen de controles, opcion `Reducir movimiento` y estadisticas.
- La pausa muestra informacion util de round, marcador, tiempo, dificultad, arena y controles clave.
- La navegacion por teclado tiene foco visible y los controles principales tienen etiquetas ARIA.
- `Reducir movimiento` persiste en `localStorage` y limita shake, hit-stop y particulas.
- Los controles tactiles usan medidas responsivas con `clamp()` y safe areas para reducir solapamientos en pantallas pequenas.

Alcance que se mantuvo fuera para reducir riesgo:

- Cooldowns, ventanas de combo, hit-stun, hit-stop y timers visuales siguen medidos en frames.
- No se agregaron librerias, build step, modulos ES ni automatizacion externa de navegador.
- No se cambiaron intencionalmente dano, rango, energia ni reglas de victoria.

## Comandos Rapidos

Desde `C:\tmp\game`:

```powershell
python -m http.server 8000
node --check src\config.js
node --check src\audio.js
node --check src\effects.js
node --check src\ai.js
node --check src\fighter_render.js
node --check src\fighter.js
node --check src\game.js
node --test tests\game.test.js
```

Abrir el juego servido localmente:

```text
http://localhost:8000/src/
```

## Prerrequisitos

- Navegador moderno con soporte para HTML5 Canvas y Web Audio API.
- Node.js para ejecutar validacion de sintaxis y pruebas unitarias.
- Python opcional para servir el proyecto con `python -m http.server 8000`.
- No se requiere `npm install`, `package.json`, bundler ni servidor backend.

## Como Ejecutar

### Opcion Simple

Abre directamente el archivo principal en un navegador moderno:

```text
src/index.html
```

En Windows tambien puedes abrirlo con doble clic desde el explorador de archivos:

```text
C:\tmp\game\src\index.html
```

### Opcion Recomendada

Servir la carpeta con un servidor estatico local permite validar el juego desde `http://localhost`.

Desde la carpeta del proyecto:

```powershell
cd C:\tmp\game
```

Si tienes Python instalado:

```powershell
python -m http.server 8000
```

Luego abre en el navegador:

```text
http://localhost:8000/src/
```

Si prefieres usar Node.js:

```powershell
npx http-server . -p 8000
```

Luego abre en el navegador:

```text
http://localhost:8000/src/
```

## Validacion

### Validacion Automatica

Para validar la sintaxis de los archivos JavaScript principales:

```powershell
node --check src\config.js
node --check src\audio.js
node --check src\effects.js
node --check src\ai.js
node --check src\fighter_render.js
node --check src\fighter.js
node --check src\game.js
```

Para ejecutar pruebas unitarias:

```powershell
node --test tests\game.test.js
```

Flujo recomendado antes de cerrar cambios de codigo:

```powershell
node --check src\config.js
node --check src\audio.js
node --check src\effects.js
node --check src\ai.js
node --check src\fighter_render.js
node --check src\fighter.js
node --check src\game.js
node --test tests\game.test.js
```

### Smoke Test Manual

Validar en navegador antes de considerar listo un cambio visual o de jugabilidad:

- Debe aparecer el menu principal al cargar.
- El boton `INICIAR JUEGO` debe comenzar la partida.
- El texto del menu debe verse balanceado y sin amontonarse en desktop o movil.
- El boton `AYUDA` debe mostrar controles, objetivo y consejos sin iniciar partida.
- El boton `VOLVER` debe regresar desde ayuda al menu principal.
- Cambiar la dificultad en el menu debe afectar el comportamiento de la CPU.
- El foco visible debe aparecer al navegar menus con `Tab`.
- El selector `Reducir movimiento` debe persistir y reducir shake/hit-stop visual en impactos.
- El canvas debe cargar correctamente.
- El canvas debe mantenerse proporcionado al redimensionar la ventana.
- Deben aparecer dos personajes stickman.
- El humano debe mostrar etiqueta `HUMANO`, acentos azules y banda; la CPU debe mostrar etiqueta `CPU`, acentos rojos, visor y antena.
- Los controles de teclado deben responder: `A`, `D`, `W`, flechas, `C`, `S`, `J`, `K`, `P` y `Esc`.
- `C` o flecha abajo deben agachar al jugador; `S` debe seguir bloqueando.
- Los combos `J, J`, `J, K` y `K, K` deben aplicar ataques de mayor impacto.
- Los combos deben mostrar pista/feedback visual sin tapar barras, timer ni mensajes centrales.
- Con energia llena, `L` debe lanzar el ataque especial.
- Cambiar la arena en el menu debe cambiar el fondo del combate.
- Las cinco arenas deben verse distintas: cuaderno, cafeteria, laboratorio, reunion presencial y reunion remota.
- Al terminar partidas deben actualizarse las estadisticas locales.
- `P`, `Esc` o `PAUSA` deben pausar la partida, mostrar resumen de round/marcador/tiempo/dificultad/arena, y `RESUMIR` debe continuar.
- El temporizador debe bajar durante `playing` y detenerse en pausa.
- El temporizador debe avanzar en segundos reales incluso si baja el frame rate.
- Los golpes deben reducir la barra de vida del rival.
- Las barras de vida deben mostrar una transicion breve al bajar.
- En telefono vertical debe aparecer una sugerencia para girar el dispositivo.
- Al llegar una vida a cero debe avanzar el marcador de rounds.
- Al ganar 2 rounds debe aparecer la pantalla de fin de juego.
- El boton `REINICIAR` debe iniciar una nueva partida.
- El boton `MENU` debe volver al menu principal.
- En dispositivos tactiles o emulacion movil deben mostrarse los controles en pantalla durante la partida.

### Smoke Test Tecnico Corto

Para validar especificamente las mejoras tecnicas recientes:

- Servir con `python -m http.server 8000` desde `C:\tmp\game`.
- Abrir `http://localhost:8000/src/`.
- Iniciar partida en dificultad `NORMAL` y arena `CUADERNO`.
- Confirmar que el timer baja aproximadamente una unidad por segundo real.
- Pausar con `P` y confirmar que timer, luchadores y CPU se congelan.
- Reanudar con `P` o `RESUMIR` y confirmar que el timer continua.
- Ejecutar `J,J`, `J,K` y `K,K` y confirmar que el feedback visual sigue apareciendo.
- Cambiar el tamaño de la ventana y confirmar que el canvas mantiene proporcion.
- Confirmar que no hay errores visibles en la consola del navegador.

## Controles

### Teclado

La distribucion usa la mano izquierda para movimiento y defensa, y la mano derecha para ataques.

| Accion | Tecla |
| --- | --- |
| Mover izquierda | A / flecha izquierda |
| Mover derecha | D / flecha derecha |
| Saltar | W / flecha arriba |
| Agacharse | C / flecha abajo |
| Bloquear | S |
| Punetazo | J |
| Patada | K |
| Especial | L |
| Pausar / reanudar | P / Esc |

Combos disponibles:

| Combo | Accion |
| --- | --- |
| J, J | Combo rapido de punetazos; menos alcance, buena recuperacion. |
| J, K | Encadena punetazo con patada; mas alcance y daño. |
| K, K | Back kick; patada pesada con mas daño y recuperacion lenta. |

La segunda tecla debe pulsarse rapido, dentro de la ventana de combo. Si esperas demasiado, el juego ejecuta el ataque normal de la tecla presionada.

### Movil

En dispositivos tactiles se muestran botones en pantalla durante la partida para:

- Izquierda
- Derecha
- Saltar
- Agacharse
- Bloquear
- Punetazo
- Patada
- Especial
- Pausa

## Arquitectura

### Estructura Del Proyecto

```text
.
├── .gitignore
├── AGENTS.md
├── Readme.md
├── tests/
│   └── game.test.js
└── src/
    ├── config.js
    ├── audio.js
    ├── effects.js
    ├── ai.js
    ├── fighter_render.js
    ├── fighter.js
    ├── index.html
    ├── styles.css
    └── game.js
```

### Archivos Principales

- `src/index.html`: estructura de la pagina, menu principal, canvas, controles y pantalla de fin de juego.
- `src/styles.css`: layout, estilos del canvas, controles tactiles y modales.
- `src/config.js`: constantes globales, canvas, dimensiones logicas, ataques y dificultad.
- `src/audio.js`: inicializacion de Web Audio y sonidos generados por codigo.
- `src/effects.js`: textos flotantes y particulas de impacto.
- `src/ai.js`: decision de acciones de la CPU segun dificultad, distancia, vida y contexto de ataque.
- `src/fighter_render.js`: dibujo del luchador y feedback visual asociado al estado del personaje.
- `src/fighter.js`: clase `Fighter`, fisica individual, controles, ataques, combos, hitboxes, daño y energia.
- `src/game.js`: estado global, rondas, pausa, temporizador por delta time, render principal, eventos de UI y loop del juego.
- `tests/game.test.js`: pruebas unitarias con mocks de DOM/canvas/audio.
- `AGENTS.md`: instrucciones compactas para futuras sesiones de OpenCode.

### Carga De Scripts

`src/index.html` usa scripts clasicos en orden fijo. Si se agregan nuevos archivos globales, deben cargarse antes del archivo que los consume.

Orden actual:

```html
<script src="config.js"></script>
<script src="audio.js"></script>
<script src="effects.js"></script>
<script src="ai.js"></script>
<script src="fighter_render.js"></script>
<script src="fighter.js"></script>
<script src="game.js"></script>
```

### Flujo Del Juego

1. Al abrir `src/index.html`, aparece el menu principal.
2. El menu muestra el titulo, una descripcion corta, el resumen de controles y el acceso `AYUDA`.
3. El boton `AYUDA` muestra objetivo, controles y consejos sin iniciar la partida.
4. El boton `VOLVER` regresa al menu principal.
5. El selector de dificultad ajusta ritmo, velocidad y agresividad de la CPU.
6. El selector de arena cambia el fondo del combate.
7. El boton `INICIAR JUEGO` crea una nueva partida y oculta el menu.
8. Durante la partida, el jugador controla al luchador humano y la CPU controla al rival.
9. Los golpes y bloqueos cargan energia para el ataque especial.
10. Durante la partida, `P`, `Esc` o `PAUSA` detienen la simulacion y muestran la pantalla de pausa.
11. El boton `RESUMIR` continua la partida desde pausa.
12. Cada round tiene 60 segundos.
13. Cuando un luchador llega a `0%` de vida, gana el round.
14. Si el temporizador llega a cero, gana el round quien tenga mas vida.
15. Si el tiempo termina con la misma vida, el round se repite sin sumar punto.
16. Si nadie llega a 2 rounds ganados, inicia el siguiente round.
17. Al ganar 2 rounds, aparece la pantalla de fin de juego y se actualizan las estadisticas locales.
18. El boton `REINICIAR` empieza una nueva partida desde round 1.
19. El boton `MENU` vuelve al menu principal.

### Estados Del Juego

| Estado | Comportamiento |
| --- | --- |
| `menu` | Muestra el menu principal y detiene la simulacion. |
| `playing` | Actualiza fisica, controles, IA, golpes, efectos y render. |
| `paused` | Detiene fisica, IA, golpes y controles de juego hasta reanudar. |
| `roundOver` | Detiene brevemente la simulacion entre rounds y prepara el siguiente. |
| `gameOver` | Detiene la simulacion y muestra opciones de reinicio o regreso al menu. |

### Logica Principal

El juego define dos luchadores:

- `player1`: jugador humano.
- `player2`: CPU controlada por IA.

Cada luchador maneja estado, posicion, velocidad, vida, ataques, bloqueo, aturdimiento y orientacion hacia el oponente.

La IA decide acciones segun la distancia:

- Distancia larga: acercarse o esperar.
- Distancia media: acercarse, retroceder, saltar o bloquear.
- Distancia corta: atacar, bloquear o retroceder.

El canvas usa coordenadas logicas fijas de `1000x500`. La funcion `resizeCanvas()` adapta el tamaño visible y el backing store segun el viewport y `devicePixelRatio`, pero la simulacion y los futuros hitboxes deben mantenerse en coordenadas logicas.

## Pruebas

Las pruebas no requieren `npm install`, `package.json` ni dependencias externas. El archivo `tests/game.test.js` usa `node:test`, `node:assert` y mocks minimos de DOM, canvas y audio para cargar los scripts de `src/` en Node.

Actualmente cubren:

- Escalado responsive del canvas con `resizeCanvas()`.
- Ataque de punetazo con `J` y aplicacion de daño.
- Ataque de patada con `K` y aplicacion de daño.
- Combos simples y ataque especial con energia.
- Hitboxes que evitan daño cuando el cuerpo queda fuera del area de ataque.
- Bloqueo, daño residual y feedback de impacto reducido.
- Indicador de estado para inicio de combate y bloqueo.
- Transicion de estado entre `menu` y `playing`.
- Apertura y cierre de la pantalla de ayuda desde el menu.
- Pausa, detencion de simulacion y reanudacion de partida.
- Seleccion de dificultad y cambio de parametros de movimiento de la CPU.
- Seleccion de arena y fallback seguro.
- Estadisticas locales de victorias, derrotas y rachas.
- Avance de rounds y finalizacion de partida al ganar 2 rounds.
- Temporizador de round, victoria por vida restante y empate sin puntuacion.
- IA defensiva ante ataques cercanos.
- Animacion visual de barras de vida.
- Aviso de orientacion movil en telefonos verticales.
- Decision de IA separada con escenarios deterministas.
- Delegacion de render del luchador hacia `drawFighter(...)`.
- Temporizador de round basado en delta time.
- Preferencia persistente de reducir movimiento y pausa informativa.

Limitaciones de las pruebas:

- No validan interaccion real en navegador.
- No verifican visualmente el Canvas.
- No reemplazan el smoke test manual para cambios visuales o de experiencia.

## Filosofia De Desarrollo

- Mantener el proyecto como juego web estatico, simple y facil de ejecutar.
- Usar APIs nativas del navegador y de Node.js siempre que sea posible.
- No importar librerias externas ni agregar dependencias salvo que una decision explicita de arquitectura lo justifique.
- Si se propone una dependencia externa, primero debe documentarse el motivo, el impacto en ejecucion local y el cambio de flujo de validacion.
- Mantener los textos de UI en español salvo decision explicita.
- Priorizar cambios pequeños y verificables sobre reestructuraciones grandes.
- Actualizar este README cuando cambien comandos, controles, estados de juego, pruebas o funcionalidades implementadas.

## Funcionalidades Implementadas

- Menu principal.
- Pantalla de ayuda con objetivo, controles y consejos.
- Seleccion de dificultad para la CPU.
- Inicio de partida desde boton.
- Pausa con `P`, `Esc`, boton `PAUSA` y boton `RESUMIR`.
- Sistema de rondas al mejor de 3.
- Temporizador de 60 segundos por round.
- Hitboxes logicas para cuerpo, punetazo y patada.
- Indicador central de estado para `FIGHT!`, `BLOCK` y `K.O.`.
- IA mejorada para bloquear ataques cercanos, retroceder con baja vida y atacar solo si la hitbox conecta.
- Combos simples `J, J`, `J, K` y `K, K`.
- Feedback visual de combos con pista breve, texto propio y halo/trail.
- Agacharse con hitbox baja para esquivar golpes altos.
- Movimiento alternativo con flechas.
- Ataque especial con barra de energia y tecla `L`.
- Arenas seleccionables: cuaderno, cafeteria, laboratorio, reunion presencial y reunion remota.
- Estadisticas locales con `localStorage`.
- Controles moviles responsivos.
- Pausa informativa con round, marcador, tiempo, dificultad, arena y controles clave.
- Foco visible para navegacion por teclado en menus.
- Etiquetas ARIA en canvas, overlays, indicadores y controles tactiles.
- Opcion persistente de reducir movimiento para limitar shake, hit-stop y particulas.
- Aviso de orientacion movil en pantalla vertical.
- Barras de vida animadas.
- Balance de combate con punetazo rapido, patada de mayor recuperacion y daño residual al bloquear.
- Regreso al menu desde pantalla de fin de juego.
- Reinicio de partida.
- Combate humano contra CPU.
- Diferenciacion visual de humano y CPU con etiquetas, colores de acento, banda, visor y antena.
- Controles de teclado.
- Controles tactiles durante la partida.
- Renderizado Canvas.
- Escalado responsive del canvas con soporte para `devicePixelRatio`.
- Sacudida de pantalla, hit-stop y particulas al impactar o bloquear golpes.
- IA y render de luchador separados de la clase principal de combate.
- Temporizador de round en tiempo real con delta time.
- Helpers de pruebas para iniciar partida, cargar energia, avanzar frames y tocar controles.
- Audio basico generado por Web Audio API.
- Pruebas unitarias con `node:test` y mocks de DOM/canvas/audio.

## Tecnologias

- HTML5
- CSS3
- JavaScript puro
- Node.js `node:test`
- Canvas API
- Web Audio API

## Limitaciones Conocidas

- La IA usa reglas y probabilidades; no aprende del jugador.
- Las animaciones de combos y especial reutilizan poses base; los combos se diferencian con texto, halo/trail, daño, rango y recuperacion.
- No existe modo de depuracion visual para hitboxes, energia, estado de IA o datos de round.
- No hay modo entrenamiento para probar rangos, combos o balance sin presion de la CPU.
- El audio sigue siendo basico y no diferencia claramente cada tipo de accion.
- El timer de round usa delta time, pero cooldowns, ventana de combo, hit-stun, hit-stop y timers visuales siguen por frames.
- Las pruebas unitarias no reemplazan validacion visual en navegador.

## Analisis Actual

El juego ya supero la etapa de prototipo minimo: tiene flujo arcade completo, rondas, temporizador, dificultad, arenas, combos, especial, estadisticas locales, feedback visual de golpes y pruebas automatizadas. La prioridad ahora no deberia ser agregar mas sistemas grandes, sino mejorar claridad, expresividad, accesibilidad y herramientas de ajuste.

Estado tecnico actual:

- `src/config.js` concentra constantes de combate, dificultad y arenas, lo que facilita balancear sin tocar el loop principal.
- `src/fighter.js` contiene controles del jugador, combos, hitboxes, daño, energia y estado del personaje.
- `src/ai.js` separa la decision de CPU y `src/fighter_render.js` separa el dibujo del luchador.
- `src/game.js` concentra estado global, flujo de pantallas, rounds, temporizador por delta time, render del HUD, efectos y eventos de entrada.
- `src/styles.css` resuelve menus, overlays y controles moviles; los controles tactiles siguen usando posiciones absolutas calibradas con `clamp()` y safe areas.
- `tests/game.test.js` cubre reglas principales con mocks de DOM/canvas/audio, aunque no reemplaza pruebas reales en navegador.

Fortalezas actuales:

- El nucleo de juego es completo: menu, ayuda, partida, pausa, rounds, temporizador y game over.
- El combate ya usa hitboxes logicas, por lo que se puede balancear con mas precision.
- La arquitectura esta separada en archivos por responsabilidad y sigue sin dependencias externas.
- Las pruebas cubren reglas de combate, estados, temporizador, dificultad, arenas, estadisticas, combos y UI basica simulada.
- Las pruebas ya cubren la decision de IA separada, la delegacion de render y el timer por delta time.
- El README y `AGENTS.md` documentan comandos, filosofia y smoke test manual.

Riesgos actuales:

- Sin depuracion visual, ajustar hitboxes y combos depende de prueba manual a ojo.
- Los efectos sonoros no comunican suficientemente bien que tipo de accion ocurrio.
- El ataque especial existe, pero podria sentirse poco distintivo si no tiene mas feedback audiovisual.
- Las estadisticas locales existen, pero no hay forma visible de reiniciarlas desde la UI.
- La IA es mas creible que antes, pero todavia puede sentirse repetitiva porque no tiene personalidades ni memoria.
- `src/fighter.js` sigue concentrando combate y controles; nuevas mecanicas grandes deberian evitar volver a mezclar render o decision de IA en esa clase.
- Combos, cooldowns, hit-stun y timers visuales siguen usando frames; en equipos lentos pueden variar aunque el timer de round ya use delta time.
- No hay persistencia de preferencias de dificultad o arena; cada carga vuelve a los valores por defecto del HTML.
- La UI tactil funciona, pero sigue requiriendo validacion manual en varios tamaños de pantalla.

Siguiente enfoque recomendado:

- Priorizar herramientas de desarrollo visibles solo bajo toggle, como hitboxes y estado IA.
- Mejorar feedback audiovisual antes de sumar mas mecanicas.
- Agregar modo entrenamiento para validar balance y combos rapidamente.
- Luego ampliar variedad: personalidades de IA, arenas con detalles propios y mejores resultados post-partida.

## Sugerencias De Mejora

Estas sugerencias parten del estado actual del codigo y estan ordenadas por impacto practico. La columna `Estado` refleja la validacion actual contra el codigo. La recomendacion es convertir cada mejora pendiente o parcial sustancial en un ExecPlan dentro de `plans/` antes de implementarla.

### Mejoras Inmediatas

| Mejora | Estado | Que falta o que cambiar | Por que conviene |
| --- | --- | --- | --- |
| Depuracion visual opcional | Pendiente | Agregar toggle de desarrollador para dibujar `getBodyBox()` y `getAttackBox()` sobre el canvas. | Reduce ensayo manual al ajustar daño, alcance, agacharse y combos. |
| Sonidos diferenciados | Parcial | Existen sonidos basicos de golpe/punetazo; faltan sonidos propios para patada, bloqueo, combo, especial, round y victoria. | Mejora lectura del combate sin agregar assets externos. |
| Feedback del especial | Parcial | Ya existe halo azul en el golpe especial; faltan texto propio, particulas azules mas distintivas y sonido dedicado. | Hace que gastar energia completa se sienta como un evento importante. |
| Reset de estadisticas | Pendiente | Agregar boton en menu para borrar `xkcdKombatStats` con confirmacion simple. | Cierra una necesidad visible del sistema de estadisticas actual. |
| Persistir preferencias | Parcial | `Reducir movimiento` ya persiste; faltan dificultad y arena en `localStorage`. | Evita que el jugador repita configuracion en cada carga. |

### Mejoras De Jugabilidad

| Mejora | Estado | Que falta o que cambiar | Por que conviene |
| --- | --- | --- | --- |
| Modo entrenamiento | Pendiente | Permitir CPU inmovil, vida infinita, energia configurable y reinicio rapido de posicion. | Facilita aprender combos y validar balance sin presion. |
| Resultado detallado | Parcial | La pantalla final muestra ganador; faltan dificultad, arena, marcador, tiempo restante, golpes clave y estadisticas actualizadas. | Da cierre arcade y hace mas visible el progreso. |
| Personalidades de IA | Pendiente | Agregar variantes `agresiva`, `defensiva` y `evasiva` independientes de dificultad. | Aumenta variedad sin cambiar controles. |
| Mejor telemetria de combate local | Pendiente | Contar golpes lanzados, aciertos, bloqueos, combos y especiales por partida. | Ayuda a balancear y puede alimentar la pantalla de resultado. |
| Ventana de combo visible opcional | Parcial | Ya existe pista `J...` / `K...`; falta hacerla opcional o convertirla en barra/pulso configurable. | Hace mas facil entender por que un combo salio o fallo. |

### Mejoras Tecnicas

| Mejora | Estado | Resultado | Por que conviene |
| --- | --- | --- | --- |
| Separar dibujo del luchador | Implementado | Implementado con `src/fighter_render.js` y `Fighter.draw()` como fachada. | `src/fighter.js` queda mas facil de modificar sin tocar logica de combate. |
| Separar IA | Implementado | Implementado con `chooseAIAction(...)` en `src/ai.js`. | Permite probar la IA con menos mocks y agregar personalidades con menor riesgo. |
| Temporizador basado en delta time | Implementado parcial por alcance | Implementado para el round timer con `requestAnimationFrame(timestamp)`; cooldowns, combo window y timers visuales siguen por frames. | Hace la duracion del round mas estable cuando el frame rate no es exactamente 60 FPS. |
| Fixtures de pruebas | Implementado | Implementados helpers locales para iniciar partida, cargar energia y avanzar frames. | Reduce duplicacion en `tests/game.test.js` a medida que crezcan los casos. |
| Prueba smoke ligera en navegador | Implementado | Documentada como recorrido tecnico corto. | Cubre lo que Node no puede validar visualmente. |

### Mejoras De UX Y Accesibilidad

| Mejora | Estado | Resultado | Por que conviene |
| --- | --- | --- | --- |
| Navegacion por teclado en menus | Implementado | Implementado con foco visible para botones, selects, inputs y controles tactiles. | Mejora accesibilidad sin afectar combate. |
| Etiquetas ARIA | Implementado | Implementado en canvas, overlays, indicadores y botones tactiles. | Ayuda a tecnologias asistivas y documenta mejor la intencion de controles. |
| Pausa mas informativa | Implementado | Implementado con controles clave, dificultad, arena, marcador, round y tiempo. | Convierte la pausa en una referencia rapida durante la partida. |
| Ajuste de controles tactiles | Implementado | Implementado con zonas mas adaptables, `clamp()` y safe areas. | Reduce errores de input en movil. |
| Opcion de reducir movimiento | Implementado | Implementado con preferencia persistente en `localStorage` para limitar shake, hit-stop y particulas. | Mejora comodidad y accesibilidad. |

### Recomendacion De Orden

1. Depuracion visual opcional.
2. Completar sonidos diferenciados y feedback del especial.
3. Reset de estadisticas y persistencia de dificultad/arena.
4. Modo entrenamiento.
5. Resultado detallado con telemetria local de combate.
6. Personalidades de IA.
7. Mantener IA/render separados cuando futuras mejoras toquen esas areas.

## Backlog

Esta lista funciona como backlog inicial para evolucionar el prototipo hacia un juego mas completo.

### Completadas

| Mejora | Resultado |
| --- | --- |
| Menu principal | Implementado con titulo, descripcion, controles y boton `INICIAR JUEGO`. |
| Pantalla de ayuda | Implementada con objetivo, controles, consejos y boton `VOLVER`. |
| Pausa | Implementada con `P`, `Esc`, boton `PAUSA`, overlay y boton `RESUMIR`. |
| Seleccion de dificultad | Implementada con niveles `FACIL`, `NORMAL` y `DIFICIL` que ajustan la IA. |
| Ajuste de balance | Implementado con valores centralizados de daño, rango, cooldown y bloqueo. |
| Hitboxes reales | Implementadas para cuerpo, punetazo y patada en coordenadas logicas. |
| Indicador de estado | Implementado con mensajes centrales `FIGHT!`, `BLOCK` y `K.O.`. |
| Sistema de rondas | Implementado al mejor de 3 con marcador e inicio automatico del siguiente round. |
| Temporizador | Implementado con 60 segundos por round, victoria por vida restante y empate sin punto. |
| IA mejorada | Implementada con bloqueo ante ataques cercanos, retirada con baja vida y ataques condicionados por hitbox. |
| Controles moviles responsivos | Implementados con tamaños adaptativos para pantallas pequeñas. |
| Animacion de vida | Implementada con transicion visual de barras de vida hacia el valor real. |
| Orientacion movil | Implementada con aviso para girar el telefono en vertical durante la partida. |
| Combos simples | Implementados con `J, J`, `J, K` y `K, K`. |
| Visualizacion de combos | Implementada con pista de ventana, textos `COMBO x2`, `PUNCH+KICK`, `BACK KICK` y halo/trail breve. |
| Agacharse | Implementado con `C`, flecha abajo y boton tactil `CROUCH`; reduce la hitbox vertical. |
| Movimiento con flechas | Implementado con flechas izquierda, derecha y arriba como alternativa a `A`, `D` y `W`. |
| Ataque especial | Implementado con energia llena, tecla `L` y boton tactil `SPECIAL`. |
| Arenas diferentes | Implementadas con seleccion de cuaderno, cafeteria, laboratorio, reunion presencial y reunion remota. |
| Detalles por arena | Implementados con fondos tematicos propios para cuaderno, cafeteria, laboratorio, reunion presencial y reunion remota. |
| Estadisticas locales | Implementadas con victorias, derrotas, racha actual y mejor racha en `localStorage`. |
| Navegacion post-partida | Implementados botones `REINICIAR` y `MENU` en la pantalla de fin de juego. |
| Feedback de golpes | Implementado con shake del canvas, hit-stop breve y particulas/lineas de impacto. |
| Mejor escalado del canvas | Implementado con resize responsive y backing store ajustado por `devicePixelRatio`. |
| UX y accesibilidad | Implementado foco visible, ARIA, pausa informativa, controles tactiles ajustados y reduccion de movimiento. |
| Mejoras tecnicas | Implementadas con IA/render separados, timer por delta time, fixtures de pruebas y smoke tecnico documentado. |
| Layout del menu principal | Implementado con distribucion mas clara para selectores, ayuda, controles, reduccion de movimiento y estadisticas. |
| Diferenciacion de personajes | Implementada con etiquetas `HUMANO`/`CPU`, acentos azules/rojos y detalles de banda, visor y antena. |

### Prioridad Alta

| Mejora | Objetivo | Beneficio |
| --- | --- | --- |
| Depuracion visual opcional | Agregar un modo para dibujar hitboxes y puntos de impacto. | Acelera el desarrollo de combate sin afectar el modo normal. |
| Completar sonidos diferenciados | Agregar sonidos propios para patada, bloqueo, combo, especial, round y victoria. | Mejora claridad audiovisual. |
| Modo entrenamiento | Permitir probar golpes contra una CPU inmovil o con vida infinita. | Facilita ajustar controles, rangos y balance. |

### Prioridad Media

| Mejora | Objetivo | Beneficio |
| --- | --- | --- |
| Completar pantalla de resultado | Mostrar dificultad, arena, marcador, tiempo restante, golpes clave y estadisticas actualizadas. | Cierra mejor la experiencia arcade. |
| Reinicio de estadisticas | Agregar boton para borrar victorias, derrotas y rachas guardadas. | Da control al jugador sobre datos locales. |
| Completar persistencia de preferencias | Guardar dificultad y arena seleccionadas entre sesiones. | Reduce friccion al volver al juego. |
| Personalidades de IA | Agregar estilos agresivo, defensivo y balanceado ademas de dificultad. | Aumenta rejugabilidad y variedad del rival. |
| Completar feedback del especial | Agregar texto, particulas y sonido propios al especial. | Hace que gastar energia se sienta mas satisfactorio. |

### Prioridad Baja

| Mejora | Objetivo | Beneficio |
| --- | --- | --- |
| Combos adicionales | Agregar variantes como `K, J`, ataque aereo o combo con especial. | Amplia profundidad sin rehacer el sistema. |
| Balance avanzado | Ajustar energia, daño y cooldown por dificultad o arena. | Permite mayor control del ritmo de combate. |

### Orden Recomendado De Implementacion

1. Depuracion visual opcional.
2. Completar sonidos diferenciados y feedback del especial.
3. Modo entrenamiento.
4. Completar pantalla de resultado detallada.
5. Reinicio de estadisticas.

Este orden prioriza mejoras visibles para el jugador sin reescribir completamente la arquitectura actual.
