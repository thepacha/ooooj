import { DeepgramClient } from "@deepgram/sdk";
import dotenv from "dotenv";
dotenv.config();

const deepgram = new DeepgramClient("dummy");
// @ts-ignore
console.log("Deepgram manage v1 keys:", Object.keys(deepgram.manage.v1));
// @ts-ignore
console.log("Deepgram manage v1 projects keys:", Object.keys(deepgram.manage.v1.projects));
