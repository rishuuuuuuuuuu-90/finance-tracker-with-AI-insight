import express from "express";
import { Expense } from "../models/Expense.ts";
import { authMiddleware, AuthRequest } from "../middleware/auth.ts";

const router = express.Router();

// Get all expenses for user
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user?.id }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add expense
router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { amount, category, date, description } = req.body;
    const expense = new Expense({
      userId: req.user?.id,
      amount,
      category,
      date,
      description,
    });
    await expense.save();
    res.status(201).json(expense);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update expense
router.put("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { amount, category, date, description } = req.body;
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.id },
      { amount, category, date, description },
      { new: true }
    );
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json(expense);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete expense
router.delete("/:id", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user?.id });
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
