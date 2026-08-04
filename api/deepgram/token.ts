import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log("[Deepgram Token API] Request received to generate temporary token.");
        const apiKey = process.env.DEEPGRAM_API_KEY;
        if (!apiKey) {
            console.error("[Deepgram Token API] DEEPGRAM_API_KEY is not configured on the server.");
            return res.status(500).json({ error: "DEEPGRAM_API_KEY is not configured on the server" });
        }

        console.log("[Deepgram Token API] Requesting 60-second scoped temporary key from Deepgram Auth Grant API...");
        const response = await fetch("https://api.deepgram.com/v1/auth/grant", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${apiKey}`
            },
            body: JSON.stringify({ ttl_seconds: 60 })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Deepgram Token API] Deepgram Auth Grant endpoint error: Status ${response.status} - ${errorText}`);
            return res.status(response.status).json({ error: "Deepgram API error during token grant", details: errorText });
        }

        const data = await response.json();
        console.log("[Deepgram Token API] Scoped temporary token generated successfully. Expires in 60s.");
        return res.status(200).json(data);
    } catch (error: any) {
        console.error("[Deepgram Token API] Error generating token:", error);
        return res.status(500).json({ 
            error: error.message || "Internal server error",
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}
