import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.ASSEMBLYAI_API_KEY?.trim();
        if (!apiKey) {
            return res.status(500).json({ error: "ASSEMBLYAI_API_KEY is not configured" });
        }

        // AssemblyAI Speech-to-Speech API currently requires passing the API key directly
        // since it doesn't have a temporary token endpoint yet.
        // We return the API key to be used as the token query parameter.
        res.status(200).json({ token: apiKey });

    } catch (error: any) {
        console.error("Error in AssemblyAI token route:", error);
        res.status(500).json({ 
            error: `AssemblyAI Token Error: ${error.message || "Unknown error"}`
        });
    }
}
