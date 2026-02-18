export const DEFAULT_NARRATION = "The narrator takes the stage.";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function firstNonEmptyLine(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const lines = trimmed.split(/\r?\n/);
  for (const line of lines) {
    const candidate = line.trim();
    if (candidate) return candidate;
  }

  return null;
}

export function selectNarrationFromNarrationOutput(parsed: unknown, text: string): string {
  if (isRecord(parsed)) {
    const narration = parsed.narration;
    if (typeof narration === "string") {
      const trimmed = narration.trim();
      if (trimmed) return trimmed;
    }
  }

  const fallback = firstNonEmptyLine(text);
  return fallback ?? DEFAULT_NARRATION;
}
