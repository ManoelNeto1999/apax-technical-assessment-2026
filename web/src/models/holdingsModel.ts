import { Schema, model, Types } from "mongoose";

export type MetalAsset = "GOLD" | "SILVER" | "PLATINUM";
export interface IHolding {
  user: Types.ObjectId;
  asset: MetalAsset;
  amount: Types.Decimal128;
  updatedAt: Date;
}

// Up to 34 significant decimal digits. Writers must use decimal strings, never
// JS numbers, and runValidators for query updates. No write endpoint is exposed.
const schema = new Schema<IHolding>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  asset: { type: String, enum: ["GOLD", "SILVER", "PLATINUM"], required: true },
  amount: {
    type: Schema.Types.Decimal128,
    required: true,
    validate: {
      validator: (value: Types.Decimal128) =>
        /^\+?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(value.toString()),
      message: "Amount must be finite, nonnegative grams",
    },
  },
}, { timestamps: { createdAt: false, updatedAt: true } });
schema.index({ user: 1, asset: 1 }, { unique: true });
export default model<IHolding>("Holding", schema);
