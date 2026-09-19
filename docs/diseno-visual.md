# Focus — Diseño visual

> **Lector previsto:** una instancia de Claude sin contexto previo.
> **Alcance:** paleta, tipografía y mascota. Lo que se ve, no dónde va cada cosa.
> Qué pantallas existen y cómo se navega: `flujo-pantallas.md`. Cómo se implementa Tailwind: `frontend-arquitectura.md` §9.
> **Creado:** 2026-09-17.
> Si una instrucción directa de Jason contradice este archivo, gana Jason.

---

## 1. Paleta — CERRADA (2026-09-17)

Elegida por Jason. Salió de la "Variante 2 (cálida y amigable)" generada en Figma, con cuatro tokens corregidos, y de esas correcciones se eligió la **sub-variante B, neutro equilibrado**.

Tema **oscuro únicamente**. No hay tema claro definido ni decidido.

| Token | Hex | Contraste sobre `#0F1A30` | Para qué |
|---|---|---|---|
| `fondo` | `#0F1A30` | — | Fondo de la app. |
| `superficie` | `#1A2744` | — | Tarjetas, paneles. |
| `superficie-elevada` | `#243559` | — | Lo que flota sobre una superficie. |
| `borde` | `#2D4070` | — | Bordes y separadores. |
| `texto-primario` | `#F0EDE6` | 14.8:1 | Texto principal. Blanco cálido, no blanco puro. |
| `texto-secundario` | `#8DAAB8` | 7.1:1 | Texto de apoyo. |
| `texto-tenue` | `#6A90A6` | 5.1:1 | Metadatos, notas al pie. |
| `acento` | `#F59E0B` | 8.1:1 | Acción principal. El naranja manda. |
| `acento-hover` | `#FBBF24` | 10.4:1 | Estado hover del acento. |
| `acento-suave` | `#1C1F38` | — | Fondo teñido para zonas de acento. |
| `exito` | `#52B894` | 7.1:1 | Meta cumplida, confirmaciones. |
| `advertencia` | `#45B5D4` | 7.3:1 | Avisos. **Ver §1.2.** |
| `peligro` | `#FC8181` | 7.1:1 | Errores, acciones destructivas. |

Estos valores van a `@theme` en el CSS, no a un `tailwind.config.js` (Tailwind 4, `frontend-arquitectura.md` §9).

### 1.1 Qué se corrigió y por qué

La primera versión de la Variante 2 tenía cuatro defectos. Quedan escritos para no repetirlos:

1. **Neutros beige (`#B8A99A`, `#7A6B5E`) sobre fondo azul.** Choque de temperatura: se leía sucio. Además `texto-tenue` quedaba en 3.4:1, debajo del mínimo AA. Ahora son neutros azulados y cumplen.
2. **`advertencia` `#FCD34D` era casi igual al `acento` `#F59E0B`.** Un aviso al lado de un botón no se distinguía.
3. **`acento-suave` `#3A2608` era naranja sobre negro.** Sobre azul se veía como una mancha marrón.
4. **`exito` `#6EE7B7` era un menta muy brillante** que competía con el acento por la atención.

Las otras dos sub-variantes de neutro, descartadas: **A, casi azul** (`#90AECB` / `#6389B5`) y **C, casi gris** (`#9AACB4` / `#7A8A90`).

### 1.2 Pendiente de la paleta

`advertencia` quedó celeste (`#45B5D4`). Resolvió el choque con el acento, pero un celeste se lee como información, no como advertencia, y encima es del mismo familia de tono que el fondo azul. **Decisión abierta:** renombrar el token a `info` y dejar que `peligro` cubra lo grave, o buscar un tercer color para advertir de verdad. Sin resolver.

---

## 2. Tipografía — CERRADA (2026-09-17)

Las dos están en Google Fonts.

| Uso | Familia | Detalle |
|---|---|---|
| Interfaz | **Outfit** | Título 32 px / 700. Subtítulo 20 px / 500. Cuerpo 15 px / 400. Tenue 12 px / 400. |
| Cronómetro | **Space Mono** | 80 px. Monoespaciada por diseño: todos los dígitos tienen el mismo ancho. |

**Por qué el cronómetro va aparte:** con una fuente de ancho variable el `1` es más angosto que el `8`, y el número se mueve cada segundo. Space Mono lo evita sin depender de `font-variant-numeric: tabular-nums`. Esto además es requisito de la animación de tablillas (`frontend-arquitectura.md` §7.4).

---

## 3. Mascota — BASE ELEGIDA (2026-09-17)

Reglas de producto que ya estaban cerradas y la condicionan (`emociones.md` §3.11):

- Acompaña **durante la sesión**. No crece con las horas, no decae por ausencia, no hay que cuidarla.
- **No es donde se plasma el esfuerzo.** Ese lugar es la pantalla de Estadísticas.
- Reacciona en vivo. **A qué reacciona exactamente, sin decidir.**
- Sin castigo visual por ausencia (`emociones.md` §2): no puede poner cara triste porque no estudiaste.

### 3.1 La imagen base

Elegida por Jason el 2026-09-17, generada con IA. Un robot con cuerpo de televisor antiguo.

**Estado al 2026-09-19.** Ya no existe `base.png`. Hay tres poses, cada una en dos formatos:

| Estado (`types/pet.ts`) | Pose | Cuándo |
|---|---|---|
| `idle` | de pie | temporizador detenido |
| `focusing` | sentada en su silla, mirando arriba | corriendo |
| `waiting` | sentada, mirando al usuario | en pausa |

- `focus_front/src/assets/pet/*.webp` — lo que consume el código. 1254 px, con alfa. 47-83 KB cada una.
- `focus_front/src/assets/pet/master/*.png` — los maestros. Nadie los importa, así que Vite no los mete al bundle.
- **Jason quitó el contorno blanco** que traía la primera versión. No le gustaba. Eso deja sin cumplir lo que pide §3.4 para los fondos animados.
- `waiting.png` llegó con el damero de transparencia pintado adentro. Se le devolvió el alfa por relleno desde el borde (2026-09-19).

Cuerpo gris azulado `#B8CBD6`, contorno azul profundo `#2D4070`, pantalla `#1A2744`, ojos y perilla en naranja `#F59E0B`. Las dos poses sentadas traen además una silla azul con luces cian.

Defectos conocidos, aceptados por ahora y sin corregir:

1. **Cuatro patas finas iguales, sin pies.** No se distingue brazo de pierna. A tamaño chico esas líneas se deshacen.
2. **La mirada se lee enojada.** Los ojos bajan hacia el centro, como cejas fruncidas. Choca con "sin castigo visual" (`emociones.md` §2).
3. **El cuerpo tiene degradado**, no dos tonos planos. Si algún día se redibuja como SVG, el degradado es trabajo extra.

### 3.2 Dónde va en Home y en qué pose (2026-09-17)

**Esto anula la restricción anterior**, que decía que la mascota entraba en un círculo de ~160 px al lado del reloj. Ya no hay círculo.

- **Sentada.** Sentada se ocultan casi todas las patas, que son la parte floja del dibujo. Y una compañía que se queda tres horas al lado se lee sentada, no parada.
- **Abajo a la derecha**, apoyada sobre el borde inferior del contenido. Sin círculo, sin tarjeta y sin panel detrás.
- **En diagonal opuesta al reloj**, para que no compita por la atención.
- Hueco reservado: **180 px de ancho por 200 px de alto**, con al menos 80 px de aire alrededor.
- Nada de movimiento amplio, y ningún color más saturado que el acento.

### 3.3 Las demás poses

Se generan **usando una pose ya aceptada como imagen de referencia**, nunca desde cero: es lo único que mantiene al mismo personaje entre generaciones. Cuanto menos detalle anatómico, menos se rompe.

Estados previstos, que salen de `flujo-pantallas.md` §3: inactiva, corriendo, meta cumplida, aviso 20-20-6.

### 3.4 Convivencia con fondos animados

Pedido por Jason el 2026-09-17: más adelante va a haber fondos con movimiento (lluvia, fogata, y otros). No están decididos ni figuran en la lista de funciones de `proyecto.md` §3.

- La mascota queda **dentro de una escena**, no aislada. Tiene que leerse sobre cualquier fondo. Lo resuelve con contorno propio y sombra, que la base ya trae.
- **Su color no puede chocar con el del fondo.** Sobre una fogata naranja, una mascota naranja desaparece. Por eso el cuerpo es claro y poco saturado, con un solo rasgo de color.
- Para variar de escena sin rehacer el personaje: **accesorios por escena** (paraguas con lluvia, manta con fogata). El personaje base no cambia.
