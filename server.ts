import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";
import dotenv from "dotenv";
import { supabase } from "./lib/supabase";
import { GoogleGenAI, Modality, LiveServerMessage, Type } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes FIRST
  app.use(express.json());
  
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/gemini-key", (req, res) => {
    res.json({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || "" });
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

  // Server-side Gemini API Client & Routes
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured on the server.");
    }
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  app.post("/api/gemini/generate-content", async (req, res) => {
    try {
      const { model, contents, config } = req.body;
      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: model || "gemini-3.5-flash",
        contents,
        config
      });
      res.json({
        text: response.text,
        candidates: response.candidates
      });
    } catch (e: any) {
      console.error("Error in /api/gemini/generate-content:", e);
      res.status(500).json({ error: e.message || "Failed to generate content" });
    }
  });

  app.post("/api/gemini/chat", async (req, res) => {
    try {
      const { model, history, message, config } = req.body;
      const client = getGeminiClient();
      const cleanHistory = Array.isArray(history) && history.length > 0 ? history.slice(0, -1) : [];
      const chat = client.chats.create({
        model: model || "gemini-3.5-flash",
        history: cleanHistory,
        config
      });
      const response = await chat.sendMessage({ message });
      res.json({ text: response.text });
    } catch (e: any) {
      console.error("Error in /api/gemini/chat:", e);
      res.status(500).json({ error: e.message || "Chat failed" });
    }
  });

  app.post("/api/gemini/chat-stream", async (req, res) => {
    try {
      const { model, history, message, config } = req.body;
      const client = getGeminiClient();
      const cleanHistory = Array.isArray(history) && history.length > 0 ? history.slice(0, -1) : [];
      const chat = client.chats.create({
        model: model || "gemini-3.5-flash",
        history: cleanHistory,
        config
      });

      const responseStream = await chat.sendMessageStream({ message });

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
      res.write("data: [DONE]\n\n");
      res.end();
    } catch (e: any) {
      console.error("Error in /api/gemini/chat-stream:", e);
      res.status(500).json({ error: e.message || "Chat stream failed" });
    }
  });

  app.post("/api/gemini/analyze-transcript", async (req, res) => {
    try {
      const { transcript, criteria } = req.body;
      const client = getGeminiClient();
      const criteriaList = Array.isArray(criteria) 
        ? criteria.map((c: any) => `- ${c.name} (Weight: ${c.weight}): ${c.description}`).join('\n')
        : '';
      const prompt = `
        Analyze the following customer service transcript.
        
        TRANSCRIPT:
        ${transcript}
        
        CRITERIA TO EVALUATE:
        ${criteriaList}
        
        Extract the Agent Name and Customer Name if available (otherwise use "Unknown").
        Provide a summary.
        Determine the overall sentiment.
        Score each criterion from 0-100 based on the description and weight.
        Provide reasoning and a suggestion for improvement for each criterion.
        Calculate an overall weighted score.

        Return the result in JSON format.
      `;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              agentName: { type: Type.STRING },
              customerName: { type: Type.STRING },
              summary: { type: Type.STRING },
              sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative'] },
              overallScore: { type: Type.NUMBER },
              criteriaResults: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    score: { type: Type.NUMBER },
                    reasoning: { type: Type.STRING },
                    suggestion: { type: Type.STRING }
                  },
                  required: ['name', 'score', 'reasoning', 'suggestion']
                }
              }
            },
            required: ['agentName', 'customerName', 'summary', 'sentiment', 'overallScore', 'criteriaResults']
          }
        }
      });

      const resultText = response.text || "{}";
      const parsed = JSON.parse(resultText);

      if (parsed.criteriaResults && parsed.criteriaResults.length > 0 && Array.isArray(criteria)) {
        let totalWeight = 0;
        let weightedScoreSum = 0;
        parsed.criteriaResults.forEach((result: any) => {
          const originalCriterion = criteria.find((c: any) => c.name === result.name);
          const weight = originalCriterion ? originalCriterion.weight : 1;
          totalWeight += weight;
          weightedScoreSum += (result.score || 0) * weight;
        });
        if (totalWeight > 0) {
          parsed.overallScore = Math.round(weightedScoreSum / totalWeight);
        }
      }

      res.json(parsed);
    } catch (e: any) {
      console.error("Error in /api/gemini/analyze-transcript:", e);
      res.status(500).json({ error: e.message || "Failed to analyze transcript" });
    }
  });

  app.post("/api/gemini/generate-mock-transcript", async (req, res) => {
    try {
      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: "Generate a realistic 10-turn customer support transcript between an Agent and a Customer regarding a billing dispute. The customer should be slightly annoyed but the agent resolves it. Format it as plain text.",
      });
      res.json({ text: response.text || "" });
    } catch (e: any) {
      console.error("Error in /api/gemini/generate-mock-transcript:", e);
      res.status(500).json({ error: e.message || "Failed to generate mock transcript" });
    }
  });

  app.post("/api/gemini/transcribe-media", async (req, res) => {
    try {
      const { base64Data, mimeType } = req.body;
      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: "Transcribe this audio. Return only the transcript text with speaker labels (Agent/Customer)." }
          ]
        }
      });
      res.json({ text: response.text || "" });
    } catch (e: any) {
      console.error("Error in /api/gemini/transcribe-media:", e);
      res.status(500).json({ error: e.message || "Failed to transcribe media" });
    }
  });

  app.post("/api/gemini/generate-training-topic", async (req, res) => {
    try {
      const { params } = req.body;
      const client = getGeminiClient();
      let contextStr = '';
      if (params) {
        contextStr = `
        Please tailor the topic to the following parameters:
        - Language: ${params.language}
        - Buyer Mode: ${params.mood}
        - Persona: ${params.persona}
        - Difficulty: ${params.difficulty}
        - Industry: ${params.industry}
        - Funnel Stage: ${params.funnelStage}
        - Category: ${params.category}
        `;
      }
      const prompt = `
        Generate a single, concise, and creative scenario description for a customer service or sales roleplay training session.
        It should be 1-2 sentences.
        ${contextStr}
        
        Examples:
        - "A long-time customer is threatening to cancel because a competitor offered a lower price."
        - "A confused user cannot find the export button and is getting frustrated."
        - "A potential client is interested in the Enterprise plan but thinks the implementation time is too long."
        
        Return ONLY the text of the scenario description. No JSON, no markdown.
      `;
      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt
      });
      res.json({ text: response.text?.trim() || "" });
    } catch (e: any) {
      console.error("Error in /api/gemini/generate-training-topic:", e);
      res.status(500).json({ error: e.message || "Failed to generate training topic" });
    }
  });

  app.post("/api/gemini/generate-ai-scenario", async (req, res) => {
    try {
      const { params } = req.body;
      const client = getGeminiClient();
      const seed = Date.now().toString();
      const { topic, category, difficulty, funnelStage, persona, mood, industry, language, dialect } = params || {};

      const prompt = `
        Create a rich, complex training roleplay scenario for a ${category || 'Support'} agent.
        Random Seed: ${seed}
        
        CORE CONTEXT: ${topic || 'General customer issue'}
        ${industry ? `INDUSTRY: ${industry} (Ensure terminology and context is specific to this industry)` : ''}
        DIFFICULTY: ${difficulty || 'Intermediate'}
        
        ${funnelStage ? `SALES STAGE: ${funnelStage} (Ensure the customer behavior reflects this specific stage of the funnel)` : ''}
        ${persona ? `BUYER PERSONA: ${persona}` : 'PERSONA: Create a random realistic persona'}
        ${mood ? `CUSTOMER MOOD: ${mood}` : ''}
        ${language ? `LANGUAGE: ${language}` : 'LANGUAGE: English'}
        ${dialect ? `DIALECT: ${dialect}` : ''}
        
        INSTRUCTIONS:
        1. Assign a GENDER and NAME suitable for the persona and language/dialect.
        2. Select a suitable VOICE for this persona:
           - 'Puck' (Male, Mid-range)
           - 'Charon' (Male, Deep)
           - 'Kore' (Female, Professional)
           - 'Fenrir' (Male, Authoritative)
           - 'Aoede' (Female, Soft/High)
        3. Define "HIDDEN CONTEXT": Secrets the customer holds (e.g., budget constraints, hidden decision makers, technical limitations).
        4. Write a detailed System Instruction that forces the AI to stay in character. 
           If Sales Stage is 'Closing', make them negotiate terms.
           If Sales Stage is 'Discovery', make them answer questions but be guarded.
           If Mood is '${mood}', reflect that in sentence length and tone.
           The AI MUST speak in the requested LANGUAGE (${language || 'English'})${dialect ? ` and DIALECT (${dialect})` : ''}.
         5. Be creative!
         6. Generate 5 distinct "Mission Objectives" for the agent relevant to the ${funnelStage || 'situation'}.
         7. Generate 6 "Suggested Talk Tracks" (direct quotes/phrases) in the requested language.
         8. Generate 4 "Smart Openers" - effective opening lines for the agent to use in this specific scenario, in the requested language.
         9. The initialMessage MUST be in the requested language and dialect.
         
         IMPORTANT: Ensure the scenario details (Name, Context, Secret) are fresh and creative.

         Return JSON.
      `;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              difficulty: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced'] },
              category: { type: Type.STRING, enum: ['Sales', 'Support', 'Technical'] },
              initialMessage: { type: Type.STRING },
              systemInstruction: { type: Type.STRING },
              voice: { type: Type.STRING, enum: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'] },
              language: { type: Type.STRING },
              dialect: { type: Type.STRING },
              objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
              talkTracks: { type: Type.ARRAY, items: { type: Type.STRING } },
              openers: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['title', 'description', 'difficulty', 'category', 'initialMessage', 'systemInstruction', 'voice', 'objectives', 'talkTracks', 'openers']
          }
        }
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (e: any) {
      console.error("Error in /api/gemini/generate-ai-scenario:", e);
      res.status(500).json({ error: e.message || "Failed to generate AI scenario" });
    }
  });

  app.post("/api/gemini/generate-training-batch", async (req, res) => {
    try {
      const client = getGeminiClient();
      const factors = [
        "Include a VIP customer demanding special treatment.",
        "Include a user who accidentally deleted their data.",
        "Include a sales lead who is budget-conscious.",
        "Include a technical user who thinks they know more than the agent.",
        "Include a user rushing to catch a flight.",
        "Include a user who is pleasantly surprised but has one concern."
      ];
      const randomFactor = factors[Math.floor(Math.random() * factors.length)];
      const seed = Date.now().toString().slice(-4);

      const prompt = `
        Generate 3 distinct, highly realistic customer service roleplay scenarios.
        Random Seed: ${seed}
        Special Constraint: ${randomFactor}
        
        CRITERIA:
        1. Unique Names: Use diverse names and professions (e.g. 'Dr. Aris', 'Captain Lee', 'Sarah the Architect').
        2. Unique Personas: Vary age, job title, and temperament (Angry, Confused, Rush, Happy).
        3. Contexts: Mix of Sales (objections), Technical (bugs), and Support (refunds).
        4. Hidden Secrets: Give each persona a secret (e.g. "lying about usage", "actually broke it themselves", "needs approval from boss").
        5. Voices: Assign a voice that fits the persona from: 'Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'.
        
        Return a JSON object with a "scenarios" key containing an array of 3 objects. Include smart openers for each.
      `;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              scenarios: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    difficulty: { type: Type.STRING, enum: ['Beginner', 'Intermediate', 'Advanced'] },
                    category: { type: Type.STRING, enum: ['Sales', 'Support', 'Technical'] },
                    initialMessage: { type: Type.STRING },
                    systemInstruction: { type: Type.STRING },
                    voice: { type: Type.STRING, enum: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'] },
                    objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                    talkTracks: { type: Type.ARRAY, items: { type: Type.STRING } },
                    openers: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ['title', 'description', 'difficulty', 'category', 'initialMessage', 'systemInstruction', 'voice', 'objectives', 'talkTracks', 'openers']
                }
              }
            }
          }
        }
      });

      const parsed = JSON.parse(response.text || '{"scenarios": []}');
      res.json(parsed.scenarios || []);
    } catch (e: any) {
      console.error("Error in /api/gemini/generate-training-batch:", e);
      res.status(500).json({ error: e.message || "Failed to generate training batch" });
    }
  });

  app.post("/api/gemini/generate-smart-openers", async (req, res) => {
    try {
      const { scenario } = req.body;
      const client = getGeminiClient();
      const prompt = `
        Generate 4 distinct, professional, and highly effective opening lines for a customer service agent handling this specific situation.
        
        SCENARIO: ${scenario.title}
        DESCRIPTION: ${scenario.description}
        CUSTOMER PERSONA: ${scenario.systemInstruction}
        GOAL: Resolve the issue efficiently while maintaining high empathy.
        
        LANGUAGE: ${scenario.language || 'English'}
        DIALECT: ${scenario.dialect || 'N/A'}

        REQUIREMENTS:
        1. Openers must be "Smart" & "Professional" - avoid generic "How can I help?".
        2. Tailor them to the specific context (e.g. if angry, validate emotion first).
        3. Use psychological techniques (e.g. labeling, agenda setting).
        4. Make them sound human, not robotic.
        5. The openers MUST be in the specified LANGUAGE and DIALECT.

        Return strictly a JSON array of strings.
      `;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        }
      });

      res.json(JSON.parse(response.text || "[]"));
    } catch (e: any) {
      console.error("Error in /api/gemini/generate-smart-openers:", e);
      res.status(500).json({ error: e.message || "Failed to generate smart openers" });
    }
  });

  app.post("/api/gemini/evaluate-training-session", async (req, res) => {
    try {
      const { transcript, scenario } = req.body;
      const client = getGeminiClient();
      const prompt = `
        Analyze the following language practice conversation transcript between a Learner (User) and their Friendly Native AI Partner.
        
        SCENARIO: ${scenario.title}
        DIFFICULTY: ${scenario.difficulty}
        DESCRIPTION: ${scenario.description}
        TARGET LANGUAGE: ${scenario.language || 'English'}
        
        TRANSCRIPT:
        ${transcript}
        
        Evaluate the Learner's performance across exactly 5 specific language learning metrics, allocating scores from 0 to 100 for each. Each metric has a specific weight:
        1. "Task Completion" (Weight: 40%): Did the learner achieve the functional goals of the real-life conversation?
        2. "Fluency" (Weight: 20%): How smooth, natural, and conversational was the learner's response flow?
        3. "Pronunciation" (Weight: 15%): Based on textual phonetic hints or spelling mistakes, how clear and correct was the pronunciation/enunciation?
        4. "Vocabulary" (Weight: 15%): Did the learner use appropriate, varied, and relevant vocabulary for this situation?
        5. "Grammar" (Weight: 10%): Was the learner's grammar, tense usage, word order, and syntax correct?
        
        Calculate the overall score as a weighted sum of these five metrics:
        Overall Score = (Task Completion * 0.4) + (Fluency * 0.2) + (Pronunciation * 0.15) + (Vocabulary * 0.15) + (Grammar * 0.1)
        
        Also provide a "Conversation Breakdown" detailing:
        - Strengths: What did they do particularly well? (e.g. "Good pronunciation of 'reservation'", "Natural greeting")
        - Mistakes: Specific grammatical, lexical, or pronunciation errors they made. (e.g. "Wrong past tense", "Missed article")
        - Native Alternatives: Pairs of "What they said" vs "What a native would say" to help them sound more natural.
        
        Provide the result in JSON format matching the schema.
      `;

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER, description: "Weighted Overall Score from 0-100 calculated using the weights: Task Completion 40%, Fluency 20%, Pronunciation 15%, Vocabulary 15%, Grammar 10%." },
              feedback: { type: Type.STRING, description: "A friendly 2-3 sentence summary of how they did." },
              criteriaResults: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: "Name of the criterion: 'Task Completion', 'Fluency', 'Pronunciation', 'Vocabulary', or 'Grammar'" },
                    score: { type: Type.NUMBER, description: "Score from 0-100 for this specific criterion" },
                    reasoning: { type: Type.STRING, description: "Why this score was given" },
                    suggestion: { type: Type.STRING, description: "How to improve" }
                  },
                  required: ['name', 'score', 'reasoning', 'suggestion']
                }
              },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of specific visual, verbal, or conceptual strengths in the conversation."
              },
              mistakes: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of specific vocabulary, syntax, or grammar errors made."
              },
              nativeAlternatives: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    original: { type: Type.STRING, description: "What the learner actually said or wrote." },
                    better: { type: Type.STRING, description: "How a native speaker would express this naturally." },
                    explanation: { type: Type.STRING, description: "Brief explanation of why the alternative is more natural." }
                  },
                  required: ['original', 'better', 'explanation']
                },
                description: "Specific phrasings mapped to natural, native speaker idioms or sentences."
              },
              sentiment: { type: Type.STRING, enum: ['Positive', 'Neutral', 'Negative'], description: "The overall sentiment of the interaction." }
            },
            required: ['score', 'feedback', 'criteriaResults', 'strengths', 'mistakes', 'nativeAlternatives', 'sentiment']
          }
        }
      });

      res.json(JSON.parse(response.text || "{}"));
    } catch (e: any) {
      console.error("Error in /api/gemini/evaluate-training-session:", e);
      res.status(500).json({ error: e.message || "Failed to evaluate training session" });
    }
  });

  app.post("/api/gemini/generate-arabic-tts", async (req, res) => {
    try {
      const { text, dialect, voice } = req.body;
      const client = getGeminiClient();
      const prompt = `Speak this text in ${dialect} Arabic: ${text}`;
      const response = await client.models.generateContent({
        model: "gemini-3.1-flash-tts-preview",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error("Failed to generate audio from Gemini TTS");
      }
      res.json({ base64Audio });
    } catch (e: any) {
      console.error("Error in /api/gemini/generate-arabic-tts:", e);
      res.status(500).json({ error: e.message || "Failed to generate Arabic TTS" });
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
    const pathname = new URL(request.url!, `http://${request.headers.host}`).pathname;

    if (pathname === '/api/tts') {
      ttsWss.handleUpgrade(request, socket, head, (ws) => {
        ttsWss.emit('connection', ws, request);
      });
    } else if (pathname === '/api/assemblyai') {
      assemblyWss.handleUpgrade(request, socket, head, (ws) => {
        assemblyWss.emit('connection', ws, request);
      });
    } else if (pathname === '/api/gemini-live') {
      geminiLiveWss.handleUpgrade(request, socket, head, (ws) => {
        geminiLiveWss.emit('connection', ws, request);
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
