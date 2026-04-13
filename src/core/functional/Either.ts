/**
 * Either type: Functional error handling without try/catch
 * Left = Error, Right = Success
 */

export type Either<L, R> = Left<L> | Right<R>

export class Left<L> {
  readonly kind = 'Left' as const
  constructor(readonly value: L) {}

  map<R>(_fn: (r: R) => R): Either<L, R> {
    return this as any
  }

  flatMap<R, R2>(_fn: (r: R) => Either<L, R2>): Either<L, R2> {
    return this as any
  }

  fold<R>(onLeft: (l: L) => R, _onRight: (r: any) => R): R {
    return onLeft(this.value)
  }

  getOrElse(defaultValue: any): any {
    return defaultValue
  }
}

export class Right<R> {
  readonly kind = 'Right' as const
  constructor(readonly value: R) {}

  map<R2>(fn: (r: R) => R2): Either<any, R2> {
    return new Right(fn(this.value))
  }

  flatMap<L, R2>(fn: (r: R) => Either<L, R2>): Either<L, R2> {
    return fn(this.value)
  }

  fold<L, Result>(_onLeft: (l: L) => Result, onRight: (r: R) => Result): Result {
    return onRight(this.value)
  }

  getOrElse(_defaultValue: any): R {
    return this.value
  }
}

export const left = <L, R>(value: L): Either<L, R> => new Left(value)
export const right = <L, R>(value: R): Either<L, R> => new Right(value)
