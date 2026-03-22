import { DeepgramClient } from "@deepgram/sdk";

const deepgram = new DeepgramClient("dummy");

function getAllProperties(obj: any) {
    let properties = new Set<string>();
    let currentObj = obj;
    while (currentObj) {
        Object.getOwnPropertyNames(currentObj).forEach(item => properties.add(item));
        currentObj = Object.getPrototypeOf(currentObj);
    }
    return Array.from(properties);
}

console.log("Deepgram manage properties:", getAllProperties(deepgram.manage));
// @ts-ignore
if (deepgram.manage.v1) {
    // @ts-ignore
    console.log("Deepgram manage v1 properties:", getAllProperties(deepgram.manage.v1));
    // @ts-ignore
    if (deepgram.manage.v1.projects) {
        // @ts-ignore
        console.log("Deepgram manage v1 projects properties:", getAllProperties(deepgram.manage.v1.projects));
    }
}
