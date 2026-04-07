# LocalStack Setup

Este proyecto usa **LocalStack** para simular servicios de AWS localmente durante el desarrollo.

## ¿Qué es LocalStack?

LocalStack es una herramienta que simula servicios AWS (DynamoDB, SQS, EventBridge, Lambda, API Gateway, etc.) en un contenedor Docker local. Permite desarrollar y testear aplicaciones sin usar credenciales reales de AWS.

## Servicios simulados

- **DynamoDB** — Base de datos NoSQL
- **SQS** — Colas de mensajes
- **EventBridge** — Bus de eventos
- **Lambda** — Funciones serverless
- **API Gateway** — API REST

## Inicio rápido

### 1. Iniciar LocalStack

```bash
npm run localstack:up
```

Esto inicia el contenedor de LocalStack. Espera ~10 segundos para que esté listo.

### 2. Inicializar recursos

```bash
npm run localstack:init
```

Esto crea automáticamente:
- Tabla DynamoDB: `restaurant-service-local`
- Colas SQS: `restaurant-order-local`, `restaurant-ingredient-local`, `restaurant-dish-local`
- Event Bus: `restaurant-service-local`
- Reglas de enrutamiento de eventos

### 3. Deploy a LocalStack

```bash
npm run deploy:local
```

Esto deployea tu aplicación serverless completa a LocalStack (como un deploy real, pero local). Las Lambdas se ejecutan en contenedores Docker dentro de LocalStack.

### 4. Seed de datos

```bash
npm run seed:local
```

Esto invoca la función `seedData` en LocalStack para cargar datos iniciales.

## Workflows comunes

### Workflow completo (Recomendado)

```bash
# Terminal 1: Iniciar LocalStack
npm run localstack:up
npm run localstack:init

# Terminal 2: Deploy de aplicación
npm run deploy:local

# Terminal 3: Seed de datos
npm run seed:local
```

Tu API estará disponible en `http://127.0.0.1:4566/local` (o según el endpoint que devuelva el deploy).

### Invocar funciones directamente

```bash
npm run invoke:local seedData -- --stage local --region us-east-1
```

### Reset completo

Si necesitas limpiar todo y empezar de cero:

```bash
npm run localstack:reset
npm run deploy:local
npm run seed:local
```

Esto:
1. Detiene LocalStack
2. Lo reinicia
3. Crea nuevos recursos
4. Deployea la aplicación
5. Carga datos iniciales

### Parar LocalStack

```bash
npm run localstack:down
```

## Diferencias: LocalStack vs serverless-offline

| Aspecto | LocalStack (Deploy) | serverless-offline |
|---------|-----------------|-----------------|
| Lambdas | En contenedores Docker | En memoria localmente |
| Servicios AWS | Emulados (DynamoDB, SQS, etc.) | Solo con LocalStack/Docker |
| Realismo | Muy cercano a producción | Básico |
| Velocidad | Más lento (contenedores) | Más rápido |
| Debugging | Más difícil | Más fácil |
| Networking | Realista (contenedores) | Simple |

**LocalStack es ideal para:** Testing de integración, workflow completo, testing realista

**serverless-offline es ideal para:** Desarrollo rápido, debugging, cambios frecuentes

## Variables de entorno

Los endpoints de LocalStack están configurados en los scripts npm:

- `AWS_ENDPOINT_URL=http://127.0.0.1:4566`
- `DYNAMODB_ENDPOINT=http://127.0.0.1:4566`
- `SQS_ENDPOINT=http://127.0.0.1:4566`
- `EVENTBRIDGE_ENDPOINT=http://127.0.0.1:4566`
- `AWS_ACCESS_KEY_ID=local`
- `AWS_SECRET_ACCESS_KEY=local`
- `REGION=us-east-1`

## Troubleshooting

### LocalStack no inicia

```bash
docker ps
docker logs restaurant-service-localstack
```

### Conexión rechazada en puerto 4566

El contenedor puede tardar algunos segundos en estar listo:

```bash
sleep 10 && npm run deploy:local
```

### Reiniciar desde cero

```bash
npm run localstack:reset
npm run deploy:local
```

### Inspeccionar tabla DynamoDB

```bash
# Listar tablas
aws dynamodb list-tables --endpoint-url http://127.0.0.1:4566 --region us-east-1

# Ver items
aws dynamodb scan \
  --table-name restaurant-service-local \
  --endpoint-url http://127.0.0.1:4566 \
  --region us-east-1
```

### Ver logs de Lambda en LocalStack

```bash
docker logs restaurant-service-localstack | grep -i lambda
```

### Ver colas SQS

```bash
aws sqs list-queues --endpoint-url http://127.0.0.1:4566 --region us-east-1
```

## Notas importantes

- LocalStack requiere Docker ejecutándose
- El primer deploy puede tomar algunos segundos
- Las Lambdas se ejecutan en contenedores, no localmente
- Los datos no persisten entre reinicios (a menos que configures volúmenes)
- El stage local usa recursos separados de dev/prod
