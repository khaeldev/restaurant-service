export class Quantity {
  private readonly value: number

  constructor(value: number) {
    if (value < 0) {
      throw new Error('Quantity cannot be negative')
    }
    if (!Number.isInteger(value)) {
      throw new Error('Quantity must be an integer')
    }
    this.value = value
  }

  getValue(): number {
    return this.value
  }

  add(other: Quantity): Quantity {
    return new Quantity(this.value + other.getValue())
  }

  subtract(other: Quantity): Quantity {
    const result = this.value - other.getValue()
    if (result < 0) {
      throw new Error('Cannot subtract: result would be negative')
    }
    return new Quantity(result)
  }

  isGreaterThanOrEqual(other: Quantity): boolean {
    return this.value >= other.getValue()
  }

  isZero(): boolean {
    return this.value === 0
  }
}
