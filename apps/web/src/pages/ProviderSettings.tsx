import { useState } from "react";
import { apiAny, useConvexMutation, useConvexQuery } from "@/lib/convexHelpers";
import { TrayNav } from "@/components/layout/TrayNav";

const PROVIDERS = ["openai", "anthropic", "eliza"];
type ProviderKey = {
  _id: string;
  provider: string;
  keyPreview: string;
};

function isProviderKey(value: unknown): value is ProviderKey {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate._id === "string" &&
    typeof candidate.provider === "string" &&
    typeof candidate.keyPreview === "string"
  );
}

export function ProviderSettings() {
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("");

  const providerKeys = useConvexQuery(apiAny.vttByok.listProviderKeys, {});
  const upsertProviderKey = useConvexMutation(apiAny.vttByok.upsertProviderKey);
  const disableProviderKey = useConvexMutation(apiAny.vttByok.disableProviderKey);
  const providerKeyList = Array.isArray(providerKeys) ? providerKeys.filter(isProviderKey) : [];

  return (
    <div className="min-h-screen bg-[#fdfdfb] pb-24">
      <main className="max-w-4xl mx-auto p-4 md:p-6 space-y-4">
        <header className="paper-panel p-4">
          <h1 className="text-4xl uppercase">Provider Keys (BYOK)</h1>
          <p className="text-sm text-[#121212]/70 mt-1">Keys are encrypted server-side and surfaced only as previews.</p>
        </header>

        <section className="paper-panel p-4 space-y-3">
          <label className="block text-xs uppercase font-bold">Provider</label>
          <select
            className="border-2 border-[#121212] px-3 py-2 bg-white"
            value={provider}
            onChange={(event) => setProvider(event.target.value)}
          >
            {PROVIDERS.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>

          <label className="block text-xs uppercase font-bold">API Key</label>
          <input
            className="w-full border-2 border-[#121212] px-3 py-2 bg-white"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            placeholder="paste provider key"
          />

          <button
            className="tcg-button"
            onClick={async () => {
              const trimmed = apiKey.trim();
              if (!trimmed) return;
              await upsertProviderKey({ provider, apiKey: trimmed });
              setStatus(`Saved ${provider} key`);
              setApiKey("");
            }}
          >
            Save Key
          </button>
          {status ? <p className="text-xs uppercase">{status}</p> : null}
        </section>

        <section className="paper-panel p-4">
          <h2 className="text-2xl uppercase mb-3">Stored Keys</h2>
          <div className="space-y-2">
            {providerKeyList.map((key) => (
              <div key={key._id} className="paper-panel-flat p-3 flex items-center justify-between">
                <div>
                  <p className="font-black uppercase">{key.provider}</p>
                  <p className="text-xs text-[#121212]/70">{key.keyPreview}</p>
                </div>
                <button
                  className="tcg-button"
                  onClick={async () => {
                    await disableProviderKey({ providerKeyId: key._id });
                    setStatus(`Disabled ${key.provider} key`);
                  }}
                >
                  Disable
                </button>
              </div>
            ))}
            {providerKeyList.length === 0 ? <p className="text-sm text-[#121212]/60">No provider keys saved.</p> : null}
          </div>
        </section>
      </main>

      <TrayNav invert={false} />
    </div>
  );
}
