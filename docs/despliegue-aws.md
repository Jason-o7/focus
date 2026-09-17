# Focus — Cómo despliegan las empresas en AWS

> **Lector previsto:** una instancia de Claude sin contexto previo. Jason casi no lo lee (D6).
> **Alcance: solo despliegue.** Producto y fases: `proyecto.md`. Código del back: `backend-arquitectura.md`.
> **Fecha de la investigación:** 2026-09-16. Precios de la API pública de AWS, publicación del 2026-09-10/11.
> **La decisión de despliegue sigue ABIERTA** (`proyecto.md` §8). Este archivo informa, no decide.
> Si una instrucción directa de Jason contradice este archivo, gana Jason.

---

## 0. Etiquetas

- **[M]** medido por Claude en esta investigación: API de precios, conteos de GitHub, latencia. Método en cada sección.
- **[D]** documentado por AWS, GitHub o Nest. Leído en la fuente, no corrido.
- **[E]** encuesta o reporte de terceros. Cada uno trae su sesgo de muestra, anotado al lado.
- **[I]** inferencia de Claude. No es dato.
- **[A]** abierto. Preguntar a Jason (§13).

**No existe una fuente que mida "cómo despliegan las empresas" en general.** Las encuestas miden uso de herramientas, no arquitecturas. Todo lo que diga "lo más común" en este archivo tiene su medición al lado o está marcado [I].

---

## 1. Lo que cambia decisiones (leer esto si no hay tiempo)

1. **App Runner está cerrado a clientes nuevos desde el 30/04/2026 [D].** Copilot CLI quedó sin soporte el 12/06/2026 [D]. Los tutoriales de 2023-2025 los recomiendan. **No proponerlos.** Reemplazo oficial: **ECS Express Mode** (lanzado el 21/11/2025) [D].
2. **La fase 1 de Focus es solo front estático.** Alcanza con S3 + CloudFront, o Amplify Hosting. El despliegue del backend se puede decidir recién en la fase 2 [I].
3. **Los tres huecos de "nada de nginx"** (`proyecto.md` §8) los cubren servicios gestionados. HTTPS: ACM en CloudFront o en el ALB. Estáticos: S3 + CloudFront. CORS: si CloudFront enruta `/api/*` al backend, front y API comparten dominio y no hay CORS [D, re:Post]. **Eso cambia la decisión A4 de `backend-arquitectura.md` §11**: con un solo dominio, la cookie `httpOnly` deja de ser de terceros [I].
4. **El piso de costo lo ponen el ALB y la NAT, no el cómputo.** ALB: USD 16,43/mes solo por existir. NAT Gateway: USD 32,85/mes. Una tarea Fargate chica: USD 9 [M, us-east-1].
5. **Cuenta nueva con Free Plan:** vence a los 6 meses o al gastar los créditos. Después hay 90 días para pasar a pago; si no, AWS **cierra la cuenta y borra los recursos** [D]. Un stack de USD 50/mes gasta USD 100 de créditos en dos meses [I, aritmética].
6. **São Paulo (sa-east-1) cuesta entre 1,5 y 2,1 veces más que Virginia (us-east-1)** y gana unos 30 ms por ida y vuelta desde Sucre [M].

---

## 2. Qué se usa según encuestas [E]

| Fuente | Dato | Sesgo de la muestra |
|---|---|---|
| Stack Overflow 2025, desarrolladores profesionales | Docker 73,8%, AWS 45,9%, Kubernetes 30,1%, Terraform 18,7%, Ansible 11,2% | Mide "trabajo extenso en el último año", no cómo despliegan. CDK, CloudFormation y Pulumi no figuran en la lista. |
| CNCF Annual Survey 2025 (publicada 20/01/2026) | 82% de quienes usan contenedores corren Kubernetes en producción | Encuestados de la comunidad CNCF: sesgo fuerte a favor de Kubernetes. |
| Datadog, State of Containers and Serverless 2025 | Lambda en 65% de clientes AWS. 66% de quienes usan funciones serverless también usan orquestación de contenedores en la misma nube. | Clientes de Datadog: empresas con monitoreo pago, más maduras que el promedio. |
| Datadog, Container Report (2023) | 46% de las organizaciones con contenedores usa contenedores serverless (Fargate, App Runner y equivalentes) | Mismo sesgo. |
| AWS, FAQ de ECS | "Más del 65% de los clientes nuevos de contenedores en AWS usan ECS" | Lo dice el vendedor. Sin método ni fecha. |

Lectura [I]: casi todos empaquetan en Docker. Kubernetes es fuerte en organizaciones grandes con equipo de plataforma. Entre quienes empiezan con contenedores en AWS, ECS domina según AWS.

---

## 3. Qué se usa según código público [M]

**Método.** Conteo de "Used by" (`/network/dependents`) de GitHub para cada acción de despliegue, el 2026-09-16. Cuenta repos públicos que referencian la acción en un workflow. Varias acciones tienen más de una pestaña de paquete; se tomó la de la acción. Una primera pasada dio 0 en tres de ellas por leer la pestaña equivocada.

| Acción de GitHub | Repos | Qué indica |
|---|---:|---|
| `docker/build-push-action` | 849.574 | Construir imagen (no es solo AWS) |
| `aws-actions/configure-aws-credentials` | 250.776 | Cualquier paso que toque AWS |
| `appleboy/ssh-action` | 138.619 | SSH a una VM (no es solo AWS) |
| `aws-actions/amazon-ecr-login` | 113.829 | Subir imagen a ECR |
| `hashicorp/setup-terraform` | 103.785 | Terraform (cualquier nube) |
| `azure/setup-helm` | 37.893 | Kubernetes (cualquier nube) |
| `aws-actions/amazon-ecs-deploy-task-definition` | 37.791 | Desplegar en ECS |
| `jakejarvis/s3-sync-action` | 22.661 | Front estático a S3 |
| `azure/setup-kubectl` | 16.949 | Kubernetes (cualquier nube) |
| `einaregilsson/beanstalk-deploy` | 11.184 | Elastic Beanstalk |
| `aws-actions/aws-cloudformation-github-deploy` | 3.939 | CloudFormation |
| `serverless/github-action` | 3.603 | Serverless Framework (Lambda) |
| `pulumi/actions` | 2.253 | Pulumi |
| `aws-actions/aws-codebuild-run-build` | 671 | CodeBuild |
| `aws-actions/aws-lambda-deploy` | 152 | Lambda |
| `aws-actions/amazon-ecs-deploy-express-service` | 15 | ECS Express Mode (tiene 10 meses) |

**Descargas semanales de npm (2026-09-16):** `aws-cdk` 3,27 M, `aws-cdk-lib` 3,20 M, `@pulumi/aws` 1,57 M, `serverless` 0,94 M, `sst` 0,80 M, `@codegenie/serverless-express` 0,40 M, `cdktf` 0,24 M, `@nestjs/mau` 33,8 mil. Las descargas incluyen cada corrida de CI: miden actividad, no cantidad de proyectos.

**Límites de esta medición.** Solo repos públicos, con muchos tutoriales y forks. Las empresas despliegan en repos privados, y con Jenkins, GitLab CI o CodePipeline, que acá no aparecen. CDK se corre con `npx cdk deploy`, sin acción propia: en la tabla es invisible, en npm no.

Lectura [I]: el flujo más visible es **imagen Docker → ECR → ECS**, y en paralelo **SSH a una VM**. Terraform es la herramienta de infraestructura como código (IaC) más visible en workflows. CDK es fuerte en el ecosistema TypeScript.

---

## 4. Los seis patrones

### P1. Front estático: S3 + CloudFront
- Bucket S3 **privado**. CloudFront lo lee con Origin Access Control (OAC) [D].
- Certificado ACM gratis. **Para CloudFront el certificado tiene que estar en us-east-1**, sin importar la región del resto [D].
- **SPA con rutas del router:** al recargar `/historial`, S3 devuelve 403 o 404. Se configura una respuesta de error: 403 y 404 → `/index.html` con código 200 [D]. `index.html` con TTL corto (`max-age=60`) [D].
- **Trampa [I]:** las respuestas de error son de toda la distribución, no de un comportamiento. Si la misma distribución enruta `/api/*` al backend, un 404 real de la API llega como 200 con HTML. Salida: reescribir a `/index.html` con una CloudFront Function solo en el comportamiento de S3.
- Alternativa: **Amplify Hosting**. Trae CI, dominio y HTTPS. Build USD 0,01/min, almacenamiento USD 0,023/GB, tráfico USD 0,15/GB [M].
- Despliegue típico: `npm run build` → `aws s3 sync dist/ s3://bucket` → invalidación de CloudFront [I]. La acción de sync tiene 22.661 repos (§3).

### P2. Contenedores sin administrar servidores: ECR + ECS Fargate + ALB
- La imagen va a ECR. ECS la corre en Fargate. El ALB termina HTTPS con ACM y reparte tráfico [D].
- **ECS Express Mode** arma todo con tres datos: imagen, rol de ejecución y rol de infraestructura [D]. Crea cluster, servicio, ALB con HTTPS, dominio propio de AWS, autoescalado, logs y una alarma de despliegue fallido [D]. Sin cargo extra: se pagan los recursos [D]. Hasta 25 servicios comparten un ALB [D].
- **Valores por defecto de Express Mode que importan [D]:**
  - 1 vCPU y 2 GB, x86. Son USD 36/mes por tarea [M]. Se bajan con `--cpu` y `--memory`.
  - Contenedor en el **puerto 80**. Nest escucha en 3000 por defecto: hay que alinear uno de los dos [I].
  - **Health check en `/`.** Si el back usa el prefijo `/api` (`backend-arquitectura.md` §4), `/` da 404 y el despliegue falla [I]. Configurar `health-check-path`.
  - Sin subredes indicadas, usa las subredes públicas del VPC por defecto y asigna IP pública a cada tarea: USD 3,65/mes cada una [D][M]. Con subredes privadas crea un ALB **interno**, y la NAT la pone uno [D].
  - Despliegue canary, que no se puede cambiar. Mínimo 1 tarea, máximo 20, escala al 60% de CPU [D].
- Soporta consola, CLI, CloudFormation, CDK y Terraform [D].

### P3. Kubernetes: EKS
- Lo usan organizaciones con equipo de plataforma y muchos servicios [I, coherente con §2].
- Para Focus no tiene sentido: suma complejidad sin resolver ningún problema que Focus tenga [I].

### P4. Máquina virtual: EC2 (o Lightsail) + Docker Compose o PM2
- El más barato en cómputo: t4g.small cuesta USD 12,26/mes más USD 3,65 de IP pública [M]. El disco EBS no se midió.
- Despliegue típico: SSH desde CI, `docker compose pull && up -d` [I]. `appleboy/ssh-action` tiene 138.619 repos (§3).
- **HTTPS no viene resuelto.** Lo termina algo dentro de la VM (nginx, Caddy o el propio Node) o un ALB delante (+USD 16,43) [I]. **Choca con "nada de nginx"** [A].
- Un solo servidor: si se cae la VM, se cae todo. Postgres en la misma VM significa que los respaldos son tu problema [I].

### P5. Funciones: Lambda + Function URL o API Gateway
- Nest corre en Lambda con un adaptador. `@codegenie/serverless-express` tiene 0,40 M de descargas semanales [M].
- **Arranque en frío** (Nest docs, medido en una MacBook de 2014, no en Lambda) [D]: Nest con Express, sin empaquetar, tarda 197 ms. Empaquetado con webpack, 81,5 ms. Express solo, 7,9 ms. Si conectar a la base tarda 2 s, cada arranque en frío suma 2 s [D].
- Nest docs: correr una aplicación monolítica como función "normalmente no tiene mucho sentido" [D].
- Gratis siempre: 1 M de peticiones y 400.000 GB-s por mes [M].
- Lambda dentro de la VPC para llegar a RDS pierde salida a internet sin NAT [I].

### P6. PaaS simplificados
- **Elastic Beanstalk:** sigue vivo. Node.js 24 sobre Amazon Linux 2023, con actualizaciones en agosto de 2026 [D]. Retiró la rama Node 20 [E]. Beanstalk-deploy: 11.184 repos (§3).
- **Lightsail:** precio fijo. Contenedores con endpoint HTTPS y dominio por defecto; hasta 20 nodos con balanceo incluido [D]. Micro (0,25 vCPU, 1 GB) USD 9,81/mes. Base PostgreSQL 1 GB USD 14,72/mes [M]. Hay en sa-east-1 [M].
- **Mau** (`@nestjs/mau`): la plataforma oficial de Nest para desplegar en AWS. `nest deploy` la instala [D]. Tiene planes pagos; **precio no verificado**. Es una capa sobre AWS: no enseña AWS [I].

### Base de datos (vale para P2 a P6)
- **RDS PostgreSQL** db.t4g.micro Single-AZ: USD 11,68/mes, más USD 0,115/GB-mes de disco gp3 [M].
- **Aurora Serverless v2:** USD 0,12 por ACU-hora [M]. Con 0,5 ACU todo el mes son USD 43,80 [I, aritmética].
- La base va en subred privada y solo acepta conexiones del grupo de seguridad del backend [I, práctica habitual; no medida].

---

## 5. Cerrados o en retirada: trampa de tutoriales

| Servicio | Estado | Reemplazo que indica AWS |
|---|---|---|
| App Runner | Cerrado a clientes nuevos desde 30/04/2026. Sin funciones nuevas [D] | ECS Express Mode [D] |
| Copilot CLI | Sin soporte desde 12/06/2026 [D] | ECS Express Mode o constructos L3 de CDK [D] |
| Cloud9 | Cerrado a clientes nuevos (julio 2024) [D] | — |
| CodeCommit | Cerrado en julio 2024, **reabierto a todos el 24/11/2025** [D] | — |

Regla [I]: antes de proponer un servicio de AWS que aparece en un tutorial, verificar que acepte clientes nuevos.

---

## 6. Cómo se despliega sin tirar producción

- **Rolling update con circuit breaker (ECS) [D]:** reemplaza tareas de a poco. Si las nuevas no llegan a estado estable, **vuelve solo al último despliegue COMPLETED**. Si no hay ninguno COMPLETED, el despliegue queda trabado y no lanza tareas.
- **Blue/green nativo en ECS (julio 2025) [D]:** levanta la versión nueva al lado de la vieja, la valida con hooks, pasa el tráfico, espera un tiempo de observación y puede volver atrás sin corte.
- **Canary (por defecto en Express Mode) [D]:** una parte del tráfico va primero a la versión nueva. Una alarma de CloudWatch detecta el fallo.
- **`versionConsistency` [D]:** la etiqueta de imagen se resuelve a su digest. Si alguien pisa `:latest` a mitad del despliegue, no se mezclan versiones.
- **Migraciones de base [I]:** en rolling, canary y blue/green **las dos versiones corren a la vez**. Toda migración tiene que ser compatible con el código viejo. Patrón expandir/contraer: primero agregar (columna nueva, nullable). Desplegar el código. Recién en un despliegue posterior borrar lo viejo. La migración corre como tarea aparte **antes** del rollout, no al arrancar cada réplica, porque dos réplicas la correrían a la vez.
- **Health check [D, Nest docs]:** `@nestjs/terminus`. Es lo que mira el ALB para decidir si la tarea sirve.

---

## 7. CI/CD desde GitHub

- **OIDC, sin claves fijas [D, GitHub docs].** En AWS se registra el proveedor `https://token.actions.githubusercontent.com` con audiencia `sts.amazonaws.com`. Un rol IAM confía en ese repo. El workflow pide `permissions: id-token: write` y `configure-aws-credentials` cambia el token por credenciales temporales. Ninguna clave de AWS queda guardada en GitHub.
- La medición de §3 no distingue OIDC de claves fijas: `gh` no está instalado y la búsqueda de código de GitHub exige autenticación.
- Monorepo [I]: un workflow por subproyecto, filtrado con `paths: focus_front/**` y `paths: focus_back/**`.

---

## 8. Organización de cuentas en una empresa

- **Varias cuentas de AWS, no una [D, whitepaper "Organizing Your AWS Environment"].** Separan entornos (dev/prod) con controles distintos, limitan el alcance de un incidente, reparten costos y cuotas.
- Infraestructura como código en vez de clics en la consola [E, §2 y §3].
- **Para Focus [I]:** una sola cuenta. Además, meter una cuenta Free Plan en AWS Organizations la **pasa a pago y pierde los créditos** [D, términos del Free Tier].

---

## 9. Cuenta nueva: Free Plan y trampas de costo

- Desde el 15/07/2025: USD 100 en créditos al registrarse, y hasta USD 100 más por completar actividades [D]. Los créditos vencen a los 12 meses [D].
- **Free Plan:** vence a los 6 meses o al agotar los créditos. Después, 90 días para pasar a pago; si no, cierre y borrado [D]. Algunos servicios exigen Paid Plan [D]; la lista no se revisó.
- Las cuentas creadas antes del 15/07/2025 siguen con el modelo viejo de 12 meses [E].
- **IPv4 pública: USD 0,005/hora (USD 3,65/mes) por dirección, en uso u ociosa** [M]. Aplica a EC2, RDS, ALB y tareas Fargate con IP pública.
- **CloudFront tarifa plana** (noviembre 2025) [D]: Free USD 0, Pro USD 15, Business USD 200. El Free trae 1 M de peticiones, 100 GB y 5 GB de crédito S3. Máximo 3 planes Free por cuenta. **No son elegibles las cuentas "usando AWS Free Tier"** [D]; no queda claro si incluye una cuenta de pago con créditos. Sin sobrecargos: si se excede, AWS puede degradar la entrega [D].

---

## 10. Precios medidos [M]

API pública `pricing.us-east-1.amazonaws.com/offers/v1.0/aws/<servicio>/current/region_index.json`, sin credenciales. On-demand. Mes = 730 h. Scripts en el scratchpad de la sesión (`precio.mjs`), no versionados.

| Recurso | us-east-1 | sa-east-1 | Mes us-east-1 |
|---|---|---|---:|
| Fargate vCPU-hora | 0,04048 | 0,0696 | — |
| Fargate GB-hora | 0,004445 | 0,0076 | — |
| Fargate 0,25 vCPU + 0,5 GB | — | — | 9,01 (sa: 15,48) |
| Fargate 1 vCPU + 2 GB (Express por defecto) | — | — | 36,04 (sa: 61,90) |
| ALB hora | 0,0225 | 0,034 | 16,43 (sa: 24,82) |
| ALB LCU-hora | 0,008 | 0,011 | según tráfico |
| NAT Gateway hora / GB procesado | 0,045 / 0,045 | 0,093 / 0,093 | 32,85 (sa: 67,89) |
| IPv4 pública hora | 0,005 | 0,005 | 3,65 |
| RDS PostgreSQL db.t4g.micro Single-AZ | 0,016 | 0,034 | 11,68 (sa: 24,82) |
| RDS gp3 GB-mes | 0,115 | 0,219 | 2,30 por 20 GB |
| Aurora PostgreSQL Serverless v2, ACU-hora | 0,12 | 0,25 | — |
| EC2 t4g.micro / t4g.small | 0,0084 / 0,0168 | 0,0134 / 0,0268 | 6,13 / 12,26 |
| Lightsail VM 1 GB / 2 GB (con IPv4) | 0,0094 / 0,01612 | no medido | 6,86 / 11,77 |
| Lightsail contenedor Nano / Micro | 0,0094 / 0,01344 | no medido | 6,87 / 9,81 |
| Lightsail PostgreSQL 1 GB | 0,02016 | no medido | 14,72 |
| Secrets Manager por secreto | 0,40/mes | — | 0,40 |
| ECR GB-mes | 0,10 | — | — |
| Lambda: millón de peticiones / GB-s | 0,20 / 0,0000166667 | — | gratis bajo 1 M y 400 mil GB-s |

Hay un SKU de Lightsail `ContainerSvcUsage:Micro-0.25CPU-1GB-Free` a USD 0. Las condiciones de esa oferta no se verificaron.

**Stacks armados con esos precios** (us-east-1, sin transferencia, logs, dominio ni disco EC2) [I, aritmética]:

| Stack | USD/mes |
|---|---:|
| Express Mode por defecto (1 vCPU/2 GB) + ALB + 2 IPv4 del ALB (supuesto: una por zona) + IPv4 de la tarea + RDS micro 20 GB | ~77 |
| Lo mismo con 0,25 vCPU/0,5 GB | ~50 |
| Lo anterior con tareas en subred privada y NAT | ~80 |
| Lightsail: contenedor Micro + PostgreSQL 1 GB | ~25 |
| EC2 t4g.small + IPv4, Postgres en la misma VM, sin ALB | ~16 + disco |
| Front S3 + CloudFront con poco tráfico | centavos (no medido) |

---

## 11. Latencia medida desde Sucre [M]

`curl -w %{time_connect}` a `ec2.<región>.amazonaws.com`, 6 muestras, conexión de Jason, 2026-09-16. El connect TCP equivale a una ida y vuelta.

| Región | Rango | Típico |
|---|---|---|
| sa-east-1 (São Paulo) | 97–116 ms | ~104 ms |
| us-east-1 (Virginia) | 127–165 ms | ~135 ms |
| us-east-2 (Ohio) | 147–188 ms | ~155 ms |

Lectura [I]: para un temporizador que hace pocas peticiones, 30 ms no se notan. El precio en São Paulo sí se nota (§10). El front estático sale de CloudFront, que tiene nodos propios: la región no le cambia la latencia.

---

## 12. Aplicado a Focus (opciones, no decisión)

**Fase 1 (solo front):** S3 + CloudFront + ACM, o Amplify Hosting. Casi gratis. No toca nginx ni CORS [I].

**Fase 2, cómo tapa cada opción los tres huecos** [I salvo donde se indica]:

| Opción | HTTPS | Estáticos | CORS | USD/mes aprox. | Qué enseña para SI ESAM |
|---|---|---|---|---:|---|
| A. CloudFront (S3 + `/api/*` → ALB) + ECS Express Mode + RDS | ACM en CloudFront y en el ALB [D] | S3 [D] | Mismo dominio, no hay CORS [D] | ~50 | Contenedores, ALB, despliegue con rollback: lo que pregunta la entrevista ("tirás el servidor con un despliegue") |
| B. S3 + CloudFront para el front, Lightsail contenedor + base Lightsail | Incluido en Lightsail [D] | S3 | Dominios distintos: CORS en Nest (`backend-arquitectura.md` §9) | ~25 | Menos AWS "real": Lightsail esconde VPC, IAM y ALB |
| C. S3 + CloudFront, EC2 con Docker Compose y Postgres | Lo termina algo en la VM: **choca con "nada de nginx"** | S3 | CORS en Nest, o `/api/*` por CloudFront hacia la EC2 | ~16 | Linux y Docker a mano. Un servidor sin respaldo |
| D. S3 + CloudFront, Nest en Lambda + RDS | Function URL o API Gateway [D] | S3 | Mismo dominio si pasa por CloudFront | ~14 + Lambda casi gratis | Arranque en frío y conexiones a la base: problemas que un ERP con servidor no tiene |

Notas:
- Con A, la cookie `httpOnly` es de primera parte. Eso reabre A4 de `backend-arquitectura.md` a favor de la cookie [I].
- Con A, en la trampa de §4 P1: no usar respuestas de error globales para la SPA.
- Con créditos de USD 100-200, A dura 2 a 4 meses gratis. B, 4 a 8. Pero el Free Plan vence a los 6 meses igual (§9) [I].

---

## 13. Preguntas abiertas para Jason [A]

1. ¿Tiene cuenta de AWS? ¿Free Plan o Paid Plan, y de qué fecha? Define créditos, plazo y si puede usar CloudFront con tarifa plana.
2. ¿Cuánto está dispuesto a pagar por mes cuando se acaben los créditos?
3. "Nada de nginx": ¿significa ningún proxy inverso en la VM (tampoco Caddy), o solo nginx? Descarta o no la opción C.
4. ¿Por qué AWS: aprender lo que usa SI ESAM, el CV, o solo hospedar? Si es aprender, A enseña más; si es hospedar barato, B o C.
5. ¿Dominio propio? Sin dominio, CloudFront y Express Mode dan URLs de AWS con HTTPS, pero front y API quedan en dominios distintos salvo que CloudFront enrute `/api/*`.
6. ¿Región: us-east-1 (barata) o sa-east-1 (cercana)?
7. ¿Infraestructura como código desde el día 1 (CDK en TypeScript o Terraform), o consola primero?

---

## 14. Fuentes

- App Runner, cambio de disponibilidad: https://docs.aws.amazon.com/apprunner/latest/dg/apprunner-availability-change.html
- Fin de soporte de Copilot CLI: https://aws.amazon.com/blogs/containers/announcing-the-end-of-support-for-the-aws-copilot-cli/
- ECS Express Mode, anuncio: https://aws.amazon.com/about-aws/whats-new/2025/11/announcing-amazon-ecs-express-mode/
- ECS Express Mode, valores por defecto: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-work.html
- ECS circuit breaker: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/deployment-circuit-breaker.html
- ECS blue/green nativo: https://aws.amazon.com/about-aws/whats-new/2025/07/amazon-ecs-built-in-blue-green-deployments/
- ECS FAQ (dato del 65%): https://aws.amazon.com/ecs/faqs/
- CloudFront, planes de tarifa plana: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/flat-rate-pricing-plan.html
- CloudFront, certificado en us-east-1: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/cnames-and-https-requirements.html
- CloudFront y SPA: https://repost.aws/knowledge-center/cloudfront-single-page-application
- CloudFront, rutas a varios orígenes: https://repost.aws/knowledge-center/cloudfront-requests-origins
- Free Tier, anuncio: https://aws.amazon.com/about-aws/whats-new/2025/07/aws-free-tier-credits-month-free-plan/
- Free Tier, términos: https://aws.amazon.com/free/terms/
- Lightsail, contenedores: https://docs.aws.amazon.com/lightsail/latest/userguide/amazon-lightsail-container-services.html
- Elastic Beanstalk, Node 24: https://aws.amazon.com/about-aws/whats-new/2025/12/elastic-beanstalk-node-js-24-linux-2023
- CodeCommit vuelve a GA: https://aws.amazon.com/blogs/devops/aws-codecommit-returns-to-general-availability/
- Cloud9 cerrado: https://docs.aws.amazon.com/cloud9/latest/user-guide/tutorials.html
- Varias cuentas: https://docs.aws.amazon.com/whitepapers/latest/organizing-your-aws-environment/benefits-of-using-multiple-aws-accounts.html
- GitHub OIDC con AWS: https://docs.github.com/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services
- Nest, serverless (arranque en frío): https://github.com/nestjs/docs.nestjs.com/blob/master/content/faq/serverless.md
- Nest, despliegue y Mau: https://github.com/nestjs/docs.nestjs.com/blob/master/content/deployment.md
- Stack Overflow 2025: https://survey.stackoverflow.co/2025/technology
- CNCF 2025: https://www.cncf.io/announcements/2026/01/20/kubernetes-established-as-the-de-facto-operating-system-for-ai-as-production-use-hits-82-in-2025-cncf-annual-cloud-native-survey/
- Datadog 2025: https://www.datadoghq.com/state-of-containers-and-serverless/
- Datadog Container Report: https://www.datadoghq.com/container-report/
