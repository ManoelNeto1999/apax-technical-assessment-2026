import type { IHolding } from "../models/holdingsModel";

export interface MetalHoldingDTO {
  amountGrams: string;
  updatedAt: string | null;
}
export interface HoldingsResponse {
  gold: MetalHoldingDTO;
  silver: MetalHoldingDTO;
  platinum: MetalHoldingDTO;
}

/** Pure mapping of user-scoped rows. Decimal strings may use exponent notation. */
export function serializeHoldings(
  rows: readonly Pick<IHolding, "asset" | "amount" | "updatedAt">[]
): HoldingsResponse {
  const result: HoldingsResponse = {
    gold: { amountGrams: "0", updatedAt: null },
    silver: { amountGrams: "0", updatedAt: null },
    platinum: { amountGrams: "0", updatedAt: null },
  };
  const keys = { GOLD: "gold", SILVER: "silver", PLATINUM: "platinum" } as const;
  for (const row of rows) {
    result[keys[row.asset]] = {
      amountGrams: row.amount.toString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
  return result;
}
