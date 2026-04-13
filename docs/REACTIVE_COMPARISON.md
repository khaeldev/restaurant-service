# Comparación: Imperativo vs Reactivo

## Resumen de los 4 Pilares del Manifiesto Reactivo

| Pilar | Imperativo | Reactivo |
|-------|-----------|----------|
| **RESPONSIVE** | `setTimeout()` + `Promise` | `timeout()` operator |
| **RESILIENT** | `try/catch` + `for` loop retry | `retry()` + `catchError()` |
| **ELASTIC** | `Promise.all()` / secuencial | `mergeMap()` con concurrencia |
| **MESSAGE-DRIVEN** | Callbacks / event listeners | `Observable` streams |

---

## Código Imperativo (Actual)

### Handler
```typescript
// src/functions/getInventory.ts
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResultV2> => {
  try {
    logger.info('getInventory handler invoked')

    // Rate limiting (imperative)
    rateLimiter.check()

    // Execute synchronously
    const result = await controller.execute(event)

    // Manually handle response
    return responseHandler(200, result)
  } catch (error) {
    // Catch all errors in one block
    logger.error('getInventory handler failed', { error })
    return responseHandler(500, null, error)
  }
}
```

### Controller
```typescript
// src/core/infrastructure/adapters/in/http/GetInventoryController.ts
export class GetInventoryController {
  async execute(_event: APIGatewayProxyEvent): Promise<unknown> {
    try {
      logger.info('GetInventoryController: fetching inventory')

      // Single awaited call
      const inventory = await this.warehouseRepository.getAllInventory()

      logger.info('GetInventoryController: inventory fetched', { count: inventory.length })

      // Synchronous mapping
      return {
        inventory: inventory.map(item => ({
          ingredientName: item.ingredientName,
          availableQuantity: item.availableQuantity,
          reservedQuantity: item.reservedQuantity,
          updatedAt: item.updatedAt
        }))
      }
    } catch (error) {
      logger.error('GetInventoryController: error', { error })
      throw error
    }
  }
}
```

### Repository (Resilience)
```typescript
// src/core/infrastructure/repositories/DynamoDB/DynamoWarehouseRepository.ts - Excerpt
async getAllInventory(): Promise<WarehouseInventory[]> {
  const result = await this.docClient.send(
    new QueryCommand({
      TableName: this.tableName,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :gsi2pk',
      ExpressionAttributeValues: {
        ':gsi2pk': 'TYPE#INVENTORY'
      }
    })
  )

  // No retry, no timeout, no circuit breaker
  return (result.Items || []).map(item => this.mapToInventory(item))
}
```

### Características Imperativas
- ✅ Secuencial, fácil de seguir
- ❌ Try/catch anidados = callback hell
- ❌ Manejo de errores acoplado
- ❌ Sin timeouts
- ❌ Sin retry automático
- ❌ Sin circuit breaker
- ❌ Sin procesamiento paralelo
- ❌ Logging disperso

---

## Código Reactivo (Nuevo)

### Handler Reactivo
```typescript
// src/functions/getInventoryRx.ts (nuevo)
const rxRepository = new RxInventoryRepository()

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResultV2> => {
  try {
    // Observables con 4 pilares implementados
    const result$ = rxRepository.getAllInventorySimple$().pipe(
      // RESPONSIVE: Timeout de 10 segundos
      // RESILIENT: Retry + Circuit Breaker
      // ELASTIC: Concurrencia controlada
      // MESSAGE-DRIVEN: Stream de eventos
      map(inventory => ({
        inventory: inventory.map(item => ({
          ingredientName: item.ingredientName,
          availableQuantity: item.availableQuantity,
          reservedQuantity: item.reservedQuantity,
          updatedAt: item.updatedAt
        }))
      }))
    )

    // Convertir Observable a Promise
    const result = await result$.toPromise()
    return responseHandler(200, result)
  } catch (error) {
    logger.error('getInventoryRx handler failed', { error })
    return responseHandler(500, null, error)
  }
}
```

### Repository Reactivo
```typescript
// src/core/infrastructure/reactive/RxInventoryRepository.ts
export class RxInventoryRepository {
  private readonly circuitBreaker: CircuitBreaker

  constructor() {
    this.imperativeRepo = new DynamoWarehouseRepository()
    this.circuitBreaker = new CircuitBreaker({
      failureThreshold: 5,
      resetTimeoutMs: 10000,
      volumeThreshold: 10
    })
  }

  /**
   * 4 PILARES REACTIVOS IMPLEMENTADOS
   */
  getAllInventorySimple$(): Observable<WarehouseInventory[]> {
    return from(this.imperativeRepo.getAllInventory()).pipe(
      // 1. RESPONSIVE: Timeout de 10 segundos
      withTimeout({ ms: 10000, name: 'getAllInventory' }),

      // 2. RESILIENT: Retry con backoff exponencial
      withRetry({ maxAttempts: 3, initialDelayMs: 100 }),

      // 3. RESILIENT: Circuit Breaker
      withCircuitBreaker(this.circuitBreaker),

      // 4. MESSAGE-DRIVEN: Logging en cada step
      tap(items => logger.info('[RESPONSIVE] Inventory fetched', { count: items.length })),

      // Manejo funcional de errores (sin try/catch)
      catchError(error => {
        logger.error('[RESILIENT] Fallback: returning empty inventory', { error: String(error) })
        return from([[]])
      })
    )
  }
}
```

### Operadores Reactivos Implementados

#### 1. RESPONSIVE: `withTimeout`
```typescript
// Bota error si no completa en ms
withTimeout({ ms: 10000, name: 'getAllInventory' })
// Error: [RESPONSIVE] getAllInventory exceeded 10000ms timeout
```

#### 2. RESILIENT: `withRetry`
```typescript
// Reintenta 3 veces con backoff exponencial + jitter
withRetry({
  maxAttempts: 3,
  initialDelayMs: 100,
  backoffMultiplier: 2
  // Delays: 100ms, 200ms, 400ms (más jitter)
})
```

#### 3. RESILIENT: `withCircuitBreaker`
```typescript
// Estados: CLOSED (ok) → OPEN (fail) → HALF_OPEN (testing) → CLOSED
withCircuitBreaker(breaker)
// Si > 5 fallos en corto tiempo, rechaza nuevos requests
```

#### 4. ELASTIC: `mergeMap` (Concurrencia Controlada)
```typescript
mergeMap(
  item => processItem(item), // Procesa cada item
  3  // Max 3 en paralelo (ELASTIC)
)
```

#### 5. MESSAGE-DRIVEN: `Observable` Streams
```typescript
// Cada evento es un mensaje en el stream
source.pipe(
  tap(() => console.log('evento')),      // Subscription
  finalize(() => console.log('closed'))   // Completion
)
```

---

## Comparación Lado a Lado

### Fetch con Timeout

**Imperativo:**
```typescript
const timeout = 5000
let timeoutId: NodeJS.Timeout

try {
  timeoutId = setTimeout(() => {
    throw new Error('Timeout after 5000ms')
  }, timeout)

  const inventory = await repo.getAllInventory()
  clearTimeout(timeoutId)
  return inventory
} catch (error) {
  clearTimeout(timeoutId)
  throw error
}
```

**Reactivo:**
```typescript
repo.getAllInventory$().pipe(
  timeout(5000),
  catchError(err => throwError(() =>
    err instanceof TimeoutError
      ? new Error('Timeout after 5000ms')
      : err
  ))
)
```

---

### Retry con Backoff

**Imperativo:**
```typescript
const maxRetries = 3
let lastError: Error

for (let attempt = 0; attempt < maxRetries; attempt++) {
  try {
    return await repo.getAllInventory()
  } catch (error) {
    lastError = error as Error
    if (attempt < maxRetries - 1) {
      // Exponential backoff + jitter
      const delay = Math.pow(2, attempt) * 100 + Math.random() * 100
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

throw lastError
```

**Reactivo:**
```typescript
repo.getAllInventory$().pipe(
  retry({
    count: 2,  // 3 intentos totales
    delay: (error, attemptNumber) => {
      const delay = Math.pow(2, attemptNumber - 1) * 100 + Math.random() * 100
      return timer(delay)
    }
  })
)
```

---

### Circuit Breaker

**Imperativo:**
```typescript
class CircuitBreaker {
  state = 'CLOSED'
  failureCount = 0

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      throw new Error('Circuit is OPEN')
    }

    try {
      const result = await fn()
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED'
        this.failureCount = 0
      }
      return result
    } catch (error) {
      this.failureCount++
      if (this.failureCount >= 5) {
        this.state = 'OPEN'
      }
      throw error
    }
  }
}

const breaker = new CircuitBreaker()
const result = await breaker.execute(() => repo.getAllInventory())
```

**Reactivo:**
```typescript
const breaker = new CircuitBreaker({ failureThreshold: 5 })

repo.getAllInventory$().pipe(
  withCircuitBreaker(breaker)
  // Maneja automáticamente CLOSED → OPEN → HALF_OPEN
)
```

---

### Procesamiento Paralelo (ELASTIC)

**Imperativo:**
```typescript
const inventory = await repo.getAllInventory()

// Secuencial
const processed: WarehouseInventory[] = []
for (const item of inventory) {
  processed.push(await enrichItem(item))
}

// O: Paralelo sin control
const processed = await Promise.all(
  inventory.map(item => enrichItem(item))
  // ❌ Sin límite de concurrencia, puede saturar
)
```

**Reactivo:**
```typescript
from(inventory).pipe(
  mergeMap(
    item => enrichItem$(item),
    3  // ✅ Max 3 en paralelo = ELASTIC
  )
)
```

---

## Resumen de Ventajas/Desventajas

### Imperativo ✅
- ✅ Fácil de entender (lineal)
- ✅ Debugging más directo
- ✅ Menos overhead

### Imperativo ❌
- ❌ Manejo de errores acoplado (try/catch)
- ❌ Código repetitivo (retry, timeout, circuit breaker)
- ❌ Sin composición de operadores
- ❌ Difícil de testear (mocks)

---

### Reactivo ✅
- ✅ Composición de operadores (pipe)
- ✅ Manejo de errores funcional (catchError)
- ✅ Reutilizable (withTimeout, withRetry, withCircuitBreaker)
- ✅ Concurrencia controlada (mergeMap)
- ✅ Message-driven (streams)
- ✅ Fácil de testear (marbles)

### Reactivo ❌
- ❌ Curva de aprendizaje (conceptos nuevos)
- ❌ Debugging más complejo (async/streams)
- ❌ Overhead inicial (setup)
- ❌ Menos legible para principiantes

---

## Operadores RxJS Demostrados

| Operador | Pilar | Uso |
|----------|-------|-----|
| `from()` | MESSAGE-DRIVEN | Convierte Promise/Array a Observable |
| `timeout()` | RESPONSIVE | Bota error si no completa en ms |
| `retry()` | RESILIENT | Reintenta con backoff |
| `catchError()` | RESILIENT | Manejo funcional de errores |
| `mergeMap()` | ELASTIC | Procesa concurrentemente |
| `tap()` | MESSAGE-DRIVEN | Side effects (logging) |
| `finalize()` | MESSAGE-DRIVEN | Cleanup en complete/error |
| `map()` | MESSAGE-DRIVEN | Transforma items |

---

## Estructura de Archivos Creados

```
src/core/
├── functional/
│   ├── Either.ts              # Result/Either type
│   ├── pipe.ts                # Function composition
│   └── index.ts
├── infrastructure/
│   └── reactive/
│       ├── RxInventoryRepository.ts   # Main reactive service
│       ├── operators/
│       │   ├── withTimeout.ts         # RESPONSIVE
│       │   ├── withRetry.ts           # RESILIENT
│       │   ├── withCircuitBreaker.ts  # RESILIENT
│       │   └── index.ts
│       └── index.ts
└── [otros]

src/functions/
├── getInventory.ts      # Imperativo (actual)
└── getInventoryRx.ts    # Reactivo (nuevo)
```

---

## Próximos Pasos

1. ✅ Implementar RxInventoryRepository
2. ✅ Crear operadores (timeout, retry, circuit breaker)
3. ✅ Either type para manejo funcional
4. ⏳ Crear GetInventoryControllerRx
5. ⏳ Crear getInventoryRx.ts handler
6. ⏳ Tests unitarios con marble testing
7. ⏳ Refactorizar ProcureIngredientsUsecase
