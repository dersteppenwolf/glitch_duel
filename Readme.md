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
- Pantalla de fin de juego con opciones `REINICIAR` y `MENU`.
- Controles de teclado y controles tactiles durante la partida.
- Pausa con `P`, `Esc` o boton `PAUSA` durante la partida.
- Canvas responsive con soporte para `devicePixelRatio`.
- Feedback de golpes con sacudida, hit-stop y particulas.
- Pruebas unitarias basicas con `node:test`.

## Comandos Rapidos

Desde `C:\tmp\game`:

```powershell
python -m http.server 8000
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

Para validar la sintaxis del JavaScript:

```powershell
node --check src\game.js
```

Para ejecutar pruebas unitarias:

```powershell
node --test tests\game.test.js
```

Flujo recomendado antes de cerrar cambios de codigo:

```powershell
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
- `P`, `Esc` o `PAUSA` deben pausar la partida; `RESUMIR` debe continuar.
- Los golpes deben reducir la barra de vida del rival.
- Al llegar una vida a cero debe aparecer la pantalla de fin de juego.
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
| Pausar / reanudar | P / Esc |

### Movil

En dispositivos tactiles se muestran botones en pantalla durante la partida para:

- Izquierda
- Derecha
- Saltar
- Bloquear
- Punetazo
- Patada
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
    ├── index.html
    ├── styles.css
    └── game.js
```

### Archivos Principales

- `src/index.html`: estructura de la pagina, menu principal, canvas, controles y pantalla de fin de juego.
- `src/styles.css`: layout, estilos del canvas, controles tactiles y modales.
- `src/game.js`: logica del juego, fisica, IA, audio, controles, renderizado y escalado responsive.
- `tests/game.test.js`: pruebas unitarias con mocks de DOM/canvas/audio.
- `AGENTS.md`: instrucciones compactas para futuras sesiones de OpenCode.

### Flujo Del Juego

1. Al abrir `src/index.html`, aparece el menu principal.
2. El menu muestra el titulo, una descripcion corta, el resumen de controles y el acceso `AYUDA`.
3. El boton `AYUDA` muestra objetivo, controles y consejos sin iniciar la partida.
4. El boton `VOLVER` regresa al menu principal.
5. El selector de dificultad ajusta ritmo, velocidad y agresividad de la CPU.
6. El boton `INICIAR JUEGO` crea una nueva partida y oculta el menu.
7. Durante la partida, el jugador controla al luchador humano y la CPU controla al rival.
8. Durante la partida, `P`, `Esc` o `PAUSA` detienen la simulacion y muestran la pantalla de pausa.
9. El boton `RESUMIR` continua la partida desde pausa.
10. Cuando un luchador llega a `0%` de vida, aparece la pantalla de fin de juego.
11. El boton `REINICIAR` empieza una partida nueva inmediatamente.
12. El boton `MENU` vuelve al menu principal.

### Estados Del Juego

| Estado | Comportamiento |
| --- | --- |
| `menu` | Muestra el menu principal y detiene la simulacion. |
| `playing` | Actualiza fisica, controles, IA, golpes, efectos y render. |
| `paused` | Detiene fisica, IA, golpes y controles de juego hasta reanudar. |
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

Las pruebas no requieren `npm install`, `package.json` ni dependencias externas. El archivo `tests/game.test.js` usa `node:test`, `node:assert` y mocks minimos de DOM, canvas y audio para cargar `src/game.js` en Node.

Actualmente cubren:

- Escalado responsive del canvas con `resizeCanvas()`.
- Ataque de punetazo con `J` y aplicacion de daño.
- Ataque de patada con `K` y aplicacion de daño.
- Bloqueo, vida conservada y feedback de impacto reducido.
- Transicion de estado entre `menu` y `playing`.
- Apertura y cierre de la pantalla de ayuda desde el menu.
- Pausa, detencion de simulacion y reanudacion de partida.
- Seleccion de dificultad y cambio de parametros de movimiento de la CPU.

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

- La deteccion de golpes usa distancia simple, no hitboxes detalladas.
- La IA es probabilistica y no aprende del jugador.
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
| Navegacion post-partida | Implementados botones `REINICIAR` y `MENU` en la pantalla de fin de juego. |
| Feedback de golpes | Implementado con shake del canvas, hit-stop breve y particulas/lineas de impacto. |
| Mejor escalado del canvas | Implementado con resize responsive y backing store ajustado por `devicePixelRatio`. |

### Prioridad Alta

| Mejora | Objetivo | Beneficio |
| --- | --- | --- |
| Ajuste de balance | Revisar daño, rango, cooldown y bloqueo para punetazo y patada. | Hace que el combate se sienta mas justo y expresivo. |

### Prioridad Media

| Mejora | Objetivo | Beneficio |
| --- | --- | --- |
| Hitboxes reales | Reemplazar la deteccion por distancia con cajas de cuerpo, punetazo, patada y bloqueo. | Combate mas justo y predecible. |
| Sistema de rondas | Implementar mejor de 3, marcador y reinicio entre rondas. | Da estructura arcade al combate. |
| Temporizador | Agregar limite de tiempo por round. | Evita partidas demasiado largas y permite ganar por vida restante. |
| IA mejorada | Hacer que la CPU ataque solo en rango, bloquee ataques y retroceda con baja vida. | Rival mas creible y menos aleatorio. |
| Controles moviles responsivos | Ajustar tamanos y posicion de botones segun orientacion y pantalla. | Mejor jugabilidad tactil. |
| Indicador de estado | Mostrar mensajes como `FIGHT!`, `K.O.`, `BLOCK` o `ROUND`. | Mejora claridad durante transiciones y momentos importantes. |
| Animacion de vida | Hacer que las barras de vida bajen con una transicion breve. | Da mejor feedback visual al recibir golpes. |
| Orientacion movil | Detectar pantalla vertical y sugerir girar el dispositivo. | Mejora la experiencia tactil en telefonos. |

### Prioridad Baja

| Mejora | Objetivo | Beneficio |
| --- | --- | --- |
| Combos simples | Agregar secuencias como `J, J` o `J, K`. | Aumenta profundidad del combate. |
| Ataque especial | Agregar barra de energia y ataque con cooldown alto. | Da variedad y momentos decisivos. |
| Arenas diferentes | Crear fondos alternativos como cuaderno, laboratorio o terminal. | Mejora identidad visual y rejugabilidad. |
| Estadisticas locales | Guardar victorias, derrotas y mejor racha con `localStorage`. | Da progreso persistente sin backend. |
| Sonidos diferenciados | Usar sonidos distintos para punetazo, patada, bloqueo y victoria. | Mejora claridad audiovisual. |
| Modo entrenamiento | Permitir probar golpes contra una CPU inmovil o con vida infinita. | Facilita ajustar controles, rangos y balance. |
| Depuracion visual opcional | Agregar un modo para dibujar hitboxes y puntos de impacto. | Acelera el desarrollo de combate sin afectar el modo normal. |

### Orden Recomendado De Implementacion

1. Ajuste de balance.
2. Hitboxes reales.
3. Indicador de estado.
4. Sistema de rondas.
5. Temporizador.

Este orden prioriza mejoras visibles para el jugador sin reescribir completamente la arquitectura actual.
