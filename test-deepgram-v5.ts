import { DeepgramClient } from "@deepgram/sdk";
import dotenv from "dotenv";
dotenv.config();

async function test() {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
        console.log("DEEPGRAM_API_KEY is missing");
        return;
    }
    const deepgram = new DeepgramClient(apiKey);
    try {
        // @ts-ignore
        const { result, error } = await deepgram.manage.v1.projects.list();
        if (error) {
            console.log("Error listing projects:", error);
        } else {
            console.log("Projects result:", JSON.stringify(result, null, 2));
        }
    } catch (e) {
        console.log("Exception listing projects:", e);
    }
}
test();
