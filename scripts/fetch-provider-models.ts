type ExternalProvider = "openai" | "anthropic" | "openrouter" | "vercel_gateway";

type ModelSummary = {
  id: string;
  name?: string;
  contextLength?: number;
  modality?: string;
  raw?: Record<string, unknown>;
};

type ProviderModelsResult = {
  provider: ExternalProvider;
  ok: boolean;
  fetchedAt: string;
  modelCount: number;
  models: ModelSummary[];
  error?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getArg(flag: string) {
  const index = Bun.argv.findIndex((arg) => arg === flag);
  if (index < 0) return undefined;
  return Bun.argv[index + 1];
}

function getRequestedProviders(): ExternalProvider[] {
  const raw = getArg("--providers");
  if (!raw) {
    return ["openai", "anthropic", "openrouter", "vercel_gateway"];
  }

  const values = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const providers: ExternalProvider[] = [];
  for (const value of values) {
    if (
      value === "openai" ||
      value === "anthropic" ||
      value === "openrouter" ||
      value === "vercel_gateway"
    ) {
      providers.push(value);
    }
  }
  return providers.length > 0 ? providers : ["openai", "anthropic", "openrouter", "vercel_gateway"];
}

function readModelList(payload: unknown): ModelSummary[] {
  const record = asRecord(payload);
  const data = Array.isArray(record?.data)
    ? record.data
    : Array.isArray(record?.models)
      ? record.models
      : Array.isArray(payload)
        ? payload
        : [];

  return data
    .map((entry) => asRecord(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((entry) => ({
      id:
        (typeof entry.id === "string" && entry.id) ||
        (typeof entry.model === "string" && entry.model) ||
        "unknown",
      name:
        typeof entry.name === "string"
          ? entry.name
          : typeof entry.display_name === "string"
            ? entry.display_name
            : undefined,
      contextLength:
        asNumber(entry.context_length) ??
        asNumber(entry.contextWindow) ??
        asNumber(entry.max_input_tokens),
      modality:
        typeof entry.modality === "string"
          ? entry.modality
          : typeof entry.type === "string"
            ? entry.type
            : undefined,
      raw: entry,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

async function fetchJson(url: string, headers: Record<string, string>) {
  const response = await fetch(url, { headers });
  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const record = asRecord(payload);
    const errorRecord = asRecord(record?.error);
    const message =
      typeof record?.error === "string"
        ? record.error
        : typeof errorRecord?.message === "string"
          ? errorRecord.message
          : `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

async function fetchProviderModels(provider: ExternalProvider): Promise<ProviderModelsResult> {
  const fetchedAt = new Date().toISOString();

  try {
    if (provider === "openai") {
      const apiKey = process.env.OPENAI_API_KEY?.trim();
      if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
      const payload = await fetchJson("https://api.openai.com/v1/models", {
        Authorization: `Bearer ${apiKey}`,
      });
      const models = readModelList(payload);
      return { provider, ok: true, fetchedAt, modelCount: models.length, models };
    }

    if (provider === "anthropic") {
      const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
      if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");
      const payload = await fetchJson("https://api.anthropic.com/v1/models", {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      });
      const models = readModelList(payload);
      return { provider, ok: true, fetchedAt, modelCount: models.length, models };
    }

    if (provider === "openrouter") {
      const apiKey = process.env.OPENROUTER_API_KEY?.trim();
      if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY");
      const payload = await fetchJson("https://openrouter.ai/api/v1/models", {
        Authorization: `Bearer ${apiKey}`,
      });
      const models = readModelList(payload);
      return { provider, ok: true, fetchedAt, modelCount: models.length, models };
    }

    const apiKey = process.env.VERCEL_AI_GATEWAY_API_KEY?.trim();
    if (!apiKey) throw new Error("Missing VERCEL_AI_GATEWAY_API_KEY");
    const payload = await fetchJson("https://ai-gateway.vercel.sh/v1/models", {
      Authorization: `Bearer ${apiKey}`,
    });
    const models = readModelList(payload);
    return { provider, ok: true, fetchedAt, modelCount: models.length, models };
  } catch (error) {
    return {
      provider,
      ok: false,
      fetchedAt,
      modelCount: 0,
      models: [],
      error: error instanceof Error ? error.message : "Failed to fetch models",
    };
  }
}

async function main() {
  const providers = getRequestedProviders();
  const outputPath = getArg("--out");
  const results = await Promise.all(providers.map((provider) => fetchProviderModels(provider)));
  const payload = {
    generatedAt: new Date().toISOString(),
    providers: results,
  };

  if (outputPath) {
    await Bun.write(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
    // Keep stdout concise for scripts piping to tooling.
    console.log(`Wrote model catalog to ${outputPath}`);
    return;
  }

  console.log(JSON.stringify(payload, null, 2));
}

await main();
