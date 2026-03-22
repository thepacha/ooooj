import type { VercelRequest, VercelResponse } from '@vercel/node';
import { DeepgramClient } from "@deepgram/sdk";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
  const projectId = process.env.DEEPGRAM_PROJECT_ID;

  if (!deepgramApiKey) {
    return response.status(500).json({ error: "DEEPGRAM_API_KEY is not set" });
  }

  try {
    const deepgram = new DeepgramClient(deepgramApiKey);

    // If project ID is provided, use it. Otherwise, try to get the first project.
    let targetProjectId = projectId;
    
    if (!targetProjectId) {
      const { result: projectsResult, error: projectsError } = await deepgram.manage.getProjects();
      if (projectsError) throw projectsError;
      targetProjectId = projectsResult.projects[0].project_id;
    }

    if (!targetProjectId) {
      throw new Error("Could not determine Deepgram Project ID");
    }

    const { result: keyResult, error: keyError } = await deepgram.manage.createProjectKey(targetProjectId, {
      comment: "Temporary key for RevuQAI roleplay",
      scopes: ["usage:write"],
      time_to_live_in_seconds: 3600, // 1 hour
    });

    if (keyError) throw keyError;

    return response.status(200).json({ token: keyResult.key });
  } catch (error: any) {
    console.error("Deepgram token error:", error);
    // Fallback to master key if temporary key generation fails
    return response.status(200).json({ token: deepgramApiKey });
  }
}
