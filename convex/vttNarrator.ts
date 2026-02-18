export const DEFAULT_NARRATION = "The narrator takes the stage.";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

export function selectNarrationFromNpcOutput(output: unknown): string {
  if (!isRecord(output)) return DEFAULT_NARRATION;
  const npcProfile = output.npcProfile;
  if (!isRecord(npcProfile)) return DEFAULT_NARRATION;
  const scenePrompts = npcProfile.scenePrompts;
  if (!Array.isArray(scenePrompts)) return DEFAULT_NARRATION;

  for (const entry of scenePrompts) {
    if (typeof entry !== "string") continue;
    const trimmed = entry.trim();
    if (trimmed.length > 0) return trimmed;
  }

  return DEFAULT_NARRATION;
}

