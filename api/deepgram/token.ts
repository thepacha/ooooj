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
        return res.status(200).end();
    }

    try {
        const apiKey = process.env.DEEPGRAM_API_KEY;
        if (!apiKey) {
            console.error("DEEPGRAM_API_KEY is not configured");
            return res.status(500).json({ error: "DEEPGRAM_API_KEY is not configured on the server." });
        }

        console.log("Generating temporary Deepgram token via auth/grant...");
        const response = await fetch('https://api.deepgram.com/v1/auth/grant', {
            method: 'POST',
            headers: {
                'Authorization': `Token ${apiKey.trim()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ttl_seconds: 1800 // 30 minutes
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Deepgram auth/grant request failed:", errText);
            throw new Error(`Failed to generate Deepgram token: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        if (!data.access_token) {
            throw new Error("Deepgram response did not contain access_token");
        }

        return res.status(200).json({ 
            token: data.access_token,
            expires_in: data.expires_in || 1800
        });
    } catch (error: any) {
        console.error("Error in Deepgram token route:", error);
        return res.status(500).json({ 
            error: error.message || "Failed to generate Deepgram token" 
        });
    }
}
