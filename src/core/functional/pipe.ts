/**
 * Functional composition utilities
 */
// pipe(f)(g)(a)
export const pipe =
  <A, B>(f: (a: A) => B) =>
  <C>(g: (b: B) => C) =>
  (a: A): C =>
    g(f(a))

export const compose =
  <A, B>(f: (a: A) => B) =>
  <C>(g: (b: B) => C) =>
  (a: A): C =>
    g(f(a))
