import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  monthlyLimit: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now },
});

export const Budget = mongoose.model("Budget", budgetSchema);
