# xkcd KOMBAT

Juego web arcade de pelea estilo stickman/xkcd, implementado con HTML, CSS y JavaScript puro, con renderizado sobre Canvas.

## Tabla De Contenido

- [Estado Del Proyecto](#estado-del-proyecto)
- [Comandos Rapidos](#comandos-rapidos)
- [Prerrequisitos](#prerrequisitos)
- [Como Ejecutar](#como-ejecutar)
- [Validacion](#validacion)
- [Controles](#controles)
- [Arquitectura](#arquitectura)
- [Pruebas](#pruebas)
- [Filosofia De Desarrollo](#filosofia-de-desarrollo)
- [Limitaciones Conocidas](#limitaciones-conocidas)
- [Backlog](#backlog)

## Estado Del Proyecto

`xkcd KOMBAT - Arcade VS AI` es un prototipo funcional de combate 1 vs 1 donde el jugador humano se enfrenta a una CPU con comportamiento basico de IA.

Estado actual:

- Juego web estatico sin dependencias externas.
- Menu principal implementado.
- Pantalla de ayuda accesible desde el menu principal.
- Seleccion de dificultad `FACIL`, `NORMAL` y `DIFICIL` desde el menu principal.
- Combate humano contra CPU implementado.
- Sistema de rondas al mejor de 3 implementado.
- Temporizador de 60 segundos por round implementado.
- IA con respuestas contextuales ante ataques, baja vida y distancia real de golpe.
- Combos simples `J, J` y `J, K` implementados.
- Ataque especial con energia llena implementado en `L`.
- Arenas seleccionables desde el menu principal.
- Estadisticas locales con victorias, derrotas y rachas.
- Pantalla de fin de juego con opciones `REINICIAR` y `MENU`.
- Controles de teclado y controles tactiles durante la partida.
- Controles moviles responsivos y aviso de orientacion vertical.
- Pausa con `P`, `Esc` o boton `PAUSA` durante la partida.
- Balance base ajustado para diferenciar velocidad, daño, alcance y bloqueo.
- Barras de vida con transicion visual al recibir daño.
- Deteccion de golpes con hitboxes logicas de cuerpo y ataque.
- Indicador central para eventos como `FIGHT!`, `BLOCK` y `K.O.`.
- Canvas responsive con soporte para `devicePixelRatio`.
- Feedback de golpes con sacudida, hit-stop y particulas.
- Pruebas unitarias basicas con `node:test`.

## Comandos Rapidos

Desde `C:\tmp\game`:

```powershell
python -m http.server 8000
node --check src\config.js
node --check src\audio.js
node --check src\effects.js
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
node --check src\fighter.js
node --check src\game.js
node --test tests\game.test.js
```

### Smoke Test Manual

Validar en navegador antes de considerar listo un cambio visual o de jugabilidad:

- Debe aparecer el menu principal al cargar.
- El boton `INICIAR JUEGO` debe comenzar la partida.
- El boton `AYUDA` debe mostrar controles, objetivo y consejos sin iniciar partida.
- El boton `VOLVER` debe regresar desde ayuda al menu principal.
- Cambiar la dificultad en el menu debe afectar el comportamiento de la CPU.
- El canvas debe cargar correctamente.
- El canvas debe mantenerse proporcionado al redimensionar la ventana.
- Deben aparecer dos personajes stickman.
- Los controles de teclado deben responder: `A`, `D`, `W`, `S`, `J`, `K`, `P` y `Esc`.
- Los combos `J, J` y `J, K` deben aplicar ataques de mayor impacto.
- Con energia llena, `L` debe lanzar el ataque especial.
- Cambiar la arena en el menu debe cambiar el fondo del combate.
- Al terminar partidas deben actualizarse las estadisticas locales.
- `P`, `Esc` o `PAUSA` deben pausar la partida; `RESUMIR` debe continuar.
- El temporizador debe bajar durante `playing` y detenerse en pausa.
- Los golpes deben reducir la barra de vida del rival.
- Las barras de vida deben mostrar una transicion breve al bajar.
- En telefono vertical debe aparecer una sugerencia para girar el dispositivo.
- Al llegar una vida a cero debe avanzar el marcador de rounds.
- Al ganar 2 rounds debe aparecer la pantalla de fin de juego.
- El boton `REINICIAR` debe iniciar una nueva partida.
- El boton `MENU` debe volver al menu principal.
- En dispositivos tactiles o emulacion movil deben mostrarse los controles en pantalla durante la partida.

## Controles

### Teclado

La distribucion usa la mano izquierda para movimiento y defensa, y la mano derecha para ataques.

| Accion | Tecla |
| --- | --- |
| Mover izquierda | A |
| Mover derecha | D |
| Saltar | W |
| Bloquear | S |
| Punetazo | J |
| Patada | K |
| Especial | L |
| Pausar / reanudar | P / Esc |

### Movil

En dispositivos tactiles se muestran botones en pantalla durante la partida para:

- Izquierda
- Derecha
- Saltar
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
- `src/fighter.js`: clase `Fighter`, fisica individual, IA, ataques, hitboxes y dibujo del luchador.
- `src/game.js`: estado global, rondas, pausa, render principal, eventos de UI y loop del juego.
- `tests/game.test.js`: pruebas unitarias con mocks de DOM/canvas/audio.
- `AGENTS.md`: instrucciones compactas para futuras sesiones de OpenCode.

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
- Combos simples `J, J` y `J, K`.
- Ataque especial con barra de energia y tecla `L`.
- Arenas seleccionables: cuaderno, terminal y laboratorio.
- Estadisticas locales con `localStorage`.
- Controles moviles responsivos.
- Aviso de orientacion movil en pantalla vertical.
- Barras de vida animadas.
- Balance de combate con punetazo rapido, patada de mayor recuperacion y daño residual al bloquear.
- Regreso al menu desde pantalla de fin de juego.
- Reinicio de partida.
- Combate humano contra CPU.
- Controles de teclado.
- Controles tactiles durante la partida.
- Renderizado Canvas.
- Escalado responsive del canvas con soporte para `devicePixelRatio`.
- Sacudida de pantalla, hit-stop y particulas al impactar o bloquear golpes.
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
- Las pruebas unitarias no reemplazan validacion visual en navegador.

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
| Combos simples | Implementados con `J, J` y `J, K`. |
| Ataque especial | Implementado con energia llena, tecla `L` y boton tactil `SPECIAL`. |
| Arenas diferentes | Implementadas con seleccion de cuaderno, terminal y laboratorio. |
| Estadisticas locales | Implementadas con victorias, derrotas, racha actual y mejor racha en `localStorage`. |
| Navegacion post-partida | Implementados botones `REINICIAR` y `MENU` en la pantalla de fin de juego. |
| Feedback de golpes | Implementado con shake del canvas, hit-stop breve y particulas/lineas de impacto. |
| Mejor escalado del canvas | Implementado con resize responsive y backing store ajustado por `devicePixelRatio`. |

### Prioridad Baja

| Mejora | Objetivo | Beneficio |
| --- | --- | --- |
| Sonidos diferenciados | Usar sonidos distintos para punetazo, patada, bloqueo y victoria. | Mejora claridad audiovisual. |
| Modo entrenamiento | Permitir probar golpes contra una CPU inmovil o con vida infinita. | Facilita ajustar controles, rangos y balance. |
| Depuracion visual opcional | Agregar un modo para dibujar hitboxes y puntos de impacto. | Acelera el desarrollo de combate sin afectar el modo normal. |

### Orden Recomendado De Implementacion

1. Sonidos diferenciados.
2. Modo entrenamiento.
3. Depuracion visual opcional.

Este orden prioriza mejoras visibles para el jugador sin reescribir completamente la arquitectura actual.
