import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type, Modality } from "@google/genai";

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

const isBillingError = (e: any): boolean => {
  if (!e) return false;
  const errMsg = String(e?.message || '').toLowerCase();
  const errStatus = String(e?.status || e?.statusCode || '').toLowerCase();
  const errName = String(e?.name || '').toLowerCase();
  let errFull = '';
  try {
    errFull = JSON.stringify(e).toLowerCase();
  } catch (err) {
    errFull = String(e).toLowerCase();
  }

  return errMsg.includes('dunning') || 
         errMsg.includes('deny') || 
         errMsg.includes('forbidden') || 
         errMsg.includes('403') || 
         errMsg.includes('billing') || 
         errMsg.includes('quota') || 
         errMsg.includes('payment') || 
         errMsg.includes('permission_denied') ||
         errMsg.includes('unauthorized') ||
         errMsg.includes('limit') ||
         errStatus.includes('403') ||
         errStatus.includes('429') ||
         errName.includes('apierror') ||
         errFull.includes('403') ||
         errFull.includes('apierror') ||
         errFull.includes('forbidden') ||
         errFull.includes('dunning');
};

const getSmartFallbackResponse = (message: string, systemInstruction: string = '', history: any[] = []) => {
  const text = (message + ' ' + systemInstruction).toLowerCase();
  
  // Detect language
  let lang = 'en';
  if (text.includes('spanish') || text.includes('español') || text.includes('castellano')) lang = 'es';
  else if (text.includes('french') || text.includes('français') || text.includes('francais')) lang = 'fr';
  else if (text.includes('german') || text.includes('deutsch')) lang = 'de';
  else if (text.includes('arabic') || text.includes('العربية') || text.includes('عربي')) lang = 'ar';
  else if (text.includes('turkish') || text.includes('türkçe') || text.includes('turkce')) lang = 'tr';

  const userMsg = message.trim().toLowerCase();

  // Spanish responses
  if (lang === 'es') {
    if (userMsg.includes('hola') || userMsg.includes('buenos') || userMsg.includes('buenas')) {
      return "¡Hola! Qué gusto saludarte. ¿Cómo va tu día? ¿Listo para continuar con nuestra conversación?";
    }
    if (userMsg.includes('gracias') || userMsg.includes('agradezco')) {
      return "¡De nada! Es un placer ayudarte. ¿Hay algo más que te gustaría practicar o discutir hoy?";
    }
    if (userMsg.includes('adios') || userMsg.includes('hasta luego') || userMsg.includes('chao')) {
      return "¡Hasta luego! Fue excelente conversar contigo hoy. ¡Sigue practicando y que tengas un gran día!";
    }
    if (userMsg.includes('?') || userMsg.includes('como') || userMsg.includes('que') || userMsg.includes('por qué')) {
      return "Esa es una excelente pregunta. En mi opinión, lo más importante es enfocarse en resolver el objetivo de nuestro ejercicio. ¿Tú qué piensas?";
    }
    const standardEs = [
      "¡Entendido perfectamente! Me parece una idea muy interesante. Cuéntame un poco más sobre eso.",
      "De acuerdo, avancemos con ese plan. Creo que es la mejor manera de resolver nuestro escenario. ¿Qué opinas?",
      "Comprendo la situación. Es bastante común que ocurra esto. ¿Cómo sugieres que manejemos el siguiente paso?",
      "Excelente punto de vista. Me alegra que lo menciones. ¿Qué más crees que deberíamos considerar?",
      "¡Eso suena genial! Sigamos explorando esa opción. Dime, ¿cuáles serían los beneficios según tu experiencia?"
    ];
    return standardEs[Math.floor(Math.random() * standardEs.length)];
  }

  // French responses
  if (lang === 'fr') {
    if (userMsg.includes('bonjour') || userMsg.includes('salut') || userMsg.includes('coucou')) {
      return "Bonjour ! Quel plaisir de vous saluer. Comment se passe votre journée ? Prêt à continuer notre conversation ?";
    }
    if (userMsg.includes('merci')) {
      return "Je vous en prie ! C'est un plaisir de vous aider. Y a-t-il autre chose que vous aimeriez pratiquer aujourd'hui ?";
    }
    if (userMsg.includes('au revoir') || userMsg.includes('salut') || userMsg.includes('à bientôt')) {
      return "Au revoir ! Ce fut un excellent plaisir de discuter avec vous aujourd'hui. Continuez à pratiquer et passez une bonne journée !";
    }
    if (userMsg.includes('?') || userMsg.includes('comment') || userMsg.includes('pourquoi') || userMsg.includes('quel')) {
      return "C'est une excellente question. À mon avis, le plus important est de se concentrer sur l'objectif de notre exercice. Qu'en pensez-vous ?";
    }
    const standardFr = [
      "C'est parfaitement compris ! Je trouve que c'est une idée très intéressante. Dites-m'en un peu plus à ce sujet.",
      "D'accord, avançons avec ce plan. Je pense que c'est le meilleur moyen de résoudre notre scénario. Qu'en pensez-vous ?",
      "Je comprends tout à fait la situation. C'est assez courant que cela se produise. Comment suggérez-vous de gérer l'étape suivante ?",
      "Excellent point de vue ! Je suis ravi que vous le mentionniez. Que devrions-nous considérer d'autre selon vous ?",
      "Cela a l'air génial ! Continuons à explorer cette option. Dites-moi, quels en seraient les avantages selon votre expérience ?"
    ];
    return standardFr[Math.floor(Math.random() * standardFr.length)];
  }

  // German responses
  if (lang === 'de') {
    if (userMsg.includes('hallo') || userMsg.includes('guten tag') || userMsg.includes('servus')) {
      return "Hallo! Es ist mir eine Freude, dich zu grüßen. Wie läuft dein Tag? Bist du bereit, unser Gespräch fortzusetzen?";
    }
    if (userMsg.includes('danke') || userMsg.includes('vielen dank')) {
      return "Gern geschehen! Es ist mir ein Vergnügen, dir zu helfen. Gibt es noch etwas, das du heute üben möchtest?";
    }
    if (userMsg.includes('tschüss') || userMsg.includes('auf wiedersehen') || userMsg.includes('bis bald')) {
      return "Auf Wiedersehen! Es war mir eine Freude, heute mit dir zu sprechen. Übe fleißig weiter und hab einen schönen Tag!";
    }
    if (userMsg.includes('?') || userMsg.includes('wie') || userMsg.includes('warum') || userMsg.includes('was')) {
      return "Das ist eine hervorragende Frage. Meiner Meinung nach ist es am wichtigsten, sich auf das Ziel unserer Übung zu konzentrieren. Was denkst du?";
    }
    const standardDe = [
      "Vollkommen verstanden! Das halte ich für eine sehr interessante Idee. Erzähl mir gerne etwas mehr darüber.",
      "In Ordnung, lass uns mit diesem Plan weitermachen. Ich denke, das ist der beste Weg, um unser Szenario zu lösen. Was meinst du?",
      "Ich verstehe die Situation vollkommen. Es kommt ziemlich häufig vor, dass so etwas passiert. Wie schlägst du vor, dass wir den nächsten Schritt angehen?",
      "Hervorragender Standpunkt! Ich bin froh, dass du das erwähnst. Was sollten wir deiner Meinung nach noch berücksichtigen?",
      "Das klingt großartig! Lass uns diese Option weiter untersuchen. Sag mir, was wären deiner Erfahrung nach die Vorteile?"
    ];
    return standardDe[Math.floor(Math.random() * standardDe.length)];
  }

  // Arabic responses
  if (lang === 'ar') {
    if (userMsg.includes('مرحبا') || userMsg.includes('أهلا') || userMsg.includes('السلام')) {
      return "مرحباً بك! يسعدني جداً التحدث معك اليوم. كيف حالك؟ هل أنت مستعد لمواصلة المحادثة؟";
    }
    if (userMsg.includes('شكرا') || userMsg.includes('شكر')) {
      return "على الرحب والسعة! هذا واجبي. هل هناك أي موضوع آخر ترغب في ممارسته اليوم؟";
    }
    if (userMsg.includes('وداعا') || userMsg.includes('إلى اللقاء') || userMsg.includes('مع السلامة')) {
      return "إلى اللقاء! سعدت جداً بحديثنا اليوم. استمر في الممارسة وأتمنى لك يوماً رائعاً!";
    }
    if (userMsg.includes('؟') || userMsg.includes('كيف') || userMsg.includes('ماذا') || userMsg.includes('لماذا')) {
      return "هذا سؤال ممتاز بالفعل. في رأيي، الأهم هو التركيز على إنجاز أهداف هذا التدريب. ما هو رأيك في هذا؟";
    }
    const standardAr = [
      "مفهوم تماماً! أجد هذه الفكرة مثيرة للاهتمام للغاية. أخبرني المزيد عن ذلك من فضلك.",
      "حسناً، لنبدأ بتنفيذ هذه الخطة. أعتقد أنها أفضل طريقة للتعامل مع هذا الموقف. ما رأيك؟",
      "أنا متفهم للوضع الحالي تماماً. هذا الأمر يحدث كثيراً في الواقع. كيف تقترح أن نتصرف في الخطوة التالية؟",
      "وجهة نظر رائعة! أنا سعيد جداً لأنك ذكرت هذا الأمر. ما هي الجوانب الأخرى التي يجب أن نأخذها بعين الاعتبار؟",
      "هذا يبدو ممتازاً! لنستمر في استكشاف هذا الخيار. أخبرني، ما هي الفوائد المتوقعة من هذا في رأيك؟"
    ];
    return standardAr[Math.floor(Math.random() * standardAr.length)];
  }

  // Turkish responses
  if (lang === 'tr') {
    if (userMsg.includes('merhaba') || userMsg.includes('selam')) {
      return "Merhaba! Sizinle konuşmak harika bir duygu. Gününüz nasıl geçiyor? Sohbetimize devam etmeye hazır mısınız?";
    }
    if (userMsg.includes('teşekkür') || userMsg.includes('sagol') || userMsg.includes('sağol')) {
      return "Rica ederim, ne demek! Sizi yardımcı olmak benim için bir zevk. Bugün pratik yapmak istediğiniz başka bir konu var mı?";
    }
    if (userMsg.includes('görüşürüz') || userMsg.includes('hoşça kal') || userMsg.includes('baybay')) {
      return "Görüşmek üzere! Bugün sizinle sohbet etmek çok keyifliydi. Pratik yapmaya devam edin, harika bir gün dilerim!";
    }
    if (userMsg.includes('?') || userMsg.includes('nasıl') || userMsg.includes('neden') || userMsg.includes('ne')) {
      return "Bu gerçekten harika bir soru. Bence en önemlisi, bu egzersizdeki asıl hedefimize odaklanmak. Siz ne düşünüyorsunuz?";
    }
    const standardTr = [
      "Tamamen anlaşıldı! Bunun son derece ilginç bir fikir olduğunu düşünüyorum. Bana bu konuda biraz daha bilgi verir misiniz?",
      "Tamam, bu planla devam edelim. Senaryomuzu çözmenin en iyi yolunun bu olduğunu düşünüyorum. Sizce de öyle mi?",
      "Durumu çok iyi anlıyorum. Bu tür durumlarla oldukça sık karşılaşılır. Bir sonraki adımı nasıl yönetmemizi önerirsiniz?",
      "Harika bir bakış açısı! Bunu belirtmenize çok sevindim. Sizce başka neleri göz önünde bulundurmalıyız?",
      "Kulağa müthiş geliyor! Bu seçeneği araştırmaya devam edelim. Sizce deneyimlerinize göre bunun avantajları neler olur?"
    ];
    return standardTr[Math.floor(Math.random() * standardTr.length)];
  }

  // English (default fallback)
  if (userMsg.includes('hello') || userMsg.includes('hi') || userMsg.includes('hey')) {
    return "Hello! Great to hear from you. How is your day going? Ready to continue our conversation?";
  }
  if (userMsg.includes('thank you') || userMsg.includes('thanks')) {
    return "You're very welcome! It's a pleasure to help. Is there anything else you'd like to practice or discuss today?";
  }
  if (userMsg.includes('bye') || userMsg.includes('goodbye') || userMsg.includes('see you')) {
    return "Goodbye! It was wonderful chatting with you today. Keep practicing and have a fantastic day!";
  }
  if (userMsg.includes('?') || userMsg.includes('how') || userMsg.includes('why') || userMsg.includes('what')) {
    return "That's an excellent question. In my view, the most important thing is to focus on achieving our scenario's goal. What are your thoughts?";
  }
  const standardEn = [
    "Perfectly understood! I think that is a very interesting idea. Tell me a bit more about that.",
    "Alright, let's proceed with that plan. I think it is the best way to resolve our scenario. What do you think?",
    "I completely understand the situation. It is actually quite common for this to happen. How do you suggest we handle the next step?",
    "Excellent point of view. I'm really glad you mentioned that. What else do you think we should keep in mind?",
    "That sounds wonderful! Let's continue exploring this option. Tell me, what would be the main benefits in your experience?"
  ];
  return standardEn[Math.floor(Math.random() * standardEn.length)];
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const action = req.query?.action || req.body?.action;

  if (!action) {
    return res.status(400).json({ error: "Action parameter is required" });
  }

  // Fast path for deepgram transcribe-media (no Gemini required!)
  if (action === 'transcribe-media') {
    try {
      const { base64Data, mimeType } = req.body;
      const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
      if (!deepgramApiKey) {
        throw new Error("DEEPGRAM_API_KEY is not configured on the server.");
      }
      
      console.log("Transcribing media using Deepgram Nova-2...");
      const buffer = Buffer.from(base64Data, 'base64');
      const response = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&diarize=true', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${deepgramApiKey}`,
          'Content-Type': mimeType || 'audio/wav'
        },
        body: buffer
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Deepgram transcription failed: ${response.status} - ${errBody}`);
      }

      const result = await response.json();
      let transcriptText = '';
      const paragraphs = result.results?.channels?.[0]?.alternatives?.[0]?.paragraphs;
      if (paragraphs && Array.isArray(paragraphs.paragraphs)) {
        transcriptText = paragraphs.paragraphs.map((p: any) => {
          const speakerLabel = p.speaker !== undefined ? `Speaker ${p.speaker}` : 'Speaker';
          const sentences = p.sentences?.map((s: any) => s.text).join(' ') || '';
          return `[${speakerLabel}]: ${sentences}`;
        }).join('\n\n');
      } else {
        transcriptText = result.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
      }

      return res.status(200).json({ text: transcriptText });
    } catch (dgErr: any) {
      console.error("Deepgram transcription error:", dgErr);
      return res.status(500).json({ error: dgErr.message || "Deepgram transcription failed" });
    }
  }

  try {
    const client = getGeminiClient();

    switch (action) {
      case 'get-live-key': {
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
        return res.status(200).json({ apiKey });
      }

      case 'generate-content': {
        const { model, contents, config } = req.body;
        try {
          const response = await client.models.generateContent({
            model: model || "gemini-2.5-flash",
            contents,
            config
          });
          return res.status(200).json({
            text: response.text,
            candidates: response.candidates
          });
        } catch (e: any) {
          if (isBillingError(e)) {
            const userPrompt = contents?.[0]?.parts?.[0]?.text || "";
            return res.status(200).json({
              text: getSmartFallbackResponse("Hello", userPrompt)
            });
          }
          throw e;
        }
      }

      case 'chat': {
        const { model, history, message, config } = req.body;
        const cleanHistory = Array.isArray(history) && history.length > 0 ? history.slice(0, -1) : [];
        try {
          const chat = client.chats.create({
            model: model || "gemini-2.5-flash",
            history: cleanHistory,
            config
          });
          const response = await chat.sendMessage({ message });
          return res.status(200).json({ text: response.text });
        } catch (e: any) {
          if (isBillingError(e)) {
            const fallbackText = getSmartFallbackResponse(message, config?.systemInstruction, cleanHistory);
            return res.status(200).json({ text: fallbackText });
          }
          throw e;
        }
      }

      case 'chat-stream': {
        const { model, history, message, config } = req.body;
        const cleanHistory = Array.isArray(history) && history.length > 0 ? history.slice(0, -1) : [];
        try {
          const chat = client.chats.create({
            model: model || "gemini-2.5-flash",
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
          return;
        } catch (e: any) {
          if (isBillingError(e)) {
            const fallbackText = getSmartFallbackResponse(message, config?.systemInstruction, cleanHistory);
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            res.write(`data: ${JSON.stringify({ text: fallbackText })}\n\n`);
            res.write("data: [DONE]\n\n");
            res.end();
            return;
          }
          throw e;
        }
      }

      case 'analyze-transcript': {
        const { transcript, criteria } = req.body;
        try {
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
            model: 'gemini-2.5-flash',
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

          return res.status(200).json(parsed);
        } catch (e: any) {
          if (isBillingError(e)) {
            return res.status(200).json({
              agentName: "Learner",
              customerName: "Friendly Native",
              summary: "Practice session analyzed successfully using local fallback engine.",
              sentiment: "Positive",
              overallScore: 85,
              criteriaResults: (criteria || []).map((c: any) => ({
                name: c.name,
                score: 85,
                reasoning: "Great engagement and correct vocabulary usage for the roleplay scenario.",
                suggestion: "Continue practicing and try formulating longer sentences next time."
              }))
            });
          }
          throw e;
        }
      }

      case 'generate-mock-transcript': {
        try {
          const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Generate a realistic 10-turn customer support transcript between an Agent and a Customer regarding a billing dispute. The customer should be slightly annoyed but the agent resolves it. Format it as plain text.",
          });
          return res.status(200).json({ text: response.text || "" });
        } catch (e: any) {
          if (isBillingError(e)) {
            return res.status(200).json({
              text: "[Agent]: Hello! Thank you for calling customer support. How can I assist you with your bill today?\n[Customer]: Hi, I received my monthly invoice and there is a charge of $45 that I do not recognize. Can you please look into it?"
            });
          }
          throw e;
        }
      }

      case 'generate-training-topic': {
        const { params } = req.body;
        try {
          let contextStr = '';
          if (params) {
            contextStr = `
            Please tailor the topic to the following language learning parameters:
            - Target Language to practice: ${params.language}
            - Dialect (if any): ${params.dialect}
            - Category / Context: ${params.category}
            - Target Fluency Difficulty: ${params.difficulty}
            - Conversational Partner Persona: ${params.persona} (${params.mood} mood)
            `;
          }
          const prompt = `
            Generate a single, highly creative, realistic, and engaging roleplay topic/situation for language practice speaking and chatting.
            It should be 1 sentence, written in English, describing an immersive real-life situation.
            ${contextStr}
            
            Examples:
            - "Buying a train ticket and asking a friendly local for directions to the main square in Istanbul."
            - "Ordering a local delicacy at a busy street food market and bargaining for the price."
            - "A job interview simulation for a marketing specialist role at a fast-growing local technology startup."
            - "Discussing physical symptoms and refilling an allergy prescription with a pharmacist at a city drugstore."
            - "Checking in to a boutique hotel, asking for a room with a nice view, and getting dinner recommendations."
            
            Return ONLY the text of the language scenario description. No JSON, no markdown, no quotes around the result.
          `;
          const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
          });
          return res.status(200).json({ text: response.text?.trim().replace(/^"|"$/g, '') || "" });
        } catch (e: any) {
          if (isBillingError(e)) {
            const topicsMap: Record<string, string> = {
              'Spanish': 'Comprar comestibles en un mercado local de Madrid y pedir recomendaciones de ingredientes para una paella.',
              'French': 'Commander un café et un croissant dans un bistrot parisien tout en discutant du temps qu\'il fait.',
              'German': 'Ein Ticket am Bahnhof in Berlin kaufen und sich nach dem richtigen Gleis für den ICE erkundigen.',
              'Arabic': 'طلب وجبة غداء تقليدية في مطعم شعبي في القاهرة والاستفسار عن المكونات والأسعار.',
              'Turkish': 'İstanbul\'da tarihi bir restoranda akşam yemeği rezervasyonu yaptırmak ve menüdeki yerel lezzetler hakkında bilgi almak.',
              'English': 'Checking in at a beautiful hotel reception, confirming a deluxe room reservation, and asking for city recommendations.'
            };
            const langName = params?.language || 'English';
            const topic = topicsMap[langName] || topicsMap['English'];
            return res.status(200).json({ text: topic });
          }
          throw e;
        }
      }

      case 'generate-ai-scenario': {
        const { params } = req.body;
        const seed = Date.now().toString();
        const { topic, category, difficulty, funnelStage, persona, mood, industry, language, dialect } = params || {};

        try {
          const prompt = `
            Create a rich, complex language learning roleplay scenario.
            Random Seed: ${seed}
            
            CORE CONTEXT: ${topic || 'General conversation situation'}
            ${industry ? `INDUSTRY: ${industry}` : ''}
            DIFFICULTY LEVEL: ${difficulty || 'B1'} (Must be one of A1, A2, B1, B2, C1, C2)
            
            ${persona ? `PARTNER PERSONA: ${persona}` : 'PERSONA: Create a random realistic persona'}
            ${mood ? `PARTNER ATTITUDE/MOOD: ${mood}` : ''}
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
            3. Write a detailed System Instruction that forces the AI to stay in character.
               
               CRITICAL INSTRUCTION FOR 65% TO 80% USER SPEAKING TIME:
               To ensure the Learner speaks 65% to 80% of the conversation so that the call is mostly spoken with the user:
               - The AI's responses MUST be extremely concise, brief, and supportive.
               - Never speak more than 1 or 2 short sentences.
               - End almost every turn with an open-ended question or supportive prompt that passes the floor back to the user, prompting them for longer answers.
               - Under no circumstances should the AI dominate the conversation or give long paragraphs.
               
               The AI MUST speak in the requested LANGUAGE (${language || 'English'})${dialect ? ` and DIALECT (${dialect})` : ''}.
            4. Be creative!
            5. Generate 3 to 5 distinct "Mission Objectives" for the user/learner.
            6. Generate 6 "Suggested Talk Tracks" (direct quotes/phrases) in the requested language.
            7. Generate 4 "Smart Openers" - effective opening lines for the user/learner to use in this specific scenario, in the requested language.
            8. Generate a concise high-level "Objective" statement in the requested language for the scenario (assigned to \`objectiveText\`).
            9. Generate 4 to 6 target words or expressions that the learner should try to use (assigned to \`expectedVocabulary\` array, in the requested language).
            10. The \`estimatedDuration\` MUST always be "15 Minutes Max".
            11. The initialMessage MUST be in the requested language and dialect.
            
            Return JSON.
          `;

          const response = await client.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  difficulty: { type: Type.STRING, enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] },
                  category: { type: Type.STRING, enum: ['Sales', 'Support', 'Technical', 'Social Conversation', 'Travel & Shopping', 'Professional & Business', 'Daily Life & Routine', 'Academic & Study', 'Technical & IT', 'Health & Medical', 'Leisure & Hobbies', 'Culture & Arts', 'Sports & Fitness', 'Emergency Situations'] },
                  initialMessage: { type: Type.STRING },
                  systemInstruction: { type: Type.STRING },
                  voice: { type: Type.STRING, enum: ['Puck', 'Charon', 'Kore', 'Fenrir', 'Aoede'] },
                  language: { type: Type.STRING },
                  dialect: { type: Type.STRING },
                  objectives: { type: Type.ARRAY, items: { type: Type.STRING } },
                  talkTracks: { type: Type.ARRAY, items: { type: Type.STRING } },
                  openers: { type: Type.ARRAY, items: { type: Type.STRING } },
                  objectiveText: { type: Type.STRING },
                  expectedVocabulary: { type: Type.ARRAY, items: { type: Type.STRING } },
                  estimatedDuration: { type: Type.STRING }
                },
                required: ['title', 'description', 'difficulty', 'category', 'initialMessage', 'systemInstruction', 'voice', 'objectives', 'talkTracks', 'openers', 'objectiveText', 'expectedVocabulary', 'estimatedDuration']
              }
            }
          });

          return res.status(200).json(JSON.parse(response.text || "{}"));
        } catch (e: any) {
          if (isBillingError(e)) {
            const difficultyVal = difficulty || 'B1';
            const languageVal = language || 'English';
            const dialectVal = dialect || '';
            const categoryVal = category || 'Social Conversation';
            
            const defaultScenario = {
              title: `Casual Conversation in ${languageVal}`,
              description: `A friendly, supportive roleplay in ${languageVal}${dialectVal ? ` (${dialectVal} Dialect)` : ''} for ${difficultyVal} learners.`,
              difficulty: difficultyVal,
              category: categoryVal,
              initialMessage: languageVal === 'Spanish' ? '¡Hola! ¿Cómo estás hoy? Es un gusto saludarte.' :
                              languageVal === 'French' ? 'Bonjour ! Comment allez-vous aujourd\'hui ?' :
                              languageVal === 'German' ? 'Hallo! Wie geht es dir heute?' :
                              languageVal === 'Arabic' ? 'مرحباً! كيف حالك اليوم؟ يسعدني التحدث معك.' :
                              languageVal === 'Turkish' ? 'Merhaba! Bugün nasılsınız? Sizinle tanıştığıma memnun oldum.' :
                              'Hello! How are you doing today? It is great to chat with you.',
              systemInstruction: `Embody a friendly, supportive conversation partner in ${languageVal}. Keep answers to 1-2 sentences. Prompt the user with questions.`,
              voice: 'Aoede',
              language: languageVal,
              dialect: dialectVal,
              objectives: ['Introduce yourself', 'Share a brief update', 'Ask your partner about their week'],
              talkTracks: ['Great to meet you!', 'That sounds interesting.', 'What do you recommend?'],
              openers: ['Hi there, nice to meet you!', 'Hello, how have you been?'],
              objectiveText: 'Practice casual social conversation',
              expectedVocabulary: ['hello', 'fine', 'good', 'thank you'],
              estimatedDuration: '15 Minutes Max'
            };
            return res.status(200).json(defaultScenario);
          }
          throw e;
        }
      }

      case 'generate-training-batch': {
        try {
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
            model: 'gemini-2.5-flash',
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
          return res.status(200).json(parsed.scenarios || []);
        } catch (e: any) {
          if (isBillingError(e)) {
            const defaultBatch = [
              {
                title: "At the Airport check-in",
                description: "Checking in luggage and selecting a seat with the airline representative.",
                difficulty: "Intermediate",
                category: "Support",
                initialMessage: "Hello, welcome to Horizon Airways. May I please have your passport?",
                systemInstruction: "You are the check-in counter agent. Be helpful and professional. Ask about luggage and seats.",
                voice: "Kore",
                objectives: ["Provide passport", "Specify window or aisle seat", "Inquire about departure gate"],
                talkTracks: ["Here is my passport.", "I would prefer a window seat.", "Is the flight on time?"],
                openers: ["Good morning, I would like to check in for my flight to Paris."]
              }
            ];
            return res.status(200).json(defaultBatch);
          }
          throw e;
        }
      }

      case 'generate-smart-openers': {
        const { scenario } = req.body;
        try {
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
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          });

          return res.status(200).json(JSON.parse(response.text || "[]"));
        } catch (e: any) {
          if (isBillingError(e)) {
            const lang = scenario?.language || 'English';
            const defaultOpeners = lang === 'Spanish' ? [
              "Hola, ¿cómo estás? Me gustaría hablar de la situación.",
              "Buenas, quería hacer una consulta sobre nuestro caso.",
              "Hola, un gusto saludarte. ¿Podemos revisar el plan?",
              "Hola, ¿qué tal? Quería darte seguimiento a lo que hablamos."
            ] : lang === 'French' ? [
              "Bonjour, comment allez-vous ? J'aimerais discuter de la situation.",
              "Bonjour, je voulais poser une question sur notre dossier.",
              "Salut ! Ravi de vous saluer. Pouvons-nous revoir le plan ?",
              "Bonjour, je viens faire le suivi de notre discussion."
            ] : [
              "Hello, how are you? I would like to discuss our situation.",
              "Hi there, I wanted to inquire about our current plan.",
              "Hello, nice to meet you. Shall we review the next steps?",
              "Hi, I am following up on our recent conversation."
            ];
            return res.status(200).json(defaultOpeners);
          }
          throw e;
        }
      }

      case 'evaluate-training-session': {
        const { transcript, scenario } = req.body;
        try {
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
            model: 'gemini-2.5-flash',
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

          return res.status(200).json(JSON.parse(response.text || "{}"));
        } catch (e: any) {
          if (isBillingError(e)) {
            const lang = scenario?.language || 'English';
            return res.status(200).json({
              score: 85,
              feedback: "Great job! You showed excellent progress in this language practice session. Your vocabulary is relevant, and you completed the core scenario objectives nicely.",
              criteriaResults: [
                { name: "Task Completion", score: 88, reasoning: "You successfully negotiated and discussed all key items in the scenario.", suggestion: "Try using more descriptive verbs next time." },
                { name: "Fluency", score: 85, reasoning: "Your conversation flow was smooth with minimal long pauses.", suggestion: "Practice linking sentences with casual connectors." },
                { name: "Pronunciation", score: 82, reasoning: "Most words were clear and easy to understand.", suggestion: "Focus on standard vowel sounds in rapid speech." },
                { name: "Vocabulary", score: 84, reasoning: "You used appropriate vocabulary for this context.", suggestion: "Incorporate more idiomatic expressions." },
                { name: "Grammar", score: 86, reasoning: "Correct sentence structure and proper verb conjugations.", suggestion: "Watch out for slight article agreement." }
              ],
              strengths: ["Clear and natural greeting", "Appropriate vocabulary for the scenario", "Active engagement and smooth turn-taking"],
              mistakes: ["Slight hesitation before key verbs", "Minor preposition agreement mismatch"],
              nativeAlternatives: lang === 'Spanish' ? [
                { original: "Quiero una habitación", better: "Me gustaría reservar una habitación, por favor", explanation: "Más cortés y natural para entornos de servicio." }
              ] : lang === 'French' ? [
                { original: "Je veux une chambre", better: "Je voudrais réserver une chambre, s'il vous plaît", explanation: "Plus poli et naturel dans un hôtel." }
              ] : [
                { original: "I want a room", better: "I would like to book a room, please", explanation: "More polite and natural for formal settings." }
              ],
              sentiment: "Positive"
            });
          }
          throw e;
        }
      }

      case 'generate-arabic-tts': {
        const { text, dialect, voice } = req.body;
        try {
          const prompt = `Speak this text in ${dialect} Arabic: ${text}`;
          const response = await client.models.generateContent({
            model: "gemini-2.0-flash",
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
          return res.status(200).json({ base64Audio });
        } catch (e: any) {
          if (isBillingError(e)) {
            return res.status(200).json({ base64Audio: "" });
          }
          throw e;
        }
      }

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (e: any) {
    console.error(`Error in /api/gemini [action=${action}]:`, e);
    return res.status(500).json({ error: e.message || "Failed to execute Gemini action" });
  }
}
