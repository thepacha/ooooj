import express from "express";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

async function startServer() {
  const app = express();
  // Read PORT from environment, fallback to 3000
  const PORT = process.env.PORT || 3000;

  // Middleware
  app.use(cors({
    origin: process.env.FRONTEND_URL || "*", // Allow Cloudflare pages domain or any
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  }));
  app.use(express.json());
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Helper to split text into chunks of max length
  const splitText = (str: string, maxLength: number): string[] => {
      const chunks: string[] = [];
      let currentText = str;

      while (currentText.length > 0) {
          if (currentText.length <= maxLength) {
              chunks.push(currentText);
              break;
          }

          let splitIndex = currentText.lastIndexOf('.', maxLength);
          if (splitIndex === -1) splitIndex = currentText.lastIndexOf('?', maxLength);
          if (splitIndex === -1) splitIndex = currentText.lastIndexOf('!', maxLength);
          if (splitIndex === -1) splitIndex = currentText.lastIndexOf('\n', maxLength);
          
          if (splitIndex === -1) splitIndex = currentText.lastIndexOf(' ', maxLength);
          
          if (splitIndex === -1 || splitIndex === 0) {
              splitIndex = maxLength;
          } else {
              splitIndex += 1;
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

      const finalBuffer = Buffer.concat(audioBuffers.filter(Boolean));

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

      const voicesUrl = `https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`;
      const voicesResponse = await fetch(voicesUrl);
      if (!voicesResponse.ok) {
        throw new Error("Failed to fetch available voices from Google TTS API");
      }
      const voicesData = await voicesResponse.json();
      const availableVoices = voicesData.voices || [];

      const arabicVoices = availableVoices.filter((v: any) => 
        v.languageCodes.some((lc: string) => lc.startsWith("ar"))
      );

      if (arabicVoices.length === 0) {
        throw new Error("No Arabic voices found in Google TTS API");
      }

      let selectedVoice = arabicVoices.find((v: any) => v.name === model);
      let finalVoiceName = model;
      let finalLanguageCode = model.split('-').slice(0, 2).join('-');

      if (!selectedVoice) {
        selectedVoice = arabicVoices[0];
        finalVoiceName = selectedVoice.name;
        finalLanguageCode = selectedVoice.languageCodes[0];
      } else {
        finalLanguageCode = selectedVoice.languageCodes[0];
      }

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
      });
    }
  });

  app.get("/api/assemblyai/token", async (req, res) => {
    try {
        const apiKey = process.env.ASSEMBLYAI_API_KEY?.trim();
        if (!apiKey) {
            return res.status(500).json({ error: "ASSEMBLYAI_API_KEY is not configured" });
        }
        res.status(200).json({ token: apiKey });
    } catch (error: any) {
        console.error("Error generating token:", error);
        res.status(500).json({ error: `AssemblyAI Token Error: ${error.message || "Unknown error"}` });
    }
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, message, company, topic } = req.body;
      
      if (!name || !email || !message || !company || !topic) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const { supabase } = await import("./lib/supabase.js"); 
      const { error: supabaseError } = await supabase
        .from('contact_messages')
        .insert([{ name, email, message, company, topic }]);

      if (supabaseError) {
        console.error('Error saving to Supabase:', supabaseError);
      }

      const brevoApiKey = process.env.BREVO_API_KEY?.trim();
      if (brevoApiKey) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); 

          const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            signal: controller.signal,
            headers: {
              'accept': 'application/json',
              'api-key': brevoApiKey,
              'content-type': 'application/json'
            },
            body: JSON.stringify({
              sender: { name: "Revu AI Dashboard", email: "hi@revuqai.com" },
              to: [{ email: "abrahamcena96@gmail.com", name: "Abraham Cena" }],
              replyTo: { email: email.trim(), name: name.trim() },
              subject: `New Dashboard Contact: ${topic}`,
              htmlContent: `
                <div style="font-family: sans-serif; line-height: 1.5; color: #1e293b;">
                  <h2 style="color: #0500e2;">New Dashboard Contact Submission</h2>
                  <p><strong>Name:</strong> ${name}</p>
                  <p><strong>Email:</strong> ${email}</p>
                  <p><strong>Company:</strong> ${company}</p>
                  <p><strong>Topic:</strong> ${topic}</p>
                  <div style="margin-top: 20px; padding: 15px; background-color: #f8fafc; border-radius: 8px;">
                    <p><strong>Message:</strong></p>
                    <p>${message.replace(/\n/g, '<br>')}</p>
                  </div>
                </div>
              `
            })
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Brevo API Error (Dashboard): Status', response.status, JSON.stringify(errorData));
            return res.status(response.status).json({ 
              error: `Email service error: ${errorData.message || 'Unknown error'}`,
              details: errorData 
            });
          }
        } catch (emailError: any) {
          console.error('Error sending email via Brevo API (dashboard):', emailError);
          return res.status(500).json({ error: `Connection to email service failed: ${emailError.message}` });
        }
      } else {
        return res.status(500).json({ error: "Email service not configured (API key missing)" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Contact API error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const server = http.createServer(app);
  
  const ttsWss = new WebSocketServer({ noServer: true });
  const assemblyWss = new WebSocketServer({ noServer: true });

  const safeClose = (socket: any, code: number, reason: string) => {
    if (socket.readyState === socket.OPEN || socket.readyState === socket.CONNECTING) {
      const validCode = (code >= 1000 && code <= 4999 && code !== 1005 && code !== 1006) ? code : 1000;
      try {
        socket.close(validCode, reason);
      } catch (e) {
        socket.terminate();
      }
    }
  };

  server.on('upgrade', (request, socket, head) => {
    // We shouldn't rely on full URL easily, just read pathname
    const baseURL = "http://" + request.headers.host + "/";
    const pathname = new URL(request.url!, baseURL).pathname;

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
      if (clientWs.readyState === clientWs.OPEN) {
        clientWs.send(JSON.stringify({ type: "log", message: "Connected to AssemblyAI upstream" }));
      }
      while (messageBuffer.length > 0) {
        const data = messageBuffer.shift();
        assemblyWs.send(data.toString());
      }
    });

    assemblyWs.on("message", (data) => {
      if (clientWs.readyState === clientWs.OPEN) {
        clientWs.send(data.toString());
      }
    });

    assemblyWs.on("error", (error) => {
      clearTimeout(connectionTimeout);
      if (clientWs.readyState === clientWs.OPEN) {
        clientWs.send(JSON.stringify({ type: "error", message: `Upstream connection error: ${error.message}` }));
      }
    });

    assemblyWs.on("close", (code, reason) => {
      clearTimeout(connectionTimeout);
      safeClose(clientWs, code, reason.toString());
    });

    clientWs.on("message", (data) => {
      if (assemblyWs.readyState === WebSocket.OPEN) {
        assemblyWs.send(data.toString());
      } else if (assemblyWs.readyState === WebSocket.CONNECTING) {
        messageBuffer.push(data);
      }
    });

    clientWs.on("close", () => {
      safeClose(assemblyWs, 1000, "Client disconnected");
    });
  });

  const startListening = () => {
    // For Railway/Render, they provide the PORT to bind to "0.0.0.0"
    server.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    }).on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is in use, retrying...`);
        setTimeout(() => {
          server.close();
          startListening();
        }, 1000);
      } else {
        console.error("Server error:", err);
      }
    });
  };

  startListening();

  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received. Closing servers...');
    ttsWss.close();
    assemblyWss.close();
    server.close(() => {
      process.exit(0);
    });
  });
}

startServer();
