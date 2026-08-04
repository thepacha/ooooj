import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.DEEPGRAM_API_KEY?.trim();
        if (!apiKey) {
            return res.status(500).json({ error: "DEEPGRAM_API_KEY is not configured" });
        }

        console.log("Generating temporary Deepgram token in serverless handler...");
        const response = await fetch("https://api.deepgram.com/v1/auth/grant", {
            method: "POST",
            headers: {
                "Authorization": `Token ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                ttl_seconds: 1800 // 30 minutes
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Failed to generate token: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        res.status(200).json({ token: data.token });

    } catch (error: any) {
        console.error("Error in Deepgram token route:", error);
        res.status(500).json({ 
            error: `Deepgram Token Error: ${error.message || "Unknown error"}`
        });
    }
}
