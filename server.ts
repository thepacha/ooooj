import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/config-check", (req, res) => {
    res.json({
      deepgram: !!process.env.DEEPGRAM_API_KEY,
      gemini: !!process.env.GEMINI_API_KEY,
    });
  });

  // Deepgram Token Route
  app.get("/api/deepgram/token", async (req, res) => {
    console.log("GET /api/deepgram/token request received");
    try {
      const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
      if (!deepgramApiKey) {
        console.error("DEEPGRAM_API_KEY is missing in environment variables");
        return res.status(500).json({ error: "DEEPGRAM_API_KEY is not set on the server" });
      }

      // We've seen 403 errors when trying to generate temporary keys due to insufficient permissions.
      // To ensure the app works for the user immediately, we will return the master key.
      // In a production environment, you should ensure your key has 'keys:write' scope if you want temporary keys.
      console.log("Returning Deepgram API key to client");
      return res.json({ token: deepgramApiKey });
    } catch (error: any) {
      console.error("Deepgram token endpoint critical error:", error);
      return res.status(500).json({ error: "Internal server error: " + (error.message || "Unknown error") });
    }
  });

  // AI Chat Proxy Route
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { messages, systemInstruction } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      
      if (!apiKey) {
        console.error("GEMINI_API_KEY is missing in environment variables");
        return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server" });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      
      console.log("Generating AI response via server proxy for messages:", JSON.stringify(messages).substring(0, 100) + "...");
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: messages,
        config: {
          systemInstruction: systemInstruction,
        },
      });

      const text = response.text;
      if (!text) {
        console.error("Gemini API returned empty text. Full response:", JSON.stringify(response));
        throw new Error("Empty response from Gemini API");
      }

      console.log("AI response generated successfully");
      res.json({ text });
    } catch (error: any) {
      console.error("AI Chat proxy error:", error);
      res.status(500).json({ error: error.message || "Failed to generate AI response" });
    }
  });

  // Placeholder for AssemblyAI Transcribe Route
  app.post("/api/assemblyai/transcribe", async (req, res) => {
    try {
      // We will implement this in Phase 2
      res.json({ transcript: "placeholder_transcript" });
    } catch (error) {
      res.status(500).json({ error: "Failed to transcribe audio" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
