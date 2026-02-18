export interface TTGPluginConfig {
  apiUrl: string;
  apiKey: string;
}

export interface TTGAgentMe {
  id: string;
  name: string;
  userId: string;
  isActive: boolean;
}

export interface TTGSessionResult {
  sessionId: string;
  status: string;
}
