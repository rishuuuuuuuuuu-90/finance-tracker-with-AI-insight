import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User.ts";
import { authMiddleware, AuthRequest } from "../middleware/auth.ts";

const router = express.Router();

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" });

    user = new User({ name, email, password });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "7d" });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, currency: user.currency } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await (user as any).comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || "fallback_secret", { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, currency: user.currency } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update currency
router.put("/currency", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { currency } = req.body;
    const user = await User.findByIdAndUpdate(req.user?.id, { currency }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ currency: user.currency });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
