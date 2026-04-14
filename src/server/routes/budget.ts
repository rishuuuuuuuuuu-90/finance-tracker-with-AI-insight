import express from "express";
import { Budget } from "../models/Budget.ts";
import { authMiddleware, AuthRequest } from "../middleware/auth.ts";

const router = express.Router();

// Get budget
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const budget = await Budget.findOne({ userId: req.user?.id });
    res.json(budget || { monthlyLimit: 0 });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Set/Update budget
router.post("/", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { monthlyLimit } = req.body;
    const budget = await Budget.findOneAndUpdate(
      { userId: req.user?.id },
      { monthlyLimit, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(budget);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
