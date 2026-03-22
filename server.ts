// ... existing imports ...
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

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

  // Deepgram Token Route
  app.get("/api/deepgram/token", async (req, res) => {
    try {
      const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
      if (!deepgramApiKey) {
        return res.status(500).json({ error: "DEEPGRAM_API_KEY is not set" });
      }

      // If we can't generate a temporary key, we'll return the master key
      // This is less secure but more reliable if the project/keys API fails
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
              return res.json({ token: keyData.key });
            }
          }
        }
      } catch (innerError) {
        console.warn("Failed to generate temporary Deepgram key:", innerError);
      }

      // Fallback to master key
      res.json({ token: deepgramApiKey });
    } catch (error) {
      console.error("Deepgram token error:", error);
      res.status(500).json({ error: "Failed to generate token" });
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
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
