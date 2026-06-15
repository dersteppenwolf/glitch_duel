# xkcd KOMBAT

Juego web arcade de pelea estilo stickman/xkcd, implementado con HTML, CSS y JavaScript puro, con renderizado sobre Canvas.

## Descripcion

`xkcd KOMBAT - Arcade VS AI` es un prototipo de combate 1 vs 1 donde el jugador humano se enfrenta a una CPU con comportamiento basico de IA.

Estado actual: el juego inicia en un menu principal, permite comenzar una partida, muestra pantalla de fin de juego al derrotar a un luchador y permite reiniciar o volver al menu.

El juego incluye:

- Menu principal con resumen de controles.
- Personajes tipo stickman dibujados en Canvas.
- Movimiento lateral, salto, bloqueo, punetazo y patada.
- IA basada en distancia al jugador.
- Barras de vida.
- Textos flotantes de impacto.
- Sonidos generados con Web Audio API.
- Controles de teclado y controles tactiles para dispositivos moviles.

## Flujo Del Juego

1. Al abrir `src/index.html`, aparece el menu principal.
2. El menu muestra el titulo, una descripcion corta y el resumen de controles.
3. El boton `INICIAR JUEGO` crea una nueva partida y oculta el menu.
4. Durante la partida, el jugador controla al luchador humano y la CPU controla al rival.
5. Cuando un luchador llega a `0%` de vida, aparece la pantalla de fin de juego.
6. El boton `REINICIAR` empieza una partida nueva inmediatamente.
7. El boton `MENU` vuelve al menu principal.

## Como Ejecutar

No requiere instalacion ni dependencias externas.

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

## Validacion Local

Para validar la sintaxis del JavaScript con Node.js:

```powershell
node --check src\game.js
```

Para validar el comportamiento en navegador:

- Debe aparecer el menu principal al cargar.
- El boton `INICIAR JUEGO` debe comenzar la partida.
- El canvas debe cargar correctamente.
- Deben aparecer dos personajes stickman.
- Los controles de teclado deben responder: `A`, `D`, `W`, `S`, `F`, `G`.
- Los golpes deben reducir la barra de vida del rival.
- Al llegar una vida a cero debe aparecer la pantalla de fin de juego.
- El boton `REINICIAR` debe iniciar una nueva partida.
- El boton `MENU` debe volver al menu principal.
- En dispositivos tactiles o emulacion movil deben mostrarse los controles en pantalla.

## Controles

### Teclado

| Accion | Tecla |
| --- | --- |
| Mover izquierda | A |
| Mover derecha | D |
| Saltar | W |
| Bloquear | S |
| Punetazo | F |
| Patada | G |

### Movil

En dispositivos tactiles se muestran botones en pantalla durante la partida para:

- Izquierda
- Derecha
- Saltar
- Bloquear
- Punetazo
- Patada

## Estructura Del Proyecto

```text
.
├── Readme.md
└── src/
    ├── index.html
    ├── styles.css
    └── game.js
```

## Archivos Principales

La aplicacion esta separada en tres archivos dentro de `src/`:

- `index.html`: estructura de la pagina, menu principal, canvas, controles y pantalla de fin de juego.
- `styles.css`: layout, estilos del canvas, controles tactiles y modal de fin de juego.
- `game.js`: logica del juego, fisica, IA, audio, controles y renderizado.

## Logica Principal

El juego define dos luchadores:

- `player1`: jugador humano.
- `player2`: CPU controlada por IA.

Cada luchador maneja estado, posicion, velocidad, vida, ataques, bloqueo, aturdimiento y orientacion hacia el oponente.

La IA decide acciones segun la distancia:

- Distancia larga: acercarse o esperar.
- Distancia media: acercarse, retroceder, saltar o bloquear.
- Distancia corta: atacar, bloquear o retroceder.

El estado general del juego se controla con `gameState`:

- `menu`: muestra el menu principal y detiene la simulacion.
- `playing`: actualiza fisica, controles, IA, golpes y render.
- `gameOver`: detiene la simulacion y muestra opciones de reinicio o regreso al menu.

## Funcionalidades Implementadas

- Menu principal.
- Inicio de partida desde boton.
- Regreso al menu desde pantalla de fin de juego.
- Reinicio de partida.
- Combate humano contra CPU.
- Controles de teclado.
- Controles tactiles durante la partida.
- Renderizado Canvas.
- Audio basico generado por Web Audio API.

## Tecnologias

- HTML5
- CSS3
- JavaScript puro
- Canvas API
- Web Audio API

## Limitaciones Conocidas

- La deteccion de golpes usa distancia simple, no hitboxes detalladas.
- La IA es probabilistica y no aprende del jugador.
- El canvas usa resolucion logica fija de `1000x500`.
- No hay pausa ni seleccion de dificultad.

## Mejoras Sugeridas

Esta lista funciona como backlog inicial para evolucionar el prototipo hacia un juego mas completo.

### Completadas

| Mejora | Resultado |
| --- | --- |
| Menu principal | Implementado con titulo, descripcion, controles y boton `INICIAR JUEGO`. |
| Navegacion post-partida | Implementados botones `REINICIAR` y `MENU` en la pantalla de fin de juego. |

### Prioridad Alta

| Mejora | Objetivo | Beneficio |
| --- | --- | --- |
| Pausa | Permitir pausar con `P`, `Esc` o un boton tactil. | Mejora la experiencia en sesiones largas y en movil. |
| Seleccion de dificultad | Configurar niveles facil, normal y dificil para la CPU. | Permite adaptar el reto a distintos jugadores. |
| Feedback de golpes | Agregar shake, hit-stop breve, particulas o lineas de impacto. | Hace que los ataques se sientan mas fuertes y claros. |
| Mejor escalado del canvas | Adaptar el render a pantallas pequenas y `devicePixelRatio`. | Mejora nitidez y jugabilidad en desktop y movil. |

### Prioridad Media

| Mejora | Objetivo | Beneficio |
| --- | --- | --- |
| Hitboxes reales | Reemplazar la deteccion por distancia con cajas de cuerpo, punetazo, patada y bloqueo. | Combate mas justo y predecible. |
| Sistema de rondas | Implementar mejor de 3, marcador y reinicio entre rondas. | Da estructura arcade al combate. |
| Temporizador | Agregar limite de tiempo por round. | Evita partidas demasiado largas y permite ganar por vida restante. |
| IA mejorada | Hacer que la CPU ataque solo en rango, bloquee ataques y retroceda con baja vida. | Rival mas creible y menos aleatorio. |
| Controles moviles responsivos | Ajustar tamanos y posicion de botones segun orientacion y pantalla. | Mejor jugabilidad tactil. |

### Prioridad Baja

| Mejora | Objetivo | Beneficio |
| --- | --- | --- |
| Combos simples | Agregar secuencias como `F, F` o `F, G`. | Aumenta profundidad del combate. |
| Ataque especial | Agregar barra de energia y ataque con cooldown alto. | Da variedad y momentos decisivos. |
| Arenas diferentes | Crear fondos alternativos como cuaderno, laboratorio o terminal. | Mejora identidad visual y rejugabilidad. |
| Estadisticas locales | Guardar victorias, derrotas y mejor racha con `localStorage`. | Da progreso persistente sin backend. |
| Sonidos diferenciados | Usar sonidos distintos para punetazo, patada, bloqueo y victoria. | Mejora claridad audiovisual. |

### Orden Recomendado De Implementacion

1. Pausa.
2. Seleccion de dificultad.
3. Feedback de golpes.
4. Escalado responsive del canvas.
5. Hitboxes reales.
6. Sistema de rondas.

Este orden prioriza mejoras visibles para el jugador sin reescribir completamente la arquitectura actual.
