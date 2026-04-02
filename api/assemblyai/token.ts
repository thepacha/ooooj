import type { VercelRequest, VercelResponse } from '@vercel/node';
import { AssemblyAI } from 'assemblyai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'GET' && req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const apiKey = process.env.ASSEMBLYAI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: "ASSEMBLYAI_API_KEY is not configured" });
        }

        const client = new AssemblyAI({ apiKey });
        const token = await client.realtime.createTemporaryToken({ expires_in: 3600 });
        
        res.status(200).json({ token });

    } catch (error: any) {
        console.error("Error in AssemblyAI token route:", error);
        res.status(500).json({ 
            error: `AssemblyAI Token Error: ${error.message || "Unknown error"}`
        });
    }
}
