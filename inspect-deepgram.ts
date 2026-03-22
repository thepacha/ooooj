import { DeepgramClient } from "@deepgram/sdk";
import dotenv from "dotenv";
dotenv.config();

const deepgram = new DeepgramClient("dummy");
console.log("Deepgram keys:", Object.keys(deepgram));
if (deepgram.manage) {
  console.log("Deepgram manage keys:", Object.keys(deepgram.manage));
  // @ts-ignore
  if (deepgram.manage.v1) {
    // @ts-ignore
    console.log("Deepgram manage v1 keys:", Object.keys(deepgram.manage.v1));
  }
}
