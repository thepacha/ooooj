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

// @ts-ignore
if (deepgram.manage.v1.projects.keys) {
    // @ts-ignore
    console.log("Deepgram manage v1 projects keys properties:", getAllProperties(deepgram.manage.v1.projects.keys));
}
