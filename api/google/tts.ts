import type { VercelRequest, VercelResponse } from '@vercel/node';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, model } = req.body;
        
        if (!text) {
            return res.status(400).json({ error: "Text is required" });
        }

        const apiKey = process.env.GOOGLE_TTS_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "GOOGLE_TTS_API_KEY is not configured" });
        }

        const chunks = splitText(text, 4800);
        const audioBuffers: Buffer[] = [];

        for (const chunk of chunks) {
            if (!chunk) continue;

            const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    input: { text: chunk },
                    voice: { 
                        languageCode: model.split('-').slice(0, 2).join('-'), 
                        name: model 
                    },
                    audioConfig: { 
                        audioEncoding: "MP3",
                        sampleRateHertz: 24000
                    }
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error?.message || response.statusText;
                const errorCode = errorData.error?.code || response.status;
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
}
