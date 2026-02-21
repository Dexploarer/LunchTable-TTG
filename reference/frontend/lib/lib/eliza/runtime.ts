import { ElizaOS, type IAgentRuntime, type UUID } from "@elizaos/core";
import openrouterPlugin from "@elizaos/plugin-openrouter";
import { v4 as uuidv4 } from "uuid";
import { lunchtableGuide } from "./character";

/**
 * Send a message to the Lunchtable Guide and get a response.
 * Creates an ephemeral ElizaOS instance for serverless compatibility.
 *
 * @param userId - User's ID for context
 * @param sessionId - Chat session ID for conversation continuity
 * @param message - The user's message
 * @param conversationHistory - Previous messages for context (optional)
 * @returns The agent's response text
 */
export async function sendToEliza(
  userId: string,
  sessionId: string,
  message: string,
  conversationHistory?: Array<{ role: "user" | "agent"; message: string }>
): Promise<string> {
  try {
    const elizaOS = new ElizaOS();

    // Add the agent with openrouter plugin in ephemeral mode
    const [runtime] = (await elizaOS.addAgents(
      [
        {
          character: {
            ...lunchtableGuide,
            settings: {
              ...lunchtableGuide.settings,
              OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY ?? "",
            },
          },
          plugins: [openrouterPlugin],
        },
      ],
      {
        ephemeral: true, // Don't persist in registry
        autoStart: true, // Initialize immediately
        returnRuntimes: true, // Return the runtime instance
      }
    )) as IAgentRuntime[];

    if (!runtime) {
      throw new Error("Failed to initialize ElizaOS runtime");
    }

    // Create unique IDs for this message
    const messageId = uuidv4() as UUID;
    const entityId = userId as UUID;
    const roomId = sessionId as UUID;

    // Build context from conversation history if provided
    let contextText = "";
    if (conversationHistory && conversationHistory.length > 0) {
      // Include last 5 messages for context
      const recentMessages = conversationHistory.slice(-5);
      contextText = recentMessages
        .map((m) => `${m.role === "user" ? "Player" : "Guide"}: ${m.message}`)
        .join("\n");
    }

    // Process the message
    const result = await elizaOS.handleMessage(runtime, {
      id: messageId,
      entityId,
      roomId,
      content: {
        text: contextText ? `${contextText}\nPlayer: ${message}` : message,
        source: "ai-chat",
      },
      createdAt: Date.now(),
    });

    // Extract and return the response
    const responseText =
      result.processing?.responseContent?.text ||
      "I'm having trouble responding right now. Please try again!";

    return responseText;
  } catch (error) {
    console.error("ElizaOS error:", error);

    // Return a friendly error message
    if (error instanceof Error && error.message.includes("API")) {
      return "I'm having trouble connecting to my brain right now. Please try again in a moment!";
    }

    return "Something went wrong. Please try again!";
  }
}
