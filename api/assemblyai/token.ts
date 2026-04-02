import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.ASSEMBLYAI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "ASSEMBLYAI_API_KEY is not configured" });
        }

        // Generate a temporary token for AssemblyAI Realtime/Speech-to-Speech
        const response = await fetch('https://api.assemblyai.com/v2/realtime/token', {
            method: 'POST',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ expires_in: 3600 })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("AssemblyAI Token Error:", errorText);
            throw new Error("Failed to generate AssemblyAI token");
        }

        const data = await response.json();
        
        res.status(200).json({ token: data.token });

    } catch (error: any) {
        console.error("Error in AssemblyAI token route:", error);
        res.status(500).json({ 
            error: error.message || "Internal server error"
        });
    }
}
