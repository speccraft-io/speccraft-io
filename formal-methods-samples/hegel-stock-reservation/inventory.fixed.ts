export interface Reservation {
  readonly sku: string;
  readonly quantity: number;
}

export interface InventoryDeps {
  saveReservation: (reservation: Reservation) => Promise<string>;
}

export class Inventory {
  stock: Record<string, number>;
  private readonly deps: InventoryDeps;

  constructor(stock: Record<string, number>, deps: InventoryDeps) {
    this.stock = { ...stock };
    this.deps = deps;
  }

  async reserve(sku: string, quantity: number): Promise<string | null> {
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > (this.stock[sku] ?? 0)) {
      return null;
    }
    this.stock[sku] = (this.stock[sku] ?? 0) - quantity;
    const id = await this.deps.saveReservation({ sku, quantity });
    return id;
  }
}
