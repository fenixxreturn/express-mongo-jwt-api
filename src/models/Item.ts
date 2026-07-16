import { Schema, model, Types } from "mongoose";

export interface ItemDoc {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<ItemDoc>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

export const Item = model<ItemDoc>("Item", itemSchema);
