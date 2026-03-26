import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.use(express.json());
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Helper to split text into chunks of max length (1900 to be safe under 2000 limit)
  const splitText = (str: string, maxLength: number): string[] => {
      const chunks: string[] = [];
      let currentText = str;

      while (currentText.length > 0) {
          if (currentText.length <= maxLength) {
              chunks.push(currentText);
              break;
          }

          // Find the last sentence boundary within the maxLength
          let splitIndex = currentText.lastIndexOf('.', maxLength);
          if (splitIndex === -1) splitIndex = currentText.lastIndexOf('?', maxLength);
          if (splitIndex === -1) splitIndex = currentText.lastIndexOf('!', maxLength);
          if (splitIndex === -1) splitIndex = currentText.lastIndexOf('\n', maxLength);
          
          // If no punctuation, try splitting by space
          if (splitIndex === -1) splitIndex = currentText.lastIndexOf(' ', maxLength);
          
          // If no natural boundary found (e.g., a single 2000-char word), hard split
          if (splitIndex === -1 || splitIndex === 0) {
              splitIndex = maxLength;
          } else {
              splitIndex += 1; // Include the punctuation mark or space
          }

          chunks.push(currentText.substring(0, splitIndex).trim());
          currentText = currentText.substring(splitIndex).trim();
      }

      return chunks;
  };

  app.post("/api/deepgram/tts", async (req, res) => {
    try {
      const { text, model } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const apiKey = process.env.DEEPGRAM_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "DEEPGRAM_API_KEY is not configured" });
      }

      const chunks = splitText(text, 1900);
      const audioBuffers: Buffer[] = new Array(chunks.length);
      const deepgramUrl = `https://api.deepgram.com/v1/speak?model=${model || 'aura-asteria-en'}`;

      // Process chunks in parallel batches to speed up while respecting rate limits
      const CONCURRENCY_LIMIT = 5;
      for (let i = 0; i < chunks.length; i += CONCURRENCY_LIMIT) {
          const batch = chunks.slice(i, i + CONCURRENCY_LIMIT);
          
          const batchPromises = batch.map(async (chunk, batchIndex) => {
              if (!chunk) return null;
              
              const response = await fetch(deepgramUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Token ${apiKey}`
                },
                body: JSON.stringify({ text: chunk })
              });

              if (!response.ok) {
                const errorText = await response.text();
                console.error("Deepgram TTS Error on chunk:", errorText);
                throw new Error("Deepgram API error on chunk processing");
              }

              const arrayBuffer = await response.arrayBuffer();
              return { index: i + batchIndex, buffer: Buffer.from(arrayBuffer) };
          });

          const batchResults = await Promise.all(batchPromises);
          
          for (const result of batchResults) {
              if (result) {
                  audioBuffers[result.index] = result.buffer;
              }
          }
      }

      // Concatenate all MP3 buffers (filtering out any nulls)
      const finalBuffer = Buffer.concat(audioBuffers.filter(Boolean));

      // Stream the audio back to the client
      res.setHeader("Content-Type", "audio/mpeg");
      res.send(finalBuffer);

    } catch (error) {
      console.error("Error in Deepgram TTS route:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/google/tts", async (req, res) => {
    try {
      const { text, model } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }

      const apiKey = process.env.GOOGLE_TTS_API_KEY;
      if (!apiKey) {
        console.error("GOOGLE_TTS_API_KEY is missing");
        return res.status(500).json({ error: "Google TTS API key is not configured in environment variables." });
      }

      // 1. Fetch available voices dynamically
      const voicesUrl = `https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`;
      const voicesResponse = await fetch(voicesUrl);
      if (!voicesResponse.ok) {
        throw new Error("Failed to fetch available voices from Google TTS API");
      }
      const voicesData = await voicesResponse.json();
      const availableVoices = voicesData.voices || [];

      // 2. Filter voices for Arabic
      const arabicVoices = availableVoices.filter((v: any) => 
        v.languageCodes.some((lc: string) => lc.startsWith("ar"))
      );

      if (arabicVoices.length === 0) {
        throw new Error("No Arabic voices found in Google TTS API");
      }

      // 3. Select a valid voice or fallback
      let selectedVoice = arabicVoices.find((v: any) => v.name === model);
      let finalVoiceName = model;
      let finalLanguageCode = model.split('-').slice(0, 2).join('-');

      if (!selectedVoice) {
        // Fallback strategy: pick the first available Arabic voice
        selectedVoice = arabicVoices[0];
        finalVoiceName = selectedVoice.name;
        finalLanguageCode = selectedVoice.languageCodes[0];
        console.warn(`Requested voice '${model}' not found. Falling back to '${finalVoiceName}' (${finalLanguageCode}).`);
      } else {
        finalLanguageCode = selectedVoice.languageCodes[0];
        console.log(`Selected voice: '${finalVoiceName}' (${finalLanguageCode})`);
      }

      // Google TTS has a limit of 5000 characters. We'll use a safer limit of 4000.
      const chunks = splitText(text, 4000);
      const audioBuffers: Buffer[] = [];

      for (const chunk of chunks) {
        const googleUrl = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
        
        const response = await fetch(googleUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            input: { text: chunk },
            voice: {
              languageCode: finalLanguageCode,
              name: finalVoiceName
            },
            audioConfig: {
              audioEncoding: "MP3"
            }
          })
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("Google TTS API Error Response:", JSON.stringify(errorData, null, 2));
          
          const errorMessage = errorData.error?.message || "Google Cloud TTS API error";
          const errorCode = errorData.error?.status || "UNKNOWN";
          
          throw new Error(`Google TTS API Error (${errorCode}): ${errorMessage}`);
        }

        const data = await response.json();
        if (data.audioContent) {
          audioBuffers.push(Buffer.from(data.audioContent, 'base64'));
        }
      }

      if (audioBuffers.length === 0) {
        throw new Error("No audio content generated");
      }

      const finalBuffer = Buffer.concat(audioBuffers);

      res.setHeader("Content-Type", "audio/mpeg");
      res.send(finalBuffer);

    } catch (error: any) {
      console.error("Error in Google TTS route:", error);
      res.status(500).json({ 
        error: error.message || "Internal server error",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
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

  const server = http.createServer(app);
  
  // Setup WebSocket server for TTS
  const ttsWss = new WebSocketServer({ noServer: true });
  const assemblyWss = new WebSocketServer({ noServer: true });

  const safeClose = (socket: any, code: number, reason: string) => {
    if (socket.readyState === socket.OPEN || socket.readyState === socket.CONNECTING) {
      // Ensure code is within valid range 1000-4999 and not reserved
      const validCode = (code >= 1000 && code <= 4999 && code !== 1005 && code !== 1006) ? code : 1000;
      try {
        socket.close(validCode, reason);
      } catch (e) {
        socket.terminate();
      }
    }
  };

  server.on('upgrade', (request, socket, head) => {
    const pathname = new URL(request.url!, `http://${request.headers.host}`).pathname;

    if (pathname === '/api/tts') {
      ttsWss.handleUpgrade(request, socket, head, (ws) => {
        ttsWss.emit('connection', ws, request);
      });
    } else if (pathname === '/api/assemblyai') {
      assemblyWss.handleUpgrade(request, socket, head, (ws) => {
        assemblyWss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  ttsWss.on("connection", (ws) => {
    console.log("Client connected to TTS WebSocket");
    ws.on("message", (message) => {
      console.log("Received message from client:", message.toString());
    });
    ws.on("close", () => {
      console.log("Client disconnected from TTS WebSocket");
    });
  });

  assemblyWss.on("connection", (clientWs) => {
    console.log("Client connected to AssemblyAI local proxy");
    
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      console.error("ASSEMBLYAI_API_KEY is not set");
      clientWs.send(JSON.stringify({ type: "error", message: "AssemblyAI API key not configured on server" }));
      safeClose(clientWs, 4001, "API key missing");
      return;
    }

    const assemblyWs = new WebSocket("wss://speech-to-speech.us.assemblyai.com/v1/realtime", {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    const connectionTimeout = setTimeout(() => {
      if (assemblyWs.readyState !== WebSocket.OPEN) {
        console.error("AssemblyAI connection timeout");
        if (clientWs.readyState === clientWs.OPEN) {
          clientWs.send(JSON.stringify({ type: "error", message: "Connection to AssemblyAI timed out" }));
          clientWs.send(JSON.stringify({ type: "log", message: "Connection timed out after 30s" }));
        }
        safeClose(assemblyWs, 4002, "Connection timeout");
      }
    }, 30000);

    const messageBuffer: any[] = [];

    assemblyWs.on("open", () => {
      clearTimeout(connectionTimeout);
      console.log("Proxy connected to AssemblyAI upstream");
      if (clientWs.readyState === clientWs.OPEN) {
        clientWs.send(JSON.stringify({ type: "log", message: "Connected to AssemblyAI upstream" }));
      }
      // Flush buffer
      while (messageBuffer.length > 0) {
        const data = messageBuffer.shift();
        // Ensure we send as string (text frame) for JSON messages
        assemblyWs.send(data.toString());
      }
    });

    assemblyWs.on("message", (data) => {
      const message = data.toString();
      try {
        const parsed = JSON.parse(message);
        if (parsed.type === "session.updated" || parsed.type === "session.ready") {
          console.log(`Received from AssemblyAI: [${parsed.type}]`);
        } else if (message.length < 500) {
          console.log("Received from AssemblyAI:", message);
        } else {
          console.log(`Received from AssemblyAI: [${parsed.type || 'Large Message'}]`);
        }
      } catch (e) {
        if (message.length < 500) {
          console.log("Received from AssemblyAI:", message);
        } else {
          console.log("Received from AssemblyAI: [Large Message]");
        }
      }
      
      if (clientWs.readyState === clientWs.OPEN) {
        clientWs.send(message);
      }
    });

    assemblyWs.on("error", (error) => {
      clearTimeout(connectionTimeout);
      console.error("AssemblyAI upstream error:", error);
      if (clientWs.readyState === clientWs.OPEN) {
        clientWs.send(JSON.stringify({ type: "error", message: `Upstream connection error: ${error.message}` }));
        clientWs.send(JSON.stringify({ type: "log", message: `Upstream error: ${error.message}` }));
      }
    });

    assemblyWs.on("close", (code, reason) => {
      clearTimeout(connectionTimeout);
      console.log(`AssemblyAI closed connection. Code: ${code}, Reason: ${reason}`);
      safeClose(clientWs, code, reason.toString());
    });

    clientWs.on("message", (data) => {
      const message = data.toString();
      if (message.length < 500) {
        console.log("Sending to AssemblyAI:", message);
      } else {
        // Only log a snippet of large messages (like audio data)
        console.log("Sending to AssemblyAI: [Large Message/Audio Data]");
      }

      if (assemblyWs.readyState === WebSocket.OPEN) {
        // Ensure we send as string (text frame) for JSON messages
        assemblyWs.send(message);
      } else if (assemblyWs.readyState === WebSocket.CONNECTING) {
        console.log("Upstream still connecting, buffering message...");
        messageBuffer.push(data);
      }
    });

    clientWs.on("close", () => {
      console.log("Client disconnected from AssemblyAI local proxy");
      safeClose(assemblyWs, 1000, "Client disconnected");
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
