# Focus — Punto de entrada

> **Lector previsto:** una instancia de Claude sin contexto previo. Jason casi no lee estos archivos.
> **Este es el único archivo que se lee al inicio de cada conversación.** Los demás, solo bajo demanda (§0).
> **Fecha de la última revisión:** 2026-09-17.
> Si una instrucción directa de Jason en la conversación contradice este archivo, gana Jason.

---

## 0. Reglas de esta documentación

- **D1 — Punto de entrada.** `proyecto.md` se lee al empezar cualquier conversación sobre Focus. Responde qué se construye, en qué fase estamos y qué está sin decidir.
- **D2 — No leer los demás archivos por costumbre.** Cada `.md` extra se abre **solo si la tarea concreta lo necesita**, según la columna "Leerlo cuando" de §1. Leer todo al inicio llena el contexto de material que no se va a usar y deja menos espacio para el código real.
- **D3 — Máximo 350 líneas por archivo.** Si un documento se pasa, se parte en dos y ambos se indexan en §1. Sin excepciones: un archivo largo obliga a leerlo entero o a no leerlo nunca.
- **D4 — Un archivo, un propósito.** Nada de mezclar producto con arquitectura, ni arquitectura con despliegue. Si algo no encaja en ningún archivo existente, se crea uno nuevo y se agrega a §1.
- **D5 — Lo que se decide conversando se escribe acá.** Una decisión que solo vive en el chat se pierde al cambiar de conversación.
- **D6 — Escribir para Claude, no para Jason.** Denso y operativo. Lo que Jason tiene que entender se le explica en el chat, no en `docs/`.
- **D7 — Nada se repite entre archivos que se cargan siempre.** `CLAUDE.md` (reglas de comportamiento y entorno) y este archivo (el proyecto) se leen en cada sesión: lo que está en uno no va en el otro.

---

## 1. Índice de la documentación

| Archivo | Qué contiene | Leerlo cuando | NO leerlo si |
|---|---|---|---|
| `proyecto.md` | Este. Producto, fases, modelo de datos compartido, decisiones abiertas. | Siempre, al inicio. | — |
| `frontend-arquitectura.md` | Estructura de carpetas, stack con versiones, dónde va cada archivo, capa `api/`, mecanismos del reloj y el audio, Tailwind, tests, comandos verificados. | Antes de escribir o modificar **cualquier cosa** dentro de `focus_front`. | La tarea es de backend, despliegue, producto o diseño. |
| `backend-arquitectura.md` | Nest 12 (ESM, Vitest, oxlint) con versiones y trampas verificadas, estructura medida en 16 repos reales, dónde va cada archivo, auth, mecanismos de datos probados (UUID, importación idempotente, día local), migraciones, decisiones abiertas del backend. **Todo sin confirmar por Jason.** | Antes de generar o modificar **cualquier cosa** dentro de `focus_back`, o al discutir Postgres vs MySQL, ORM o dónde guardar el JWT. | La tarea es solo de front, producto o diseño. |
| `despliegue-aws.md` | Cómo despliegan las empresas en AWS: encuestas, conteo en GitHub, seis patrones, servicios cerrados (App Runner, Copilot), rollback, OIDC, Free Plan, precios medidos en us-east-1 y sa-east-1, latencia desde Sucre, opciones A-D para Focus. **Nada decidido.** | Se discute **dónde o cómo desplegar**, costos de AWS, CORS vs mismo dominio, o dónde guardar el JWT (A4 del back depende de esto). | La tarea es escribir código de front o back. |
| `flujo-pantallas.md` | Qué pantallas existen, qué hace cada una, desde dónde se llega a cada una, estados de Home y diálogos sueltos. No cubre diseño visual. | Se toca la navegación, el router, o se crea o modifica una vista. | La tarea es de backend o despliegue. |
| `diseno-visual.md` | Paleta de color cerrada (13 tokens con su hex y su contraste), tipografía cerrada (Outfit + Space Mono), qué se corrigió de la primera versión, y la mascota: imagen base elegida con sus defectos, pose, dónde va en Home y cómo se generan las demás poses. | Se escribe CSS o `@theme`, se elige un color o un tamaño de texto, o se toca la mascota. | La tarea es de backend, despliegue o producto. |
| `emociones.md` | Qué siente Jason antes, durante y después de estudiar; emociones principales elegidas; 11 puntos ya cerrados (racha y deuda, meta, mascota, identidad, vista cansada) con sus conclusiones en §4. | Se decide **temática, flujo, recompensas o racha**, o se retoma la discusión de emociones. | La tarea es solo técnica. |
| `diseno-hook.md` | Diseño de hábito según el framework de Hooked: disparadores, acción, recompensa variable, inversión, métricas, líneas rojas. | La tarea es decidir **mecánicas de enganche**: qué recompensa dar, cómo se ve la sección de estadísticas, qué notificaciones motivacionales existen. | La tarea es técnica. Nada de acá cambia cómo se escribe el código. **Ojo: 431 líneas, viola D3. Hay que partirlo.** |

---

## 2. Qué es

App web tipo Forest para estudiar. Uso personal primero, público si funciona.

Doble objetivo de Jason: practicar Vue, y tener un proyecto real de Nest. Lo
segundo importa porque declaró Nest en el formulario de SI ESAM y en LinkedIn
sin ningún proyecto que lo respalde.

### Repositorio

**Monorepo.** Decidido y aplicado el 2026-09-16. Un solo repo
(`github.com/Jason-o7/focus`), sin submódulos:

```
focus/
  docs/          esta documentación
  focus_front/   Vue + Vite
  focus_back/    Nest (fase 2)
```

Los repos `focus_front` y `focus_back` de GitHub quedaron abandonados. No usarlos.
Se descartaron los submódulos porque obligan a dos commits y dos push por cambio,
y el puntero del padre se queda viejo sin avisar.

---

## 3. Funciones

**Sin MVP (decidido por Jason, 2026-09-17):** la meta es un primer diseño completo y bueno, para uso propio. Lista base:

1. **Temporizador** con duración configurable. Al llegar a cero **NO se detiene**: avisa y sigue contando hacia arriba.
2. **Cronómetro** que solo termina cuando el usuario lo corta.
3. **Sonidos de fondo** (lluvia ya existe) con control de volumen. Uno a la vez.
4. **Recordatorios 20-20-6** con intervalo configurable. Solo corren mientras hay una sesión activa.
5. **Estadísticas** de día, semana y mes.
6. **Meta diaria configurable** (entra el 2026-09-17): por defecto igual todos los días, modificable por día de la semana. Dos modos de configurarla, numérico o bloques tipo calendario, se elige uno. Reglas cerradas en `emociones.md` §4.1.
7. **Racha** (entra el 2026-09-17). Un corte no debe borrar el esfuerzo previo ("2 meses y un tropiezo"). Amortiguación: cubeta de deuda de 3 h con reloj de 7 días, `emociones.md` §4.3.

---

## 4. Antes excluido — REABIERTO, no incluido

Al quitar el MVP estas exclusiones dejaron de valer, pero **nada entra automáticamente**. Cada una se decide aparte. El costo técnico sigue:

- Que el usuario suba sus propios sonidos (subida de archivos y almacenamiento).
- Notificaciones con la pestaña cerrada (Service Worker + Web Push + VAPID).
- Mezclar varios sonidos a la vez.
- Logros, insignias.
- Etiquetas o materias por sesión.
- App móvil o modo sin conexión.

---

## 5. Fases

| Fase | Contenido | Estado |
|---|---|---|
| 1 | Front solo, con `localStorage`. Temporizador y cronómetro. Desplegar. | En curso |
| 2 | Backend Nest + JWT + login. Unirlo al front. Desplegar. | Sin empezar |
| 3 | Sin definir. Se decide al llegar. | — |

**Estado del código al 2026-09-17:** `focus_front/` generado con create-vue, limpio de ejemplos, Tailwind 4 instalado y conectado a Vite. `views/timer/TimerView.vue` existe vacío; el router tiene `routes: []`. `focus_back/` sin generar.

### Siguiente paso (acordado el 2026-09-17)

**Diseño visual de las pantallas**, en otra conversación. Producto, emociones y flujo ya están cerrados; falta cómo se ve cada pantalla, incluida la navegación entre ellas y la temática visual de Estadísticas. Material de entrada: `flujo-pantallas.md`, `emociones.md` §4 y `frontend-arquitectura.md` §9 (Tailwind 4, sin `tailwind.config.js`). Jason quiere copiar flujo y diseño de apps exitosas, y pidió un tema oscuro azul.

### Flujo de pantallas

Está en `flujo-pantallas.md` (pantallas, transiciones, estados de Home). Acá solo lo que no es flujo:

- **Home** = temporizador y cronómetro; el archivo hoy es `views/timer/TimerView.vue` (renombrar o no, sin decidir).
- **Sonidos:** "uno por defecto y el resto deshabilitado" se decidió para el MVP; con el MVP quitado, REABIERTO.
- **Emociones y motivación:** `emociones.md`, con los 11 puntos ya cerrados.
- **Temática visual** (tipo plantas de Forest): vive en Estadísticas. Jason quiere copiar flujo y diseño de apps exitosas.

---

## 6. Modelo de datos y reglas compartidas front/back

**PROPUESTAS de Claude, NO confirmadas por Jason. Confirmar antes de implementar.**

- **IDs generados en el front** con `crypto.randomUUID()`. El backend los acepta como clave primaria en vez de generarlos. Motivo: al migrar los datos locales a la base no hay colisión, y la importación se vuelve idempotente (si el id ya existe, se ignora, y se puede reintentar sin duplicar).
- **Sesión que cruza medianoche:** se atribuye al día en que empezó. Las otras opciones eran el día de fin o partirla en dos.
- **Zona horaria:** guardar en UTC, agrupar por día **local** (`America/La_Paz`, UTC−4). Agrupar por día UTC manda al día siguiente todo lo estudiado después de las 20:00.
- **Dónde se suman las estadísticas:** en la base con `GROUP BY`, no en el navegador. Con miles de sesiones no conviene bajarlas todas.
- **Sonidos:** `sounds(id, nombre, url, user_id NULL)`. `user_id = NULL` significa "por defecto". La regla "no se editan ni borran los por defecto" sale sola: permitir solo si `sound.user_id === usuario.id`. Dejar la columna desde el inicio aunque la funcionalidad sea futura; agregarla después obliga a migrar.
- **Migración de la fase 1 a la 2:** endpoint `POST /sessions/import` que recibe el array completo. El front pregunta antes de subir y **limpia `localStorage` recién después de confirmar que subieron**.

---

## 7. Autenticación

Decidida por Jason: email + contraseña con hash y JWT, en la fase 2.

Se diseña desde temprano porque agregarla después obliga a reescribir todos los
endpoints y a migrar los datos a un dueño.

**En la fase 1 no hay pantalla de login.** Un login sin servidor no es un login:
la contraseña se verifica en el servidor y el JWT lo firma el servidor. La fase 1
solo tiene el contrato `AuthRepo` con una implementación local que devuelve un
usuario fijo, para no refactorizar después.

---

## 8. Decisiones ABIERTAS — no asumir ninguna

Preguntar a Jason. **No decidir por él** (regla suya explícita: "no armes planes por tu cuenta").

| Tema | Estado |
|---|---|
| **`docs/` en `.gitignore`** | RESUELTO DE HECHO, sin hablarlo en la conversación. El 2026-09-16 a las 12:02 el `.gitignore` de la raíz quedó **vacío**: `docs/` y `CLAUDE.md` ya se versionan. Consecuencia: la raíz no ignora nada, así que cada subproyecto necesita su propio `.gitignore` (ver `backend-arquitectura.md` T13). |
| **Despliegue en AWS** | ABIERTO. Solo se sabe: hay front, back, PostgreSQL y posiblemente Docker. **Jason dijo explícitamente: nada de nginx.** Eso deja tres huecos que hay que tapar igual: terminar HTTPS, servir los estáticos, y CORS (que sin proxy inverso se configura en Nest). Investigado el 2026-09-16: `despliegue-aws.md`. Opciones en §12 y preguntas para Jason en §13, sin responder. |
| **PostgreSQL vs MySQL** | Jason dijo Postgres. Claude señaló que SI ESAM (la empresa donde postula) usa MySQL, y que si este proyecto va a respaldar lo que declaró, MySQL le compra más. Sin cerrar. Diferencias concretas para Focus, verificadas: `backend-arquitectura.md` §11 (A1). |
| **Estructura y decisiones del backend Nest** | Investigado el 2026-09-16 sin Jason presente: `backend-arquitectura.md`. Todo quedó como PROPUESTA. Abiertas ahí: ORM, validación, dónde guarda el front el JWT, refresh token, límite de intentos de login, capa de repositorio, tipos compartidos, ESM vs CJS (§11). Presentárselas a Jason antes de generar `focus_back`. |
| **Emociones y racha** | CERRADO el 2026-09-17: `emociones.md` §3 y §4. |
| **Sesión en curso al cerrar la pestaña** | ABIERTO. Jason pidió discutirlo más adelante, con front y back juntos. No definir ni implementar. |
| **Recordar volver a entrar** | ABIERTO. Sin push no hay canal con la pestaña cerrada (push reabierto en §4, sin decidir). Con backend, el correo sería posible. Sin decidir. |
| **Cuándo pedir permiso de notificaciones** | ABIERTO. `frontend-arquitectura.md` §7.5 dice en el primer clic de Iniciar; `diseno-hook.md` §2.2 y §9 dicen después del primer premio. Se contradicen. |
| **Diseñar en Figma primero** | ABIERTO. Jason lo quiere solo si Claude lee Figma sin capturas. Sin conexión a Figma hoy. MCP oficial de Figma sin verificar (plan, instalación, calidad con Vue + Tailwind). |
| **Partir `diseno-hook.md`** | Tiene 431 líneas (`wc -l`, 2026-09-16; el "818" anterior estaba mal medido) y viola D3. Sin resolver. |
