import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import dotenv from "dotenv";
import { supabase } from "./lib/supabase";
import { GoogleGenAI, Modality, LiveServerMessage, Type } from "@google/genai";
import geminiHandler from "./api/gemini";
import fs from "fs";

// Create a log file stream in the workspace root
const logStream = fs.createWriteStream(path.join(process.cwd(), "server_debug.log"), { flags: "a" });
const originalLog = console.log;
const originalError = console.error;

console.log = function (...args) {
  const timestamp = new Date().toISOString();
  const msg = `[${timestamp}] ` + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ') + '\n';
  logStream.write(msg);
  originalLog.apply(console, args);
};

console.error = function (...args) {
  const timestamp = new Date().toISOString();
  const msg = `[${timestamp}] [ERROR] ` + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ') + '\n';
  logStream.write(msg);
  originalError.apply(console, args);
};

// Polyfill global WebSocket for Google GenAI Live API connection in Node.js
globalThis.WebSocket = WebSocket as any;

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.use(express.json());
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // SEO-friendly Landing V2 route
  app.get("/landing-v2", (req, res) => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Revu AI - Quality Assurance & Coaching Insights</title>
    <meta name="description" content="Revu AI is the premier Quality Assurance and agent coaching platform for modern support teams. Automate transcript scoring, gain actionable insights, and elevate agent performance with advanced AI analysis. Get started with the most powerful QA tool in the industry today.">
    <meta name="keywords" content="AI QA, Quality Assurance, Transcript Scoring, Coaching Insights, Support Team Performance, MENA Contact Centers, Arabic AI QA">
    <meta property="og:title" content="Revu AI - Quality Assurance & Coaching Insights">
    <meta property="og:description" content="Revu AI is the premier Quality Assurance and agent coaching platform for modern support teams. Automate transcript scoring, gain actionable insights, and elevate agent performance with advanced AI analysis.">
    <meta property="og:type" content="website">
    <link rel="stylesheet" href="/index.css">
</head>
<body>
    <div id="root">
        <main>
            <nav>
                <div>REVU</div>
                <ul>
                    <li>Features</li>
                    <li>Solutions</li>
                    <li>Pricing</li>
                </ul>
            </nav>
            <header>
                <h1>Quality Assurance Automated by AI</h1>
                <p>Stop manually reviewing transcripts. Revu AI analyzes every interaction, scores them against your rubrics, and identifies coaching opportunities in seconds.</p>
                <a href="/signup">Start Your Free Trial</a>
            </header>
            <section id="features">
                <h2>Everything you need to scale QA</h2>
                <article>
                    <h3>Automated Scoring</h3>
                    <p>Upload transcripts and get instant scores based on your custom quality rubrics.</p>
                </article>
                <article>
                    <h3>Coaching Insights</h3>
                    <p>AI identifies specific areas for improvement and provides actionable feedback for agents.</p>
                </article>
                <article>
                    <h3>Trend Analysis</h3>
                    <p>Track performance over time across teams, agents, and specific quality metrics.</p>
                </article>
            </section>
            <footer>
                <p>&copy; 2026 Revu AI. Built with Gemini 3 Flash.</p>
            </footer>
        </main>
    </div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
    res.send(html);
  });

  // SEO-friendly Blog SSR route
  app.get("/blog", (req, res, next) => {
    // If it's the Vite SPA route pattern, we can send back static HTML but in production, we should try to inject into index.html
    // For simplicity, we implement it exactly like landing-v2 to fulfill the SEO requirements explicitly.
    try {
        let indexHtml = '';
        if (process.env.NODE_ENV === "production") {
            const fs = require('fs');
            indexHtml = fs.readFileSync(path.join(process.cwd(), "dist", "index.html"), "utf-8");
        } else {
            // In dev, we can just send a basic shell
            indexHtml = `<!DOCTYPE html><html lang="en"><head><script type="module" src="/@vite/client"></script><script type="module" src="/src/main.tsx"></script></head><body><div id="root"></div></body></html>`;
        }

        const seoContent = `
        <div style="padding: 40px; text-align: center;">
            <h1 style="font-size: 3rem; margin-bottom: 20px;">The Revu AI Blog</h1>
            <p>Insights, strategies, and updates on AI-powered quality assurance and contact center performance.</p>
            <ul>
                <li><h2>The Future of QA in Contact Centers</h2><p>How AI is transforming the way we evaluate agent performance and ensure quality at scale.</p></li>
                <li><h2>5 Ways to Improve First Call Resolution</h2><p>Actionable tips and strategies to help your support team solve customer issues on the very first interaction.</p></li>
                <li><h2>Introducing Revu AI Roleplay Coaching</h2><p>Learn about our newest feature that allows agents to practice with AI before talking to real customers.</p></li>
            </ul>
        </div>
        `;
        
        // Inject SEO meta tags
        const metaTags = `
            <title>Revu AI Blog - Contact Center Insights & QA Strategies</title>
            <meta name="description" content="Explore the Revu AI blog for the latest insights, strategies, and updates on AI-powered quality assurance. Learn how to transform contact center performance with automated transcript scoring and data-driven agent coaching techniques.">
            <meta property="og:title" content="Revu AI Blog - Expert Insights on AI QA">
        `;
        
        let finalHtml = indexHtml.replace('</head>', `${metaTags}</head>`);
        finalHtml = finalHtml.replace('<div id="root"></div>', `<div id="root">${seoContent}</div>`);
        
        res.send(finalHtml);
    } catch (e) {
        next();
    }
  });

  // SEO-friendly FAQ SSR route
  app.get("/faqs", (req, res, next) => {
    try {
        let indexHtml = '';
        if (process.env.NODE_ENV === "production") {
            const fs = require('fs');
            indexHtml = fs.readFileSync(path.join(process.cwd(), "dist", "index.html"), "utf-8");
        } else {
            indexHtml = `<!DOCTYPE html><html lang="en"><head><script type="module" src="/@vite/client"></script><script type="module" src="/src/main.tsx"></script></head><body><div id="root"></div></body></html>`;
        }

        const faqs = [
            { q: "What is Revu AI?", a: "Revu AI is an advanced Quality Assurance and agent coaching platform designed for modern support teams. We use cutting-edge AI to automate transcript scoring, analyze customer sentiment, and provide actionable coaching insights." },
            { q: "Does Revu AI support Arabic language?", a: "Yes! We are specialists in the MENA region. Revu AI supports various Arabic dialects as well as Modern Standard Arabic, ensuring high accuracy for companies operating across the Middle East." },
            { q: "How accurate is the automated scoring?", a: "Revu AI achieve over 95% alignment with human-scored rubrics. Our system is trained both on general communication principles and your specific business guidelines." },
            { q: "How is my data protected?", a: "Security is our top priority. We use enterprise-grade encryption (AES-256) for data at rest and TLS 1.2+ for data in transit. We are fully GDPR and SOC2 compliant." },
            { q: "Can I use my own custom quality rubrics?", a: "Absolutely. You can import your existing quality frameworks or build new ones within the platform. You define the criteria, their weights, and specific scoring logic." },
            { q: "How is usage calculated?", a: "Pricing is based on the volume of interactions analyzed per month. We have tiers for teams of all sizes, from startups to large enterprises." },
            { q: "Is there a free trial?", a: "Yes, we offer a 14-day free trial that includes full access to our platform features and enough credits to analyze your first batch of transcripts." }
        ];

        const faqHtml = faqs.map(f => `
            <div style="margin-bottom: 30px; border-bottom: 1px solid #e2e8f0; padding-bottom: 20px;">
                <h2 style="font-size: 1.5rem; color: #0f172a; margin-bottom: 10px;">${f.q}</h2>
                <p style="color: #475569; line-height: 1.6;">${f.a}</p>
            </div>
        `).join('');

        const seoContent = `
        <div style="padding: 60px 20px; max-width: 800px; margin: 0 auto; font-family: sans-serif;">
            <h1 style="font-size: 3rem; margin-bottom: 20px; text-align: center; color: #0500e2;">Frequently Asked Questions</h1>
            <p style="text-align: center; font-size: 1.2rem; color: #64748b; margin-bottom: 50px;">Everything you need to know about Revu AI, security, and our platform features.</p>
            <div>
                ${faqHtml}
            </div>
        </div>
        `;
        
        const metaTags = `
            <title>Frequently Asked Questions - Revu AI Support</title>
            <meta name="description" content="Find answers to common questions about Revu AI, the premier Quality Assurance and agent coaching platform. Learn about our automated transcript scoring, Arabic language support, security measures, and more.">
            <meta property="og:title" content="Revu AI FAQs - Quality Assurance & Coaching Insights">
            <meta property="og:description" content="Everything you need to know about Revu AI. Automated scoring, Arabic support, data security, and enterprise features.">
        `;
        
        let finalHtml = indexHtml.replace('</head>', `${metaTags}</head>`);
        finalHtml = finalHtml.replace('<div id="root"></div>', `<div id="root">${seoContent}</div>`);
        
        res.send(finalHtml);
    } catch (e) {
        next();
    }
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

  app.post("/api/cartesia/tts", async (req, res) => {
    try {
      const { text, voiceId } = req.body;
      
      if (!text) {
        return res.status(400).json({ error: "Text is required" });
      }
      if (!voiceId) {
        return res.status(400).json({ error: "Voice ID is required" });
      }

      const apiKey = process.env.CARTESIA_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "CARTESIA_API_KEY is not configured in environment variables." });
      }

      let response = await fetch("https://api.cartesia.ai/tts/bytes", {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Cartesia-Version": "2024-06-10",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model_id: "sonic-3.5",
          transcript: text,
          voice: {
            mode: "id",
            id: voiceId
          },
          output_format: {
            container: "wav",
            encoding: "pcm_s16le",
            sample_rate: 24000
          }
        })
      });

      if (!response.ok && response.status === 404) {
        console.warn(`Cartesia voice '${voiceId}' returned 404. Retrying with guaranteed valid multilingual voice ID...`);
        // Fallback to Grace (c2ad7092-0447-47ea-948b-61fbb6faf153)
        const fallbackVoiceId = "c2ad7092-0447-47ea-948b-61fbb6faf153";
        response = await fetch("https://api.cartesia.ai/tts/bytes", {
          method: "POST",
          headers: {
            "X-API-Key": apiKey,
            "Cartesia-Version": "2024-06-10",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model_id: "sonic-3.5",
            transcript: text,
            voice: {
              mode: "id",
              id: fallbackVoiceId
            },
            output_format: {
              container: "wav",
              encoding: "pcm_s16le",
              sample_rate: 24000
            }
          })
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Cartesia API Error:", errorText);
        return res.status(response.status).json({ error: `Cartesia API error: ${errorText}` });
      }

      res.setHeader("Content-Type", "audio/wav");
      res.setHeader("Transfer-Encoding", "chunked");

      if (response.body) {
        // If it's a node-style stream (e.g. from node-fetch)
        if (typeof (response.body as any).pipe === "function") {
          (response.body as any).pipe(res);
        } else if (typeof response.body.getReader === "function") {
          // If it's a web-style ReadableStream (standard fetch in Node 18+)
          const reader = response.body.getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(Buffer.from(value));
            }
            res.end();
          } catch (streamError) {
            console.error("Error reading stream from Cartesia:", streamError);
            if (!res.headersSent) {
              res.status(500).end();
            }
          } finally {
            reader.releaseLock();
          }
        } else if (Symbol.asyncIterator in response.body) {
          // If it's an async iterable
          try {
            for await (const chunk of (response.body as any)) {
              res.write(Buffer.from(chunk));
            }
            res.end();
          } catch (streamError) {
            console.error("Error iterating stream from Cartesia:", streamError);
            if (!res.headersSent) {
              res.status(500).end();
            }
          }
        } else {
          // Fallback to reading the full buffer if streaming isn't directly supported by this response shape
          const arrayBuffer = await response.arrayBuffer();
          res.send(Buffer.from(arrayBuffer));
        }
      } else {
        res.status(500).json({ error: "Empty response body from Cartesia" });
      }

    } catch (error: any) {
      console.error("Error in Cartesia TTS route:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
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

      // 1. Save to Supabase
      const { error: supabaseError } = await supabase
        .from('contact_messages')
        .insert([{ name, email, message, company, topic }]);

      if (supabaseError) {
        console.error('Error saving to Supabase:', supabaseError);
      }

      // 2. Send via Brevo API directly
      const brevoApiKey = process.env.BREVO_API_KEY?.trim();
      if (brevoApiKey) {
        try {
          console.log('Attempting to send email via Brevo...');
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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
            
            // Specifically handle IP restriction errors
            if (response.status === 401 && errorData.code === 'unauthorized' && errorData.message?.includes('unrecognised IP address')) {
              console.error('\x1b[31m%s\x1b[0m', 'CRITICAL: Brevo IP Authorization Required.');
              console.error('\x1b[33m%s\x1b[0m', `Please authorize the following IP in your Brevo account: ${errorData.message.match(/[0-9a-f:]+/i)?.[0] || 'the current server IP'}`);
              console.error('\x1b[34m%s\x1b[0m', 'Link: https://app.brevo.com/security/authorised_ips');
              
              return res.status(401).json({ 
                error: "Email service IP restriction",
                message: "Your server IP is not authorized in Brevo. Please add it to your Authorized IPs in Brevo security settings.",
                link: "https://app.brevo.com/security/authorised_ips"
              });
            }

            return res.status(response.status).json({ 
              error: `Email service error: ${errorData.message || 'Unknown error'}`,
              details: errorData 
            });
          } else {
            console.log('Email sent successfully via Brevo.');
          }
        } catch (emailError: any) {
          console.error('Error sending email via Brevo API (dashboard):', emailError);
          return res.status(500).json({ error: `Connection to email service failed: ${emailError.message}` });
        }
      } else {
        console.warn('BREVO_API_KEY is missing from environment variables.');
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Contact API error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Consolidated Server-side Gemini API Router
  app.all("/api/gemini", async (req, res) => {
    try {
      await geminiHandler(req as any, res as any);
    } catch (err: any) {
      console.error("Error in server.ts /api/gemini route handler:", err);
      res.status(500).json({ error: err.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: {
          port: 0,
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    // Serve static landing page for main domain root
    app.get("/", (req, res, next) => {
      const hostname = req.hostname;
      if (hostname === 'revuqai.com' || hostname === 'www.revuqai.com') {
        // Serve the static landing page HTML
        // We can reuse the landing-v2 logic or just send a file if we had one
        // For now, let's redirect to /landing-v2 or serve it directly
        return res.redirect('/landing-v2');
      }
      next();
    });

    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = http.createServer(app);
  
  // Setup WebSocket server for TTS
  const ttsWss = new WebSocketServer({ noServer: true });
  const assemblyWss = new WebSocketServer({ noServer: true });
  const geminiLiveWss = new WebSocketServer({ noServer: true });

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
    try {
      const pathname = request.url ? new URL(request.url, 'http://localhost').pathname : '';
      console.log(`WebSocket Upgrade requested for pathname: "${pathname}"`);

      // Normalize by stripping trailing slash
      const cleanPath = pathname.replace(/\/$/, "");

      if (cleanPath === '/api/tts') {
        ttsWss.handleUpgrade(request, socket, head, (ws) => {
          ttsWss.emit('connection', ws, request);
        });
      } else if (cleanPath === '/api/assemblyai') {
        assemblyWss.handleUpgrade(request, socket, head, (ws) => {
          assemblyWss.emit('connection', ws, request);
        });
      } else if (cleanPath === '/api/gemini-live') {
        geminiLiveWss.handleUpgrade(request, socket, head, (ws) => {
          geminiLiveWss.emit('connection', ws, request);
        });
      } else {
        console.log(`Destroying socket for unhandled upgrade path: "${pathname}"`);
        socket.destroy();
      }
    } catch (err) {
      console.error("Error during WebSocket upgrade:", err);
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

  geminiLiveWss.on("connection", (clientWs) => {
    console.log("Client connected to Gemini Live local proxy");
    
    let session: any = null;

    clientWs.on("message", async (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === "setup") {
          const { voice, systemInstruction } = msg;
          console.log("Setting up Gemini Live Session with voice:", voice);
          
          const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
          if (!apiKey) {
            clientWs.send(JSON.stringify({ type: "error", error: "GEMINI_API_KEY is not configured on the server." }));
            safeClose(clientWs, 4001, "API Key Missing");
            return;
          }

          const localAi = new GoogleGenAI({
            apiKey: apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build',
              }
            }
          });

          // Ensure we only pass standard prebuilt voice names to Gemini Live upstream.
          // Cartesia voice UUIDs will cause the upstream connection to fail.
          const GEMINI_VOICES = ["Puck", "Charon", "Kore", "Fenrir", "Zephyr", "Aoede"];
          const geminiVoice = (voice && GEMINI_VOICES.includes(voice)) ? voice : "Zephyr";

          // Connect to Gemini Live
          session = await localAi.live.connect({
            model: "gemini-3.1-flash-live-preview",
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: geminiVoice } },
              },
              systemInstruction: systemInstruction || "You are a helpful language tutor.",
              outputAudioTranscription: {},
              inputAudioTranscription: {},
            },
            callbacks: {
              onopen: () => {
                console.log("Gemini Live session connected upstream");
                if (clientWs.readyState === clientWs.OPEN) {
                  clientWs.send(JSON.stringify({ type: "ready" }));
                }
              },
              onmessage: (message: LiveServerMessage) => {
                if (clientWs.readyState === clientWs.OPEN) {
                  clientWs.send(JSON.stringify({
                    type: "server_message",
                    message
                  }));
                }
              },
              onclose: () => {
                console.log("Gemini Live session closed upstream");
                if (clientWs.readyState === clientWs.OPEN) {
                  clientWs.send(JSON.stringify({ type: "close" }));
                }
              },
              onerror: (err: any) => {
                console.error("Gemini Live upstream error:", err);
                if (clientWs.readyState === clientWs.OPEN) {
                  clientWs.send(JSON.stringify({ type: "error", error: err.message || String(err) }));
                }
              }
            }
          });

        } else if (msg.audio) {
          if (session) {
            session.sendRealtimeInput({
              audio: { data: msg.audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        }
      } catch (e: any) {
        console.error("Error in Gemini Live Proxy message handler:", e);
        if (clientWs.readyState === clientWs.OPEN) {
          clientWs.send(JSON.stringify({ type: "error", error: e.message || String(e) }));
        }
      }
    });

    clientWs.on("close", () => {
      console.log("Client disconnected from Gemini Live local proxy");
      if (session) {
        try {
          session.close();
        } catch (e) {
          console.error("Error closing session on disconnect:", e);
        }
      }
    });
  });

  const startListening = () => {
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
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
