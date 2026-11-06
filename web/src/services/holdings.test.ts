import assert from "node:assert/strict";
import { test } from "node:test";
import { Types } from "mongoose";
import { serializeHoldings } from "./holdings";

test("empty portfolio has exactly three independent defaults", () => {
  const result = serializeHoldings([]);
  assert.deepEqual(result, {
    gold: { amountGrams: "0", updatedAt: null },
    silver: { amountGrams: "0", updatedAt: null },
    platinum: { amountGrams: "0", updatedAt: null },
  });
  assert.notEqual(result.gold, result.silver);
});

test("all assets preserve Decimal128 precision and timestamps in JSON", () => {
  const updatedAt = new Date("2026-01-01T00:00:00.000Z");
  const result = serializeHoldings([
    { asset: "GOLD", amount: Types.Decimal128.fromString("12345678901234567890.12345678901234"), updatedAt },
    { asset: "SILVER", amount: Types.Decimal128.fromString("0.1000"), updatedAt },
    { asset: "PLATINUM", amount: Types.Decimal128.fromString("1E-20"), updatedAt },
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), {
    gold: { amountGrams: "12345678901234567890.12345678901234", updatedAt: updatedAt.toISOString() },
    silver: { amountGrams: "0.1000", updatedAt: updatedAt.toISOString() },
    platinum: { amountGrams: "1E-20", updatedAt: updatedAt.toISOString() },
  });
});

test("partial portfolio leaves missing assets at zero", () => {
  const result = serializeHoldings([
    { asset: "SILVER", amount: Types.Decimal128.fromString("2.5"), updatedAt: new Date("2026-01-01T00:00:00Z") },
  ]);
  assert.equal(result.silver.amountGrams, "2.5");
  assert.deepEqual(result.gold, { amountGrams: "0", updatedAt: null });
  assert.deepEqual(result.platinum, { amountGrams: "0", updatedAt: null });
});
