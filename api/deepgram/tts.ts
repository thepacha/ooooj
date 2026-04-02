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
            
            batchResults.forEach(result => {
                if (result) {
                    audioBuffers[result.index] = result.buffer;
                }
            });
        }

        const finalBuffer = Buffer.concat(audioBuffers.filter(Boolean));

        res.setHeader("Content-Type", "audio/mpeg");
        res.send(finalBuffer);

    } catch (error: any) {
        console.error("Error in Deepgram TTS route:", error);
        res.status(500).json({ 
            error: error.message || "Internal server error",
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
