type UsageProvider = "openrouter" | "vercel_gateway";

type UsageResult = {
  provider: UsageProvider;
  ok: boolean;
  fetchedAt: string;
  summary: Record<string, unknown> | null;
  error?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getArg(flag: string) {
  const index = Bun.argv.findIndex((arg) => arg === flag);
  if (index < 0) return undefined;
  return Bun.argv[index + 1];
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

async function fetchOpenRouterUsage(): Promise<UsageResult> {
  const fetchedAt = new Date().toISOString();
  try {
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) throw new Error("Missing OPENROUTER_API_KEY");

    const payload = await fetchJson("https://openrouter.ai/api/v1/key", {
      Authorization: `Bearer ${apiKey}`,
    });
    const data = asRecord(asRecord(payload)?.data) ?? asRecord(payload) ?? {};

    return {
      provider: "openrouter",
      ok: true,
      fetchedAt,
      summary: {
        label: data.label ?? null,
        limit: data.limit ?? null,
        usage: data.usage ?? null,
        limit_remaining: data.limit_remaining ?? null,
        rate_limit: data.rate_limit ?? null,
      },
    };
  } catch (error) {
    return {
      provider: "openrouter",
      ok: false,
      fetchedAt,
      summary: null,
      error: error instanceof Error ? error.message : "Failed to fetch OpenRouter usage",
    };
  }
}

async function fetchVercelGatewayUsage(): Promise<UsageResult> {
  const fetchedAt = new Date().toISOString();
  try {
    const apiKey = process.env.VERCEL_AI_GATEWAY_API_KEY?.trim();
    if (!apiKey) throw new Error("Missing VERCEL_AI_GATEWAY_API_KEY");

    const credits = await fetchJson("https://ai-gateway.vercel.sh/v1/credits", {
      Authorization: `Bearer ${apiKey}`,
    });

    const generationId = getArg("--generation-id") ?? process.env.VERCEL_AI_GATEWAY_GENERATION_ID;
    let generation: unknown = null;
    if (generationId) {
      generation = await fetchJson(
        `https://ai-gateway.vercel.sh/v1/generation?id=${encodeURIComponent(generationId)}`,
        {
          Authorization: `Bearer ${apiKey}`,
        },
      );
    }

    return {
      provider: "vercel_gateway",
      ok: true,
      fetchedAt,
      summary: {
        credits,
        generation,
      },
    };
  } catch (error) {
    return {
      provider: "vercel_gateway",
      ok: false,
      fetchedAt,
      summary: null,
      error: error instanceof Error ? error.message : "Failed to fetch Vercel AI Gateway usage",
    };
  }
}

async function main() {
  const outputPath = getArg("--out");
  const results = await Promise.all([fetchOpenRouterUsage(), fetchVercelGatewayUsage()]);
  const payload = {
    generatedAt: new Date().toISOString(),
    providers: results,
  };

  if (outputPath) {
    await Bun.write(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`Wrote usage snapshot to ${outputPath}`);
    return;
  }

  console.log(JSON.stringify(payload, null, 2));
}

await main();
