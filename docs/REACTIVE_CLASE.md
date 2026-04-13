# 🔄 Clase: Reactividad & Programación Reactiva

## 1. ¿Qué es la Reactividad?

**Definición:** Un programa reactivo **responde automáticamente** a cambios de datos sin polling.

```
IMPERATIVO (Pull)         REACTIVO (Push)
─────────────────         ───────────────
App pide datos    ←→      Sistema empuja eventos
App espera (await)        App se suscribe
App procesa              Sistema ejecuta cuando hay cambios
```

**Ejemplo real:**
```
IMPERATIVO:
1. ¿Hay pedidos nuevos?  (pregunta cada 1 segundo)
2. ¿Hay pedidos nuevos?  (pregunta cada 1 segundo)
3. ¿Hay pedidos nuevos?  (pregunta cada 1 segundo)
→ Ineficiente, consume recursos

REACTIVO:
1. Suscribirse a "nuevo pedido"
2. Cuando llega: automáticamente procesa
→ Eficiente, responde al instante
```

---

## 2. RxJS: La Librería Reactiva de JavaScript

### Conceptos Fundamentales

#### **Observable** = Stream de datos
```typescript
import { Observable, from, of } from 'rxjs'

// 1. Crear observable desde array
const items$ = from([1, 2, 3])

// 2. Crear observable directo
const values$ = of('a', 'b', 'c')

// 3. Crear observable desde promesa
const data$ = from(fetch('/api/inventory'))

// $ = convención: indica que es un observable
```

#### **Operator** = Transforma el stream
```typescript
import { map, filter, tap } from 'rxjs/operators'

const nums$ = of(1, 2, 3, 4, 5).pipe(
  filter(n => n > 2),          // Solo > 2
  map(n => n * 2),              // Multiplica × 2
  tap(n => console.log(n))      // Side effect: log
)
// Output: 6, 8, 10
```

#### **Subscription** = Escucha el observable
```typescript
const sub = nums$.subscribe({
  next: (value) => console.log('Value:', value),
  error: (err) => console.error('Error:', err),
  complete: () => console.log('Done!')
})

// ⚠️ Observable NO emite nada hasta que se suscribe alguien
```

---

## 3. El Patrón Reactivo: Pipeline de Operadores

```
┌─────────────┐
│   Source    │  (Observable original)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Operator 1  │  (Transforma/Filtra)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Operator 2  │  (Agrupa/Combina)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Operator N  │  (Manejo de errores)
└──────┬──────┘
       │
       ▼
┌──────────────────┐
│  Subscription    │  (Recibe valores)
└──────────────────┘
```

### Ejemplo: Pipeline de Inventario

```typescript
// IMPERATIVO
async function getInventory() {
  try {
    const data = await repo.getAllInventory()                    // Fetch
    const filtered = data.filter(item => item.qty > 0)         // Filtro
    const mapped = filtered.map(item => item.name.toUpperCase()) // Transform
    console.log(mapped)                                          // Log
    return mapped
  } catch (error) {
    console.error(error)
    return []
  }
}

// REACTIVO
getInventory$(): Observable<string[]> {
  return from(this.repo.getAllInventory()).pipe(
    filter(item => item.qty > 0),                               // Filtro
    map(item => item.name.toUpperCase()),                       // Transform
    tap(name => console.log(name)),                             // Log
    catchError(err => {                                         // Error
      console.error(err)
      return of([])
    })
  )
}

// Usar:
this.getInventory$().subscribe(names => console.log(names))
```

---

## 4. Operadores Esenciales (Los que necesitas)

### A) Transformación

```typescript
// map: Transforma cada valor
of(1, 2, 3).pipe(
  map(n => n * 2)
)
// Output: 2, 4, 6

// mergeMap: Transforma Y aplana (para promesas)
of(1, 2, 3).pipe(
  mergeMap(n => fetch(`/api/item/${n}`)) // Cada número → Promise
)
// Output: respuestas en el orden que completan
```

### B) Filtrado

```typescript
// filter: Solo emite si cumple condición
of(1, 2, 3, 4, 5).pipe(
  filter(n => n % 2 === 0)
)
// Output: 2, 4

// take: Solo los primeros N
of(1, 2, 3, 4, 5).pipe(
  take(2)
)
// Output: 1, 2
```

### C) Side Effects

```typescript
// tap: "espiar" sin cambiar datos
of(1, 2, 3).pipe(
  tap(n => console.log('Viendo:', n)),  // No cambia
  map(n => n * 2)
)
// Output: 2, 4, 6

// finalize: Limpieza cuando termina
of(1, 2, 3).pipe(
  finalize(() => console.log('Cerrado!'))
)
// Imprime "Cerrado!" cuando completa
```

### D) Manejo de Errores

```typescript
// catchError: Atrapa errores (sin try/catch)
throwError(() => new Error('Fallo')).pipe(
  catchError(err => {
    console.error('Atrapado:', err)
    return of([])  // Retorna fallback
  })
)

// retry: Reintenta N veces
from(api.fetch()).pipe(
  retry(3)  // 3 reintentos
)
```

### E) Tiempo

```typescript
// timeout: Bota error si tarda > N ms
from(api.fetch()).pipe(
  timeout(5000)  // 5 segundos max
)

// delay: Espera N ms
of(1, 2, 3).pipe(
  delay(1000)  // 1 segundo
)

// debounceTime: Espera a que pare de emitir
input$.pipe(
  debounceTime(500)  // Espera 500ms sin cambios
)
```

### F) Combinación

```typescript
// combineLatest: Combina últimos valores de múltiples streams
combineLatest([stream1$, stream2$]).pipe(
  map(([val1, val2]) => val1 + val2)
)

// merge: Fusiona múltiples streams
merge(orders$, returns$).pipe(
  tap(event => console.log(event))
)
```

---

## 5. Los 4 Pilares en Código

```typescript
// 1. RESPONSIVE: Responde rápido
timeout(5000)  // Max 5 segundos

// 2. RESILIENT: Maneja fallos
retry(3)
catchError(err => of([]))
circuitBreaker.execute()

// 3. ELASTIC: Concurrencia controlada
mergeMap(item => process(item), 3)  // Max 3 paralelo

// 4. MESSAGE-DRIVEN: Streams de eventos
observable$.pipe(
  tap(event => console.log('Evento:', event))
)
```

---

## 6. Patrón: De Promesa a Observable

```typescript
// ❌ PROMESA (imperativa)
async function fetchInventory() {
  try {
    const data = await api.get('/inventory')
    const filtered = data.filter(...)
    return filtered
  } catch (error) {
    return []
  }
}

// ✅ OBSERVABLE (reactiva)
fetchInventory$(): Observable<Item[]> {
  return from(api.get('/inventory')).pipe(
    filter(...),
    timeout(5000),
    retry(3),
    catchError(() => of([]))
  )
}

// Usar:
// Promesa: const items = await fetchInventory()
// Observable: this.fetchInventory$().subscribe(items => {...})
```

---

## 7. Composición Reutilizable

La reactividad brilla cuando composicionas operadores:

```typescript
// 1. Crear operadores customizados
const withTimeout = (ms: number) => <T,>(source: Observable<T>) =>
  source.pipe(timeout(ms))

const withRetry = (attempts: number) => <T,>(source: Observable<T>) =>
  source.pipe(retry(attempts))

const withFallback = <T,>(fallback: T) => (source: Observable<T>) =>
  source.pipe(catchError(() => of(fallback)))

// 2. Composición (reutilizable en cualquier lado)
inventory$().pipe(
  withTimeout(5000),
  withRetry(3),
  withFallback([])
)

orders$().pipe(
  withTimeout(10000),
  withRetry(2),
  withFallback([])
)

// ✅ Mismo patrón, diferente fuente
```

---

## 8. Comparación Final: Imperativo vs Reactivo

### Scenario: Obtener pedidos con timeout, retry y fallback

#### ❌ IMPERATIVO
```typescript
async function getOrders() {
  const maxRetries = 3
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Timeout manual
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 5000)
      )

      const dataPromise = api.getOrders()
      const data = await Promise.race([dataPromise, timeoutPromise])

      return data
    } catch (error) {
      lastError = error as Error

      // Retry manual
      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 100
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // Fallback manual
  return []
}
```

#### ✅ REACTIVO
```typescript
getOrders$(): Observable<Order[]> {
  return from(api.getOrders()).pipe(
    timeout(5000),
    retry(3),
    catchError(() => of([]))
  )
}
```

**Líneas:** 30 → 7
**Legibilidad:** ❌ Compleja → ✅ Clara
**Reutilización:** ❌ Acoplado → ✅ Modular

---

## 9. Tipos de Observables Comunes

```typescript
// 1. Hot Observable (emite aunque no esté suscrito)
const mouseClick$ = fromEvent(document, 'click')

// 2. Cold Observable (emite solo cuando se suscribe)
const data$ = from(api.fetch())

// 3. Finite (completa)
const items$ = of(1, 2, 3)  // Emite 3 valores y completa

// 4. Infinite (nunca completa)
const ticks$ = interval(1000)  // Emite cada 1 segundo infinito
```

---

## 10. Checklist: ¿Cuándo Usar Reactivo?

| Caso | Usa |
|------|-----|
| Fetch simple | Promesa o Observable |
| Múltiples streams | ✅ Observable |
| Timeout + Retry | ✅ Observable |
| Eventos del usuario | ✅ Observable |
| Operaciones complejas | ✅ Observable |
| Polling | ✅ Observable (interval) |
| WebSocket | ✅ Observable |
| Real-time | ✅ Observable |

---

## 11. Ejercicio Práctico

```typescript
// Tarea: Obtener ordenes, filtrar activas, con timeout y retry

// IMPLEMENTAR:
class OrderService {
  private api: ApiClient

  getActiveOrders$(): Observable<Order[]> {
    // 1. Traer órdenes (from)
    // 2. Filtrar status === 'ACTIVE' (filter)
    // 3. Timeout 5s (timeout)
    // 4. Reintenta 2 veces (retry)
    // 5. Si falla, retorna [] (catchError)
    // 6. Logea cada orden (tap)

    return ???
  }
}

// SOLUCIÓN:
getActiveOrders$(): Observable<Order[]> {
  return from(this.api.getOrders()).pipe(
    map(orders => orders.filter(o => o.status === 'ACTIVE')),
    timeout(5000),
    retry(2),
    tap(orders => console.log('Orders:', orders)),
    catchError(() => of([]))
  )
}
```

---

## 12. Recursos

- **Documentación oficial:** https://rxjs.dev
- **Operadores interactivos:** https://rxmarbles.com
- **Testeo (marble testing):** RxJS TestScheduler

---

## Resumen

**Reactividad** = El programa responde a cambios sin preguntar. **RxJS** lo hace con **Observables** (streams de datos) y **Operators** (transformaciones). En lugar de `await` imperativo, usas **pipe** reactivo: `source$.pipe(filter(...), map(...), timeout(...), catchError(...))`  = Código más limpio, reutilizable, escalable.

**Los 4 pilares:** RESPONSIVE (timeout), RESILIENT (retry + circuit), ELASTIC (mergeMap), MESSAGE-DRIVEN (streams).

**Mentalidad:** No preguntes por datos, suscríbete a ellos.
