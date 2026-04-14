import express from "express";
import { authMiddleware } from "../middleware/auth.ts";

const router = express.Router();

let ratesCache: { [key: string]: any } = {};
let lastFetch: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

const fetchRates = async (base: string = "INR") => {
  const now = Date.now();
  if (ratesCache[base] && now - lastFetch < CACHE_DURATION) {
    return ratesCache[base];
  }

  const API_KEY = process.env.EXCHANGERATE_API_KEY;
  if (!API_KEY) {
    // Fallback rates if API key is missing
    return {
      conversion_rates: {
        INR: 1,
        USD: 0.012,
        EUR: 0.011,
        GBP: 0.0094,
      }
    };
  }

  try {
    const response = await fetch(`https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${base}`);
    const data = await response.json();
    if (data.result === "success") {
      ratesCache[base] = data.conversion_rates;
      lastFetch = now;
      return data.conversion_rates;
    }
    throw new Error("Failed to fetch rates");
  } catch (err) {
    console.error("Currency API error:", err);
    return null;
  }
};

router.get("/rates", authMiddleware, async (req, res) => {
  const base = (req.query.base as string) || "INR";
  const rates = await fetchRates(base);
  if (rates) {
    res.json(rates);
  } else {
    res.status(500).json({ message: "Failed to fetch exchange rates" });
  }
});

router.get("/convert", authMiddleware, async (req, res) => {
  const { amount, from, to } = req.query;
  if (!amount || !from || !to) {
    return res.status(400).json({ message: "Missing parameters" });
  }

  const rates = await fetchRates(from as string);
  if (rates && rates[to as string]) {
    const convertedAmount = parseFloat(amount as string) * rates[to as string];
    res.json({ amount: convertedAmount });
  } else {
    res.status(500).json({ message: "Conversion failed" });
  }
});

export default router;
