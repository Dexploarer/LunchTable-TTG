export function getByokSecret(): string {
  const secret = process.env.BYOK_ENCRYPTION_SECRET?.trim();
  if (!secret) {
    throw new Error("BYOK_ENCRYPTION_SECRET is required");
  }
  return secret;
}

let cachedKey: CryptoKey | null = null;

export async function getByokCryptoKey() {
  if (cachedKey) return cachedKey;
  const secret = getByokSecret();
  const secretBytes = new TextEncoder().encode(secret);
  const hash = await crypto.subtle.digest("SHA-256", secretBytes);
  cachedKey = await crypto.subtle.importKey(
    "raw",
    hash,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
  return cachedKey;
}

export function toBase64(bytes: Uint8Array) {
  return Buffer.from(bytes).toString("base64");
}

export function fromBase64(value: string) {
  return new Uint8Array(Buffer.from(value, "base64"));
}
