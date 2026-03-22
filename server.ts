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
    try {
      const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
      if (!deepgramApiKey) {
        console.error("DEEPGRAM_API_KEY is missing in environment variables");
        return res.status(500).json({ error: "DEEPGRAM_API_KEY is not set on the server" });
      }

      // Try to generate a temporary key for better security
      try {
        const response = await fetch("https://api.deepgram.com/v1/projects", {
          headers: {
            Authorization: `Token ${deepgramApiKey}`,
            "Content-Type": "application/json",
          },
        });
        
        if (response.ok) {
          const projects = await response.json();
          if (projects.projects && projects.projects.length > 0) {
            const projectId = projects.projects[0].project_id;
            const keyResponse = await fetch(
              `https://api.deepgram.com/v1/projects/${projectId}/keys`,
              {
                method: "POST",
                headers: {
                  Authorization: `Token ${deepgramApiKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  comment: "Temporary token for live transcription",
                  scopes: ["usage:write"],
                  time_to_live_in_seconds: 3600,
                }),
              }
            );
            
            if (keyResponse.ok) {
              const keyData = await keyResponse.json();
              console.log("Successfully generated temporary Deepgram key");
              return res.json({ token: keyData.key });
            } else {
              const errText = await keyResponse.text();
              console.warn("Failed to create temporary key, status:", keyResponse.status, errText);
            }
          }
        } else {
          const errText = await response.text();
          console.warn("Failed to fetch projects, status:", response.status, errText);
        }
      } catch (innerError) {
        console.warn("Error during temporary key generation process:", innerError);
      }

      // Fallback to master key if temporary key generation fails
      console.log("Falling back to master Deepgram API key");
      res.json({ token: deepgramApiKey });
    } catch (error: any) {
      console.error("Deepgram token endpoint critical error:", error);
      res.status(500).json({ error: "Internal server error generating token: " + (error.message || "Unknown error") });
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
      
      console.log("Generating AI response via server proxy...");
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: messages,
        config: {
          systemInstruction: systemInstruction,
        },
      });

      if (!response.text) {
        throw new Error("Empty response from Gemini API");
      }

      res.json({ text: response.text });
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
