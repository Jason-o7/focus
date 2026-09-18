# Focus — Guía de arquitectura del frontend

> **Lector previsto:** una instancia de Claude sin contexto previo del proyecto.
> No es material didáctico. Jason (el dueño) casi no lo lee.
> **Alcance: solo el CÓMO del frontend.** Qué hace la app, sus fases, el modelo de
> datos compartido con el backend y las decisiones abiertas del proyecto están en
> `proyecto.md`. Este archivo no los repite: leer los dos.
> **Fecha:** 2026-09-16. **Generador verificado:** create-vue 3.24.0.
> Si una instrucción directa de Jason en la conversación contradice este archivo, gana Jason.
> Si algo de acá quedó desactualizado, **verificalo corriéndolo antes de cambiarlo** (`CLAUDE.md` §4).

---

## 1. Reglas duras

Numeradas para poder citarlas.

- **R1.** `axios`, `fetch` y `localStorage` viven **únicamente** dentro de `src/api/`. Ningún componente, store, composable o vista los toca. Romper esto una vez arruina el cambio de fuente de datos.
- **R2.** Toda función pública de `src/api/` es `async` y devuelve `Promise`, **aunque la implementación local sea instantánea**. Si una devuelve valor directo, al cambiar a HTTP se rompe cada llamador.
- **R3.** No se crean carpetas vacías "por si acaso". Una carpeta nace cuando hay un segundo archivo que iría adentro. Ver §3.3.
- **R4.** El reloj **nunca** cuenta ticks. Cuenta marcas de tiempo con `Date.now()`. Ver §7.4.
- **R5.** Jason tiene que poder explicar todo lo que hay en el código. Si una solución no se puede explicar en voz alta, no entra, por elegante que sea.
- **R6.** Español en comentarios y documentación. Identificadores del código en inglés.

---

## 2. Stack — versiones verificadas el 2026-09-16

Instaladas realmente por `create-vue 3.24.0`, no de memoria:

| Paquete | Versión | Nota |
|---|---|---|
| vue | ^3.5 | Composition API + `<script setup>` siempre. Nunca Options API. |
| **vue-router** | **^5.3** | Ojo: casi toda la documentación de internet habla de la 4. |
| **pinia** | **^4.0** | Ojo: casi todo internet habla de la 2. |
| vite | ^8.2 | |
| typescript | ~6.0 | |
| vitest | ^4.1 | |
| eslint | ^10 | Viene junto con `oxlint` (linter en Rust). Corren los dos. No tocar. |
| prettier | 3.9 | |
| tailwindcss | 4.3.3 | Se instala aparte. Ver §9. |

**No se usa Nuxt.** La app es una SPA privada detrás de un login, sin nada que indexar, y Nuxt obligaría a un servidor Node en producción. *(Propuesto por Claude, no objetado por Jason.)*

**No se usa:** Vuex, Options API, Atomic Design, Feature-Sliced Design, Clean Architecture en el front. Ver Apéndice A para el porqué.

---

## 3. Estructura de carpetas

### 3.1 La decisión

**Organización por tipo** (type-based), con subcarpetas de dominio dentro de `views/`.

Se decidió mirando 15 codebases reales en producción, no blogs. 11 de 15 usan por tipo, y **los 7 que son ERPs o paneles de administración lo usan sin excepción**. Detalle en Apéndice A.

### 3.2 El árbol

```
focus_front/
  index.html
  vite.config.ts          alias @ -> ./src ya configurado por el generador
  vitest.config.ts
  eslint.config.ts
  tsconfig*.json
  src/
    main.ts
    App.vue
    api/                  <- capa de datos. UNICO lugar con axios/localStorage (R1)
      types.ts            contratos (interfaces) de cada repositorio
      local/              implementación con localStorage
      http/               implementación con axios contra Nest (fase 2)
      index.ts            elige implementación según login (§6.2)
    assets/               main.css (entrada de Tailwind), imágenes, audio
    components/           componentes reusables, sin dominio
    composables/          useTimer, useAudio, useReminders
    router/index.ts
    stores/               Pinia
    types/                Session, Settings, Sound — tipos del dominio
    utils/                funciones puras (formatear duración, fechas)
    views/
      home/
      sounds/
      stats/
      settings/
```

### 3.3 Carpetas que NO se crean todavía

`layouts/`, `styles/`, `constants/`, `plugins/`, `directives/`, `locales/`.

Existen en los paneles grandes **porque tienen contenido**. Esta app tiene una sola disposición de pantalla y un solo archivo CSS. Crear la carpeta cuando aparezca el segundo archivo que iría adentro (R3).

### 3.4 Cuándo migrar a dominios en la raíz

No hacerlo. El punto de quiebre observado está muy arriba: el ERP de yudao tiene **1.745 archivos `.vue`** organizados por tipo y funciona. Solo GitLab, n8n y Shopware suben los dominios a la raíz, y son órdenes de magnitud más grandes que esto.

---

## 4. Tabla de decisión: "tengo algo nuevo, ¿dónde va?"

Consultar esto antes de crear cualquier archivo.

| Qué es | Dónde va | Ejemplo |
|---|---|---|
| Llama al backend o a `localStorage` | `api/` | `api/local/sessions.ts` |
| Contrato de un repositorio | `api/types.ts` | `interface SessionRepo` |
| Tipo del dominio | `types/` | `types/session.ts` |
| Lógica con estado, reusable, cada consumidor con su copia | `composables/` | `useTimer.ts` |
| Estado global compartido por varias vistas | `stores/` | `stores/settings.ts` |
| Componente usado por 2+ dominios, sin lógica de negocio | `components/` | `BaseButton.vue` |
| Componente usado por un solo dominio | `views/<dominio>/` | `views/home/TimerDisplay.vue` |
| Pantalla completa mapeada a una ruta | `views/<dominio>/` | `views/stats/StatsView.vue` |
| Función pura sin estado ni efectos | `utils/` | `utils/formatDuration.ts` |
| CSS global o variables de tema | `assets/main.css` | |
| Archivo de audio | `assets/audio/` | `assets/audio/rain.mp3` |

**Caso dudoso — ¿componente compartido o de dominio?** Empieza en `views/<dominio>/`. Se promueve a `components/` **recién cuando un segundo dominio lo necesita de verdad**. Duplicar un componente chico es más barato que una abstracción prematura.

---

## 5. Convenciones de nombres

Salen del Style Guide oficial de Vue y de lo observado en los repos reales.

| Cosa | Convención | Ejemplo |
|---|---|---|
| Componente (archivo) | PascalCase, multipalabra | `TimerDisplay.vue` |
| Vista de ruta | PascalCase + sufijo `View` | `HomeView.vue`, `StatsView.vue` |
| Componente base reusable | prefijo `Base` | `BaseButton.vue`, `BaseSlider.vue` |
| Componente único en pantalla | prefijo `App` | `AppSidebar.vue` |
| Composable | `use` + camelCase | `useTimer.ts` |
| Store Pinia | `use` + nombre + `Store` | `useSettingsStore` en `stores/settings.ts` |
| Archivo de utilidades | camelCase | `formatDuration.ts` |
| Tipo / interfaz | PascalCase | `Session`, `SoundRepo` |
| Test | junto al código, en `__tests__/` | `composables/__tests__/useTimer.spec.ts` |

**Importaciones: siempre con el alias `@`.** El generador escribe `../views/HomeView.vue` en su router de ejemplo; eso se corrige a `@/views/home/HomeView.vue`. El alias ya está en `vite.config.ts`.

---

## 6. La capa `api/` — el contrato

### 6.1 Por qué existe

Decisión de Jason: la fuente de datos tiene que poder cambiarse tocando **un solo archivo**, no tres días de trabajo. Las fases están en `proyecto.md`.

### 6.2 Cómo se cambia — en tiempo de ejecución (decidido por Jason, 2026-09-17)

Sin login → `local`. Con login → `http`. El mismo usuario cambia de fuente sin recargar. **No usar `import.meta.env`**: Vite lo fija al compilar y deja una sola fuente para todos.

```ts
// src/api/index.ts
import * as local from './local'
import * as http from './http'

let source: typeof local | typeof http = local
export const setDataSource = (s: 'local' | 'http') => { source = s === 'http' ? http : local }
export const repo = () => source
```
- Se llama `repo().sessions.list()`, nunca se guarda `repo()` en una constante: quedaría congelada en la fuente de ese momento.
- `useAuthStore` llama a `setDataSource` en login, logout **y al arrancar la app** si hay sesión guardada. Si no, al recargar vuelve a `local`.
- `AuthRepo` (login, registro) va siempre por `http`: decide la fuente, no depende de ella.
- `api/` no importa stores: los stores ya importan `api/` y sería una dependencia circular.
- Todo el resto de la app importa desde `@/api`. Nunca desde `@/api/local` ni `@/api/http` directamente.

### 6.3 Reglas del contrato

- **R2 aplica:** todo `async`, todo `Promise`, siempre.
- Los tipos se definen una sola vez en `api/types.ts` + `types/`. El backend los comparte después.
- Cada método maneja errores. `localStorage` casi nunca falla; HTTP falla siempre. Si la UI no está escrita con `try/catch` y estados de carga/error desde el día uno, el cambio a HTTP la rompe.

### 6.4 Repositorios previstos

`SessionRepo`, `SettingsRepo`, `SoundRepo`, `AuthRepo`.

`AuthRepo` existe desde el inicio con una implementación local que devuelve un usuario fijo y sin pantalla de login. El motivo está en `proyecto.md` §7.

### 6.5 Reglas del front que condicionan los datos

Las decisiones del modelo de datos compartido con el backend (UUID desde el front, día de la sesión, zona horaria, sonidos por defecto, migración) están en `proyecto.md` §6. Acá va solo lo que es responsabilidad del navegador:

- **Datos locales editables (decidido por Jason, 2026-09-17):** cualquiera los cambia desde DevTools. Se acepta: sin cuenta, solo se engaña a sí mismo. No cifrar ni ofuscar.
- **Sesión en curso al cerrar la pestaña: SIN DEFINIR.** Jason quiere discutirlo después, con front y back juntos, porque hay muchos casos. No implementar nada ni proponer solución por adelantado.

---

## 7. Estado y lógica

### 7.1 Dónde vive cada estado

| Tipo de estado | Herramienta |
|---|---|
| Local de un componente | `ref()` / `reactive()` dentro del componente |
| Lógica reutilizable donde cada consumidor quiere su copia | composable |
| Compartido entre vistas, uno solo para toda la app | Pinia |

### 7.2 Stores previstos

`useTimerStore` (sesión activa), `useSettingsStore` (intervalo de recordatorios, volumen, duración por defecto), `useSoundsStore`, `useStatsStore`, `useAuthStore`.

### 7.3 Los stores no hablan con el backend directamente

Un store llama a `@/api`. Nunca a axios (R1).

### 7.4 El reloj — el mecanismo crítico

**`setInterval` NO es el reloj.** El navegador baja la frecuencia a ~1/minuto cuando la pestaña está en segundo plano, y puede congelarla entera. Contar `restante--` por tick pierde minutos.

Correcto:

```
transcurrido = acumulado + (Date.now() - inicioDelTramo)
```

- El `setInterval` solo repinta. Si se salteó 300 ticks, el número igual sale bien.
- Al pausar: `acumulado += Date.now() - inicioDelTramo`.
- Al reanudar: `inicioDelTramo = Date.now()`.

**Temporizador y cronómetro son el mismo motor, no dos implementaciones.** El temporizador tiene un umbral (`objetivo`), el cronómetro no lo tiene. Cuando `transcurrido >= objetivo` se dispara el aviso **una vez** y el contador sigue subiendo. Cero no es un final, es un umbral.

**Animación del reloj: tipo tablilla abatible (flip clock).** Pedido por Jason el 2026-09-17, para cuando se escriba el código. El dígito se dobla desde la mitad horizontal hacia arriba y aparece el siguiente. Reglas que ya se saben:

- **La animación la dispara el cambio del valor mostrado, nunca un temporizador propio.** Un segundo temporizador para animar se desincroniza del reloj real de §7.4.
- **Un dígito, una tablilla.** Son cuatro o seis elementos independientes: solo se anima el que cambia. Si se anima el bloque entero, el minuto parpadea 60 veces por minuto sin necesidad.
- **Al volver de segundo plano el valor salta.** El navegador congeló el repintado, así que pueden haber pasado 300 segundos. No se animan 300 vueltas: se pinta el valor final directo, sin transición.
- **Respetar `prefers-reduced-motion`**: con esa preferencia activa, el dígito cambia sin animación.
- Necesita dígitos de ancho fijo (tabulares) en la fuente, o la tablilla cambia de ancho al girar.

### 7.5 Recordatorios periódicos

Mismo principio: marcas, no ticks.

```
marca = Math.floor(transcurrido / intervalo)
si (marca > ultimaMarcaAvisada) -> notificar una vez; ultimaMarcaAvisada = marca
```

Si el usuario vuelve a la pestaña a los 45 min con intervalo de 20, saltó 2 marcas: **notifica una sola vez**, no dos seguidas. Sin esa comparación se dispara una ráfaga de notificaciones atrasadas.

Permisos: `Notification.requestPermission()` se pide en el **primer click de "iniciar"**, nunca al cargar la página. Si el usuario bloquea, desde el código no hay vuelta atrás: tiene que cambiarlo en el candado del navegador.

Acompañar siempre la notificación con un beep corto: la notificación visual se pierde si el usuario está mirando otra ventana.

### 7.6 Audio

- **Autoplay:** el navegador bloquea audio hasta un gesto del usuario. El `play()` debe salir **dentro** del handler del click de "iniciar", no de un `watch` posterior.
- **Volumen:** `audio.volume` es lineal, el oído no. Mapear el slider con `volume = x * x`.
- **Loop:** `audio.loop = true` con `.mp3` deja un hueco audible (el formato agrega silencio al inicio y al final). Si se escucha el corte, cambiar el archivo a `.ogg`/`.opus` **antes** de complicar el código con Web Audio API.

---

## 8. Componentes

- `<script setup lang="ts">` siempre.
- Props y emits tipados con TypeScript.
- Los de `components/` son tontos: props entran, eventos salen, sin lógica de negocio y sin tocar stores.
- Los de `views/<dominio>/` sí pueden usar stores y composables.
- Nombres multipalabra siempre (`TimerDisplay`, no `Timer`), para no chocar con elementos HTML.

---

## 9. Tailwind — verificado (instalado y compilado el 2026-09-16)

**Tres cambios. Nada más.**

1. `npm install tailwindcss @tailwindcss/vite`
2. En `vite.config.ts`:
   ```ts
   import tailwindcss from '@tailwindcss/vite'
   // plugins: [vue(), vueDevTools(), tailwindcss()]
   ```
3. Arriba de todo en `src/assets/main.css`:
   ```css
   @import "tailwindcss";
   ```

`main.ts` ya importa ese CSS. No se toca.

**Trampa conocida:** Tailwind 4 **ya no usa `tailwind.config.js`**. Casi todos los tutoriales de internet son de la v3 y mandan a crear ese archivo con `@tailwind base;`. Los colores propios se definen ahora en el CSS con `@theme`.

**Segunda trampa:** si se usa `@apply` dentro del `<style>` de un componente, hay que poner `@reference "../assets/main.css";` arriba del bloque o no resuelve nada, y el error no se entiende.

Clases directo en el template. Evitar `@apply` salvo repetición real y probada.

---

## 10. Router

- Un solo `router/index.ts` mientras quepa. Partir en `router/modules/` recién si molesta.
- Rutas con `name`, siempre.
- Lazy loading con `() => import('@/views/...')` para todo lo que no sea la pantalla inicial.
- El guard de autenticación se escribe desde el principio aunque siempre deje pasar, para no refactorizar después.

---

## 11. Tests

- Vitest. Archivos en `__tests__/` pegados al código que prueban.
- Nombre: `<archivo>.spec.ts`.
- **Prioridad: `useTimer`.** Es lógica pura, es el corazón de la app, y es donde un error se nota tarde. Probar: pausa/reanudación, cruce del umbral sin detenerse, y marcas salteadas de los recordatorios.
- No perseguir cobertura. Probar lo que duele si se rompe.

---

## 12. Comandos verificados

Corridos y comprobados el 2026-09-16. **Trampa (verificada):** en el monorepo `focus_front/` ya existe con un `README.md` vacío. El generador se frena preguntando si borra todo. Con `--force` **borra todo lo que haya en la carpeta sin preguntar**, incluidos archivos ajenos. Nunca usar `--force` en una carpeta con contenido.

```bash
# Desde la raíz focus/. Primero borrar el README vacío que deja la carpeta no vacía.
rm focus_front/README.md
# --bare evita el código de ejemplo: ahorra borrar ~10 archivos
npm create vue@latest focus_front -- --ts --router --pinia --vitest --eslint --prettier --bare

# Tailwind
npm install tailwindcss @tailwindcss/vite
```

Sin `--bare` hay que borrar ~10 archivos de ejemplo; con `--bare` igual queda `stores/counter.ts`. **Ya aplicado el 2026-09-17:** proyecto generado, limpio y con Tailwind. Scripts: `dev`, `build`, `preview`, `test:unit`, `type-check`, `lint`, `format`.

---

## Apéndice A — La evidencia detrás de §3

Metodología: se bajó el árbol completo de archivos de cada repositorio con la API de GitHub y se contaron las carpetas de primer nivel. **No son blogs, es código en producción.**

| Repositorio | Qué es | Primer nivel | Tipo |
|---|---|---|---|
| yudao-ui-admin-vue3 | **ERP** (1.745 .vue) | `views/ api/ components/ store/ utils/ hooks/ layout/ router/` | Por tipo |
| JeecgBoot | **ERP low-code** (918 .vue) | `views/ components/ api/ layouts/ hooks/ utils/ store/` | Por tipo |
| frappe/hrms | **ERP** (ERPNext) | `components/ views/ router/ utils/ composables/` | Por tipo |
| vue-vben-admin | Panel | `views/ router/ api/ layouts/ store/` | Por tipo |
| vue-pure-admin | Panel | `views/ components/ layout/ router/ utils/ store/ api/` | Por tipo |
| soybean-admin | Panel | `layouts/ components/ views/ store/ router/ hooks/ service/` | Por tipo |
| vue3-element-admin | Panel | `views/ components/ api/ layouts/ stores/ composables/` | Por tipo |
| Hoppscotch | Producto de empresa | `components/ services/ composables/ pages/ helpers/` | Por tipo |
| Koel | Laravel + Vue 3 | `components/ composables/ services/ stores/ utils/` | Por tipo |
| Vikunja | Producto | `components/ views/ services/ models/ composables/ stores/` | Por tipo |
| Nextcloud Mail | Producto | `components/ service/ util/ store/ views/` | Por tipo |
| Directus | Empresa | `components/ views/ composables/ stores/` **+ `modules/`** | Mixta |
| GitLab | Empresa grande (2.659 .vue) | `ci/ work_items/ issues/ merge_requests/ boards/ crm/ …` **+ `vue_shared/`** | Por dominio |
| n8n | Empresa (1.296 .vue) | `features/` (15 dominios) **+ `app/`** | Por dominio |
| Shopware | Empresa | `module/ app/ core/` | Por dominio |

**Conteo: 11 por tipo, 3 por dominio, 1 mixta. Feature-Sliced Design: cero apariciones.**

Los 3 por dominio son los codebases más grandes de la muestra. Los 7 paneles/ERPs son todos por tipo, sin excepción.

**Matiz importante:** casi todos agrupan por dominio de negocio. La diferencia es **dónde**. La mayoría pone los dominios dentro de `views/` (yudao: `views/erp`, `views/crm`, `views/hrm`, `views/mall`, `views/mes`). Solo los gigantes los suben a la raíz de `src/`. La estructura correlaciona con el tamaño, no con la moda.

**Límites de esta evidencia, declarados:** 15 repos elegidos a mano, todos de código abierto, con sesgo hacia el ecosistema chino en las plantillas de panel. No es una muestra estadística. Es un hecho contable, no una encuesta.

**Nota sobre nombres:** en paneles y ERPs la capa de datos se llama `api/` (yudao tiene 502 archivos ahí). En productos que no son paneles se llama `services/`. Este proyecto usa `api/`.

---

> El estándar de trabajo del proyecto y los errores ya cometidos están en `CLAUDE.md` §4.
