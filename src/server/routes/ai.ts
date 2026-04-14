import express from "express";
import { GoogleGenAI } from "@google/genai";
import Groq from "groq-sdk";
import { authMiddleware, AuthRequest } from "../middleware/auth.ts";

const router = express.Router();

// Groq Client
let groqClient: Groq | null = null;
const getGroq = () => {
  if (!groqClient) {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    // Safety: Groq keys always start with gsk_
    if (!apiKey || !apiKey.startsWith("gsk_") || apiKey.includes("your_groq")) {
      console.log("Skipping Groq: No valid API key found in environment.");
      return null;
    }
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
};

// Gemini Client (Fallback)
let genAI: GoogleGenAI | null = null;
const getGemini = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    // Safety: Check for placeholder
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.includes("your_gemini")) {
      console.log("Skipping Gemini: No valid API key found in environment.");
      return null;
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

// Helper to try AI providers in order: Groq -> Gemini
async function tryAI(
  groqFn: () => Promise<any>,
  geminiFn: () => Promise<any>,
  errorMsg: string
) {
  // 1. Try Groq (User's preferred free/fast option)
  const groq = getGroq();
  if (groq) {
    try {
      return await groqFn();
    } catch (err: any) {
      console.warn("Groq failed:", err.message);
    }
  }

  // 2. Try Gemini
  const gemini = getGemini();
  if (gemini) {
    try {
      return await geminiFn();
    } catch (err: any) {
      console.warn("Gemini failed:", err.message);
    }
  }

  throw new Error(errorMsg);
}

// Generate Insights & Predictions
router.post("/analyze", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { prompt } = req.body;

    const result = await tryAI(
      async () => {
        const response = await getGroq()!.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: prompt }],
        });
        return { text: response.choices[0].message.content };
      },
      async () => {
        const response = await getGemini()!.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        });
        return { text: response.text || "" };
      },
      "All AI providers failed for analysis"
    );

    res.json(result);
  } catch (err: any) {
    console.error("AI Error:", err);
    res.status(500).json({ message: err.message || "AI Analysis failed" });
  }
});

// Receipt Scanner
router.post("/scan", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { base64Image, mimeType } = req.body;
    const prompt = "Extract the total amount, category (Food, Transport, Shopping, Entertainment, Bills, Health, or Other), date (YYYY-MM-DD), and a brief description from this receipt image. Return ONLY a JSON object with keys: amount (number), category (string), date (string), description (string).";

    const result = await tryAI(
      async () => {
        // Groq vision fallback to Gemini for now
        throw new Error("Groq vision not implemented");
      },
      async () => {
        const response = await getGemini()!.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                { inlineData: { data: base64Image, mimeType } }
              ]
            }
          ],
          config: { responseMimeType: "application/json" }
        });
        const text = response.text || "{}";
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        return JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
      },
      "All AI providers failed for receipt scanning"
    );

    res.json(result);
  } catch (err: any) {
    console.error("AI Scan Error:", err);
    res.status(500).json({ message: err.message || "Receipt scanning failed" });
  }
});

// AI Coach Chat
router.post("/coach", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { messages, systemInstruction } = req.body;

    const result = await tryAI(
      async () => {
        const response = await getGroq()!.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemInstruction },
            ...messages.map((m: any) => ({
              role: m.role === "model" ? "assistant" : "user",
              content: m.text,
            })),
          ],
        });
        return { text: response.choices[0].message.content };
      },
      async () => {
        const response = await getGemini()!.models.generateContent({
          model: "gemini-2.0-flash-exp",
          config: {
            systemInstruction: systemInstruction,
          },
          contents: messages.map((m: any) => ({
            role: m.role === "model" ? "model" : "user",
            parts: [{ text: m.text }]
          }))
        });
        return { text: response.text || "" };
      },
      "All AI providers failed for coach chat"
    );

    res.json(result);
  } catch (err: any) {
    console.error("AI Coach Error:", err);
    res.status(500).json({ message: err.message || "Coach response failed" });
  }
});

export default router;
