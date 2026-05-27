const DEFAULT_OLLAMA_BASE_URL = "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = "gemma2:2b";

export type OllamaGenerateOptions = {
  prompt: string;
  temperature?: number;
  numPredict?: number;
  timeoutMs?: number;
};

type OllamaGenerateResponse = {
  response?: string;
  error?: string;
};

const responseCache = new Map<string, string>();
const MAX_CACHE_ITEMS = 40;

export function getOllamaModel() {
  return process.env.OLLAMA_MODEL || DEFAULT_OLLAMA_MODEL;
}

function remember(prompt: string, response: string) {
  responseCache.set(prompt, response);
  if (responseCache.size > MAX_CACHE_ITEMS) {
    const oldest = responseCache.keys().next().value;
    if (oldest) responseCache.delete(oldest);
  }
}

export async function generateWithOllama({ prompt, temperature = 0.15, numPredict = 180, timeoutMs = 45000 }: OllamaGenerateOptions) {
  const cached = responseCache.get(prompt);
  if (cached) return cached;

  const baseUrl = (process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_BASE_URL).replace(/\/$/, "");
  const model = getOllamaModel();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        keep_alive: "10m",
        options: {
          temperature,
          num_predict: numPredict,
          num_ctx: 2048,
          top_p: 0.8,
        },
      }),
    });

    const data = (await response.json().catch(() => ({}))) as OllamaGenerateResponse;
    if (!response.ok || data.error) {
      throw new Error(data.error || `Ollama respondio con estado ${response.status}.`);
    }

    const text = (data.response || "").trim();
    remember(prompt, text);
    return text;
  } finally {
    clearTimeout(timeout);
  }
}
