# Focus — Guía de arquitectura del backend

> **Lector previsto:** una instancia de Claude sin contexto previo del proyecto.
> No es material didáctico. Jason (el dueño) casi no lo lee.
> **Alcance: solo el CÓMO del backend.** Producto, fases, modelo de datos compartido y decisiones del proyecto están en `proyecto.md`. Despliegue: fuera de este archivo (D4), sigue ABIERTO en `proyecto.md` §8.
> **Fecha:** 2026-09-16. **Generador verificado:** `@nestjs/cli` 12.0.3, Node v24.20, npm 11.19, Windows 11.
> Si una instrucción directa de Jason contradice este archivo, gana Jason.
> Si algo quedó desactualizado, **verificalo corriéndolo antes de cambiarlo** (`CLAUDE.md` §4).

---

## 0. Estado — leer antes que nada

**Jason no confirmó nada de este archivo.** Se investigó en una conversación en la que él no estaba presente. Etiquetas:

- **[V]** verificado corriéndolo en un proyecto generado de verdad (en el scratchpad, no en `focus_back/`).
- **[D]** documentado por la fuente oficial, **no** corrido.
- **[P]** propuesta de Claude. Confirmar con Jason antes de implementar.
- **[A]** abierto. No decidir por él. Lista completa en §11.

`focus_back/` todavía solo tiene un `README.md` vacío. No se generó nada ahí.

---

## 1. Reglas duras [P]

- **B1.** El `userId` sale **siempre** del JWT verificado. Nunca del body, la URL ni la query. Motivo: los ids los genera el front (`proyecto.md` §6); si el dueño también viniera del cliente, cualquiera escribe filas a nombre de otro.
- **B2.** Toda lectura, edición o borrado de datos de usuario lleva `user_id` en el `WHERE`. Buscar por `id` solo no alcanza: el id es un UUID que el cliente conoce.
- **B3.** Nunca `orUpdate()` / upsert con ids que vienen del cliente. `ON CONFLICT (id) DO UPDATE` no mira el dueño: pisa la fila de otro usuario si el id coincide [V: SQL generado, §8.2].
- **B4.** `synchronize: false` siempre. El esquema cambia solo por migraciones (§12.3). La documentación de Nest avisa que `synchronize: true` en producción pierde datos [D].
- **B5.** Fechas en columnas con zona (`timestamptz` en Postgres). Nunca `timestamp` sin zona. Ver T11.
- **B6.** Imports relativos terminan en `.js` aunque el archivo sea `.ts`. Ver T1.
- **B7.** R3, R5 y R6 de `frontend-arquitectura.md` aplican igual: nada de carpetas vacías, todo explicable en voz alta, español en comentarios e inglés en identificadores.

---

## 2. Stack — versiones verificadas el 2026-09-16

| Paquete | Versión | Nota |
|---|---|---|
| @nestjs/core, common, platform-express | 12.0.x | **Nest 12 salió el 2026-08-27.** Casi todo internet habla de la 10 o la 11. |
| Formato de módulos | **ESM** (`"type": "module"`) | Default del generador. Todo tutorial asume CommonJS. |
| typescript | ^6.0 | `module: nodenext`, `strict: true`. |
| **vitest** | ^4.1 | **No Jest.** Tutoriales con `jest.fn()` → `vi.fn()`. |
| **oxlint** | ^1.58 | **No ESLint.** `npm run lint` **no** tiene `--fix` (el del front sí). |
| prettier | ^3.4 | |
| Node mínimo | correr: 20.19+ / 22.12+; generar con el CLI: 22.22.3+ / 24.15+ | [D] guía de migración. |

**Compatibilidad con Nest 12, instalando de verdad con npm [V]:**

| Paquete | Resultado |
|---|---|
| @nestjs/config 12, @nestjs/jwt 12, @nestjs/passport 12, @nestjs/swagger 12, @nestjs/mapped-types 12 | Instala. |
| @nestjs/typeorm 12.0.1 + **typeorm 1.1.1** + pg 8 | Instala, arranca y consulta. |
| class-validator 0.15 + class-transformer 0.5, zod 4.6 | Instala y valida (§9). |
| bcrypt 6, argon2 0.45 | Instala y hashea. Ver T6. |
| **@nestjs/throttler 6.5.0** | **ERESOLVE.** Declara Nest hasta ^11. Ver T7. |
| **nestjs-zod 5.5.0** | **ERESOLVE.** Declara Nest hasta ^11. No hace falta: Nest 12 trae validación Zod propia. |
| **prisma / @prisma/client** | Instala **versiones desparejas**. Ver T8. |

---

## 3. Trampas verificadas — lo que internet o el generador dicen y no funciona como parece

- **T1. Imports con `.js` [V].** Con ESM, `import { X } from './x'` rompe el build con `TS2307: Cannot find module './x'`. El mensaje no sugiere la causa. Va `'./x.js'`. `__dirname` no existe: `import.meta.dirname`.
- **T2. Tests con Vitest [V].** El generador deja `globals: true` y dos configs: `vitest.config.ts` (`**/*.spec.ts`) y `vitest.config.e2e.ts` (`**/*.e2e-spec.ts`). La inyección de dependencias y `class-validator` funcionan bajo Vitest aunque no compila con `tsc`: se probó con un e2e.
- **T3. `nest new` elige ESM sin preguntar si no hay terminal interactiva [V].** Con terminal pregunta CJS/ESM y observabilidad. `--type` **no existe** como opción (`unknown option`). `--no-observe` sí.
- **T4. El generador deja un script `deploy` y la dependencia `@nestjs/mau` [V].** Mau es la plataforma oficial de Nest para desplegar en AWS (lo dice el README generado). No usarla ni borrarla sin hablarlo: el despliegue está ABIERTO.
- **T5. `nest g resource` [V]** genera `findOne(+id)`: asume ids numéricos, choca con los UUID. Cambiar a `@Param('id', ParseUUIDPipe)`. Además agrega `"@nestjs/mapped-types": "*"` al `package.json`: fijar la versión.
- **T6. npm 11 bloquea los scripts de instalación por defecto [V].** Avisa `npm warn install-scripts` y lista `bcrypt` y `@scarf/scarf`. `bcrypt` y `argon2` **igual funcionan** porque traen binarios precompilados (se hasheó y verificó). `@scarf/scarf` es analítica de instalación que llega por `@nestjs/swagger` → `swagger-ui-dist` [V]: no aprobarlo.
- **T7. Límite de intentos de login [V].** `@nestjs/throttler` no instala con Nest 12. No usar `--force` ni `--legacy-peer-deps` sin decidirlo con Jason. Ver §11.
- **T8. Prisma [V].** `npm i -D prisma` instala **8.0.0-rc.15** (el tag `latest` apunta a una versión candidata) y `npm i @prisma/client` instala **7.10.0**. Si se elige Prisma: `prisma@7 @prisma/client@7`. Además la receta de Prisma en la documentación de Nest **quedó vieja**: dice que Nest es CommonJS y manda a generar el cliente en `cjs` [D].
- **T9. TypeORM 1.x ≠ 0.3 (lo que enseña internet).**
  - `repo.countBy({ userId: undefined })` **lanza `TypeORMError`** [V]. En 0.3 ignoraba el filtro y devolvía **todas las filas**: un bug así mostraba las sesiones de todos. El QueryBuilder no está cubierto: `.where('s.userId = :u', { u: undefined })` devolvió 0 sin error [V].
  - Eliminados [D]: `onConflict()` (usar `orIgnore()`), `@EntityRepository` / `getCustomRepository`, `select` y `relations` como arrays de strings, `findByIds`, variables `TYPEORM_*` y `ormconfig.env`.
  - Codemod oficial: `npx @typeorm/codemod v1 src/` [D].
- **T10. `class-validator` y Zod tratan distinto un campo de más [V].** Body con `userId` agregado: `ValidationPipe({ whitelist, forbidNonWhitelisted })` responde **400**; `StandardSchemaValidationPipe` con `z.object` responde **201 y lo descarta** en silencio. Ninguno deja pasar el campo. Para rechazar con Zod: `z.strictObject`.
- **T11. La zona horaria de la máquina se mete en las fechas [V].** Esta PC está en `America/La_Paz`.
  - `pg`: una columna `timestamp` (sin zona) se lee con la zona **del proceso Node**. El mismo valor dio `21:30Z` con TZ=UTC y `01:30Z` del día siguiente en La Paz. `timestamptz` dio lo mismo en las dos.
  - `mysql2`: `timezone` vale `'local'` por defecto (leído en el código fuente). Si se elige MySQL, fijar `timezone: 'Z'`.
- **T12. `@nestjs/config` dejó Joi por Standard Schema [V].** `validationSchema: z.object({...})` funciona. Sin las variables, la app **se niega a arrancar** con `Config validation error: DATABASE_URL: Invalid input`. Joi sigue andando solo desde la v18 [D].
- **T13. `nest new` en `focus_back/` [V].** Con el `README.md` vacío falla: `A merge conflicted on path "/focus_back/README.md"`. Sin `--skip-git` crea un **`.git` anidado** dentro del monorepo. Con `--skip-git` **no genera `.gitignore`**, y el de la raíz solo ignora `/docs/` y `CLAUDE.md`. Comandos en §12.

---

## 4. Estructura de carpetas

### 4.1 Lo medido

16 backends Nest reales, árbol completo con `git clone --filter=blob:none`. Detalle en el Apéndice A.

- **Nivel superior:** 13 de 16 agrupan **por dominio**. 11 lo hacen dentro de una carpeta contenedora (`modules/`, `app/`, `features/`, `core/`, `lib/`) y 2 directo en `src/`. 2 agrupan **por tipo** (Immich, Vendure). 1 **por capas DDD** (permacoop).
- **Documentación oficial y `nest g resource`:** un dominio por carpeta directo en `src/` (`src/cats/`) [D][V].
- **Adentro de un dominio:** 9 de 16 tienen **capa de acceso a datos propia** (archivos `*.repository.ts` o `models/`). 7 inyectan el ORM directo en el servicio. **La muestra está partida: ninguna opción es "el estándar".** Verificado leyendo el constructor de un servicio en cada caso dudoso.
- **Casos de uso / CQRS:** 3 de 16 (Novu con `usecases/`; permacoop y Gauzy con `@nestjs/cqrs`).
- **Entidades TypeORM:** 5 de 7 las ponen dentro del dominio, 2 en una carpeta central.

### 4.2 El árbol [P]

Dominio directo en `src/`, como la documentación y el generador. Correlación observada: la carpeta contenedora aparece cuando además hay mucha infraestructura en la raíz (`config/`, `common/`, `shared/`). Esa lectura es inferencia, no dato. Focus no tiene esa infraestructura.

```
focus_back/
  nest-cli.json  tsconfig*.json  vitest.config*.ts  .oxlintrc.json  .gitignore
  .env.example            variables sin valores reales (el .env no se versiona)
  src/
    main.ts               CORS, pipes globales, prefijo /api
    app.module.ts         ConfigModule (zod) + TypeOrmModule.forRootAsync
    env.ts                esquema zod de las variables; pasa a config/ con un 2º archivo
    database/
      data-source.ts      SOLO para el CLI de migraciones
      migrations/
    auth/                 login, registro, guard JWT global, @Public(), @CurrentUser()
    users/
    sessions/             incluye GET /sessions/stats mientras quepa
    settings/
    sounds/
  test/                   e2e (*.e2e-spec.ts)
```

Cada dominio, **tal como lo deja `nest g resource`** (no se reacomoda: menos decisiones):

```
sessions/
  sessions.module.ts  sessions.controller.ts  sessions.service.ts
  sessions.service.spec.ts        unitario, pegado al archivo
  dto/create-session.dto.ts
  entities/session.entity.ts
```

**Tests:** convención Nest, no la del front. Unitarios `*.spec.ts` al lado del archivo; e2e en `test/`.

### 4.3 Acceso a datos [P] — sin capa de repositorio propia

El servicio recibe `@InjectRepository(Session) Repository<Session>`. Es el patrón del capítulo SQL de la documentación y el de nest-admin, Ghostfolio y Hoppscotch.

Motivo: el `Repository` de TypeORM ya es un repositorio. Una capa encima duplica archivos en una app de 5 tablas y no cambia ninguna decisión. Choca con R5.

**Cuándo agregarla:** cuando una misma consulta la usen 2 servicios, o cuando testear un servicio obligue a simular un QueryBuilder largo. Jason hizo Clean Architecture en Flutter: puede preferir la capa desde el inicio. Es decisión suya (§11).

---

## 5. Tabla de decisión: "tengo algo nuevo, ¿dónde va?"

| Qué es | Dónde va | Ejemplo |
|---|---|---|
| Endpoint HTTP | `<dominio>/<dominio>.controller.ts` | `@Post('import')` |
| Regla de negocio, consulta | `<dominio>/<dominio>.service.ts` | `importMany(userId, dtos)` |
| Tabla | `<dominio>/entities/<singular>.entity.ts` | `Session` |
| Forma de un body | `<dominio>/dto/<accion>-<singular>.dto.ts` | `CreateSessionDto` |
| Guard, decorador de usuario | `auth/` | `jwt-auth.guard.ts`, `current-user.decorator.ts` |
| Cambio de esquema | `database/migrations/` **generada**, nunca a mano | §12.3 |
| Variable de entorno | `env.ts` + `.env.example` | `JWT_SECRET` |

---

## 6. Convenciones de nombres — del generador [V] y la documentación

| Cosa | Convención | Ejemplo |
|---|---|---|
| Archivo | kebab-case + sufijo de tipo | `sessions.controller.ts`, `create-session.dto.ts` |
| Clase | PascalCase + sufijo | `SessionsService`, `CreateSessionDto` |
| Módulo / carpeta de dominio | plural | `sessions/` |
| Entidad | singular | `Session` en `session.entity.ts` |
| Tabla y columna | snake_case con `name:` explícito [P] | `@Column({ name: 'user_id' })` |
| Ruta | sustantivo plural, kebab-case | `/api/sessions`, `/api/sessions/import` |

**Por qué `name:` explícito:** sin él TypeORM crea `"userId"` [V: SQL generado], y en Postgres el SQL a mano de las estadísticas necesitaría comillas en cada columna. Alternativa descartada: un paquete de naming strategy, que es una dependencia más para una sola cosa.

---

## 7. Autenticación (fase 2)

- **Patrón [P]:** el de la documentación oficial actual [D]. `@nestjs/jwt` + un `AuthGuard` propio registrado global con `APP_GUARD`, y un decorador `@Public()` para abrir login y registro. Passport quedó como receta aparte. En la muestra, 12 de 16 usan `@nestjs/passport`. Inferencia: son codebases de Nest 9-11, cuando Passport era el camino principal. Sin Passport hay menos piezas que explicar (R5).
- **Global y abierto por excepción:** un endpoint nuevo nace protegido. Si alguien olvida el decorador, falla cerrado (401), no abierto.
- `userId` = `sub` del token, leído con `@CurrentUser()`. B1.
- **Hash [P]:** argon2id. OWASP lo pone primero y deja bcrypt "para sistemas legados" [D, Password Storage Cheat Sheet]. bcrypt es mayoría en la muestra (10 de 16 más 1 con bcryptjs; argon2 en 3). **bcrypt trunca a 72 bytes [V]:** 72 `a` + `X` y 72 `a` + `Y` dieron el mismo hash. Los dos paquetes hashean y verifican [V].
- **Abierto [A]:** dónde guarda el front el token, refresh token sí/no, límite de intentos de login. Ver §11.

---

## 8. Datos — mecanismos verificados

Implementan las reglas de `proyecto.md` §6. Probado con PostgreSQL real (PGlite, §10) y TypeORM 1.1.1.

### 8.1 Ids del front

`@PrimaryColumn('uuid')`, **no** `@PrimaryGeneratedColumn`. Validar el formato en el DTO (`@IsUUID('4')`). En Postgres la columna es `uuid` nativo; en MySQL TypeORM la crea `varchar(36)` [V].

### 8.2 Importación idempotente (`POST /sessions/import`)

```ts
// userId del token (B1), puesto por el servidor en cada fila
await repo.createQueryBuilder().insert().into(Session)
  .values(dtos.map((d) => ({ ...d, userId })))
  .orIgnore().execute();
```

- SQL [V]: Postgres `ON CONFLICT DO NOTHING`; MySQL `INSERT IGNORE`.
- **Reintento [V]:** el mismo `INSERT` insertó 1 fila la primera vez y 0 la segunda. No quedó duplicado, y el segundo valor de `duration_ms` no pisó al primero.
- **Un `INSERT` de varias filas es atómico:** entran todas o ninguna. El 2xx sale después del commit, así el front puede limpiar `localStorage` sin miedo.
- **Corte en tandas:** Postgres acepta hasta 65.535 parámetros por consulta [D]. Con 4 columnas son ~16.000 filas. Si hay que partir, todas las tandas van dentro de **una** transacción.
- **MySQL:** `INSERT IGNORE` también convierte en warnings otros errores, como datos inválidos [D]. Por eso validar antes con el DTO no es opcional.

### 8.3 Estadísticas por día local

Sesión que empieza 2026-09-16 21:30 en La Paz = 2026-09-17 01:30 UTC. Resultado real [V]:

```sql
-- agrupando por UTC: la sesión cae el 17  -> MAL
-- agrupando por día local: cae el 16      -> BIEN
SELECT (started_at AT TIME ZONE 'America/La_Paz')::date AS dia, SUM(duration_ms)
FROM sessions WHERE user_id = $1 AND started_at >= $2 AND started_at < $3
GROUP BY 1 ORDER BY 1;
```

"La sesión que cruza medianoche cuenta para el día en que empezó" sale sola: se agrupa por `started_at`.

Índice propuesto [P]: `(user_id, started_at)`. Toda consulta de estadísticas filtra por esas dos columnas; sin el índice recorre las sesiones de todos los usuarios.

### 8.4 Sonidos por defecto

`user_id NULL` = sonido por defecto. Editar o borrar: `WHERE id = $1 AND user_id = $2`. Un sonido por defecto nunca matchea, así que la regla "no se tocan" sale del mismo `WHERE` (B2).

---

## 9. Validación y configuración

- **Bodies [P]:** `class-validator` con `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })` global. Motivo: es lo que usan 13 de 16 repos y lo que enseña el capítulo de validación. Si Jason declaró Nest, esto es lo que le van a preguntar.
- **Alternativa:** Zod con `@Body({ schema })` + `StandardSchemaValidationPipe`, nuevo en Nest 12 [V]. Ventaja: el mismo esquema se podría compartir con el front. Diferencia de comportamiento en T10.
- **Variables de entorno [P]:** Zod en `ConfigModule.forRoot({ isGlobal: true, validationSchema })` (T12). Es la recomendación nueva de Nest 12. Leer con `config.getOrThrow()`.
- **CORS:** `app.enableCors({ origin: <url exacta del front> })` [D]. Sin nginx no hay otro lugar (`proyecto.md` §8). Si el token viaja en cookie se agrega `credentials: true`, y el origen no puede ser `*`.

---

## 10. Tests

- Vitest (T2). `npm test` ya corre una sola pasada (`vitest run`): no necesita `--run`, a diferencia del front.
- **Base de datos sin Docker [V]:** `@electric-sql/pglite-socket` levanta un Postgres local por puerto. Contra él TypeORM generó y corrió migraciones, y la app consultó. Límites: acepta 1 conexión salvo `--max-connections=N`, y es Postgres compilado a WASM, no el servidor de producción. Solo sirve si se elige Postgres. Docker Desktop está instalado pero el daemon estaba apagado.
- **Prioridad:** (1) usuario A no lee ni pisa datos de B; (2) importar dos veces no duplica; (3) la frontera del día local. Es lo que duele si se rompe y no se ve en la UI.

---

## 11. Decisiones abiertas del backend — ninguna tomada, preguntar a Jason

| # | Tema | Evidencia | Propuesta de Claude |
|---|---|---|---|
| A1 | **PostgreSQL vs MySQL** (ya en `proyecto.md` §8) | Tabla de abajo. Muestra: 14 de 16 usan Postgres; 3 soportan MySQL (nest-admin solo MySQL, Gauzy y Vendure varios motores). | Ninguna. Es producto vs entrevista: decide Jason. |
| A2 | **ORM** | TypeORM 7, Prisma 7 (contando cal.com), Kysely 1, Mongoose 1. | TypeORM: el capítulo SQL de Nest es TypeORM [D], tiene paquete oficial, y el ciclo de migraciones en ESM está verificado. Prisma: esquema en otro lenguaje, código generado, T8. |
| A3 | Validación de bodies | §9 | class-validator |
| A4 | **Token en el front:** `localStorage` + `Authorization: Bearer`, o cookie `httpOnly` | En `localStorage`, un XSS roba el token; CORS simple. En cookie, JS no lo lee, pero pide `credentials`, `SameSite` y, si front y back quedan en dominios distintos, es cookie de terceros. Eso depende del despliegue. 9 de 16 declaran `cookie-parser` (señal débil: no prueba dónde va el JWT). | Ninguna hasta decidir despliegue. Toca R1 del front. |
| A5 | Refresh token | Sin refresh no se puede revocar un token antes de que venza. Con refresh hay una tabla más y un endpoint más. | Solo access token en el MVP, con vencimiento corto. Revisar en fase 3. |
| A6 | Límite de intentos de login | T7 | Esperar versión compatible, o `overrides` en `package.json` aceptando el riesgo. |
| A7 | Capa de repositorio propia | §4.1: 9 vs 7 | Sin capa (§4.3). |
| A8 | **Tipos compartidos front/back** | Twenty: paquete `twenty-shared`. Ghostfolio: `libs/common`. Immich: genera un SDK desde OpenAPI (`open-api/` → `packages/sdk`). | Ninguna. Duplicar a mano es lo más simple; un paquete compartido obliga a workspaces de npm. |
| A9 | ESM vs CommonJS | Muestra: 2 de 16 en ESM (Immich, AFFiNE). Generador y documentación de Nest 12: ESM. | ESM. Costo: T1. |

**A1 en detalle — lo que cambia en Focus:**

| Punto | PostgreSQL | MySQL |
|---|---|---|
| UUID como PK | `uuid` nativo [V] | `varchar(36)` [V] |
| Importación idempotente | `ON CONFLICT DO NOTHING` [V real] | `INSERT IGNORE`, que además traga otros errores [V SQL, D semántica] |
| Día local | `timestamptz` + `AT TIME ZONE 'America/La_Paz'` [V real] | No hay tipo con zona. `CONVERT_TZ` con nombre de zona necesita tablas de zonas cargadas; `'-04:00'` fijo sirve porque Bolivia no tiene horario de verano [D] |
| Driver Node | estable con `timestamptz` [V] | `timezone: 'local'` por defecto, fijar `'Z'` [V] |
| Migración que falla a la mitad | TypeORM la envuelve en transacción [V]; Postgres revierte DDL [D] | `CREATE`/`ALTER` hacen commit implícito: queda a medio aplicar [D] |
| Tests sin Docker | PGlite [V] | Sin equivalente verificado |
| SI ESAM | — | Usa MySQL (dato de Jason) |

---

## 12. Comandos verificados

### 12.1 Generar (desde la raíz `focus/`)

```bash
rm focus_back/README.md          # si no, falla con "merge conflict" (T13)
npx @nestjs/cli@12 new focus_back --skip-git --package-manager npm --no-observe
# --skip-git: si no, crea un .git anidado dentro del monorepo (T13)
```

Después: **crear `focus_back/.gitignore`**, porque con `--skip-git` no se genera. Contenido mínimo (del que genera el CLI sin `--skip-git`): `/dist`, `/node_modules`, `/coverage`, `*.tsbuildinfo`, `*.log`, `.env`, `.env.*.local`.

### 12.2 Antes de dar por terminado un cambio en `focus_back/`

`CLAUDE.md` §5 solo cubre el front. Para el back:

```bash
npm run build       # incluye el chequeo de tipos
npm run lint        # oxlint, sin --fix
npm test            # vitest run, una pasada
npm run test:e2e
```

### 12.3 Migraciones TypeORM en ESM [V]

El CLI de TypeORM corre contra el **código compilado**. No hace falta `ts-node`. La entidad se importa explícita en el `data-source.ts`.

```ts
// src/database/data-source.ts
export default new DataSource({
  type: 'postgres', url: process.env.DATABASE_URL,
  entities: [Session],
  migrations: ['dist/database/migrations/*.js'],
});
```

```bash
npm run build
npx typeorm migration:generate -d dist/database/data-source.js src/database/migrations/<Nombre>
npm run build
npx typeorm migration:run -d dist/database/data-source.js
```

Verificado: genera el `CREATE TABLE` con `uuid` y `TIMESTAMP WITH TIME ZONE`, lo corre entre `START TRANSACTION` y `COMMIT`, y un segundo `generate` responde "No changes in database schema". `migration:revert` existe pero **no se corrió**.

---

## Apéndice A — La evidencia detrás de §4 y §11

Método: árbol completo de cada repo con `git clone --filter=blob:none --depth 1` (no gasta la API de GitHub), a HEAD del 2026-09-16. Luego `package.json`, `schema.prisma` y un servicio por repo leídos del mismo clon.

| Repo | Qué es | Nest | Nivel superior | ORM / motor | Capa de datos propia |
|---|---|---|---|---|---|
| ever-gauzy | **ERP/CRM/HRM** | 11 | dominio en `lib/` (154) + CQRS | TypeORM + MikroORM / pg, mysql, sqlite | Sí |
| permacoop | **ERP** de cooperativa | 9 | capas `Domain/ Application/ Infrastructure/` + CQRS | TypeORM / pg | Sí |
| nest-admin | **Panel** Vue + Nest | 11 | dominio en `modules/` (9) | TypeORM / **MySQL** | No |
| twenty | **CRM** | 11 | dominio en `modules/` + `engine/` | TypeORM / pg | No (repositorio de su ORM) |
| ToolJet | Herramientas internas | 11 | dominio en `modules/` (70) | TypeORM / pg | Sí |
| Vendure | E-commerce | 11 | **por tipo** `api/ service/ entity/` | TypeORM / pg, mysql, sqlite | No |
| brocoders | Boilerplate | 11 | dominio en `src/` + hexagonal | TypeORM / pg | Sí |
| Ghostfolio | Finanzas | 11 | dominio en `app/` (22) | Prisma / pg | No |
| cal.com v2 | Agenda | 10 | dominio en `modules/` (30) | Prisma + Kysely / pg | Sí |
| Hoppscotch | Cliente de APIs | 11 | dominio en `src/` (30) | Prisma / pg | No |
| Amplication | Generador de código | 9 | dominio en `core/` (51) | Prisma / pg | No |
| Teable | Base no-code | 10 | dominio en `features/` (56) | Prisma + Kysely / pg | No |
| AFFiNE | Documentos | 11 | dominio en `core/` + `plugins/` | Prisma / pg | Sí (`models/`) |
| Postiz | Redes sociales | 11 | dominio en `libraries/…/database/prisma/` | Prisma / pg | Sí |
| Novu | Notificaciones | 11 | dominio en `app/` (60) + `usecases/` | Mongoose / Mongo | Sí (`libs/dal`) |
| Immich | Fotos | **12** | **por tipo** `controllers/ services/ repositories/` | Kysely / pg | Sí |

**Otras cuentas (repos que lo declaran, de 16):** Express 15, Fastify 1 · class-validator 13, zod 9 · `@nestjs/passport` 12 · `@nestjs/swagger` 12 · jest 12, vitest 6 (varios tienen los dos) · bcrypt 10 + bcryptjs 1, argon2 3 · `@nestjs/config` 10 · GraphQL 6 · `@nestjs/cqrs` 2 · `cookie-parser` 9.

**Descartado:** Reactive-Resume. Ya no es Nest: pasó a Hono + oRPC + Drizzle.

**Límites, declarados:** 16 repos elegidos a mano, todos de código abierto, sesgados hacia productos grandes. La búsqueda de "ERP en Nest" en GitHub trajo casi solo repos de 1 a 5 estrellas: los ERP de la muestra son pocos. Solo Immich está en Nest 12: la muestra describe cómo se escribió Nest 9-11, no cómo se escribe desde hace tres semanas. "Capa de datos propia" se clasificó por nombres de archivo más la lectura de un servicio; no se leyó cada servicio.

> El estándar de trabajo del proyecto y los errores ya cometidos están en `CLAUDE.md` §4.
