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

  // Config Check Route
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

      const { createClient } = await import("@deepgram/sdk");
      const deepgram = createClient(deepgramApiKey);

      // Try to generate a temporary key
      try {
        const { result: projectsResult, error: projectsError } = await deepgram.manage.getProjects();
        if (projectsError) throw projectsError;

        const projectId = projectsResult.projects[0].project_id;
        const { result: keyResult, error: keyError } = await deepgram.manage.createProjectKey(projectId, {
          comment: "Temporary key for RevuQAI roleplay",
          scopes: ["usage:write"],
          time_to_live_in_seconds: 3600, // 1 hour
        });

        if (keyError) throw keyError;

        console.log("Temporary Deepgram key generated successfully");
        return res.json({ token: keyResult.key });
      } catch (innerError: any) {
        console.warn("Failed to generate temporary key, falling back to master key:", innerError.message || innerError);
        // Fallback to master key if temporary key generation fails (e.g. due to permissions)
        return res.json({ token: deepgramApiKey });
      }
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

      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid messages array" });
      }

      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      
      console.log("Generating AI response via server proxy...");
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: messages,
        config: {
          systemInstruction: systemInstruction || "You are a helpful assistant.",
        },
      });

      const text = response.text;
      if (!text) {
        console.error("Gemini API returned empty text.");
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
