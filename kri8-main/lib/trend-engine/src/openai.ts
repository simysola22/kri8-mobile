import { z } from "zod";
import { AIProviderError } from "./ai-contracts.js";

const completionEnvelopeSchema = z.object({
  choices: z.array(z.object({
    message: z.object({ content: z.string().min(1) }).passthrough(),
  }).passthrough()).min(1),
}).passthrough();

function providerErrorCode(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const error = (value as Record<string, unknown>).error;
  if (!error || typeof error !== "object" || Array.isArray(error)) return "";
  const record = error as Record<string, unknown>;
  return [record.type, record.code]
    .filter((part): part is string => typeof part === "string")
    .join(" ")
    .toLowerCase();
}

function errorForStatus(status: number, code: string): AIProviderError {
  if (status === 401 || status === 403) {
    return new AIProviderError("provider_auth", false, status);
  }
  if (status === 429) {
    const quotaExhausted =
      /insufficient_quota|credit_balance_exhausted|billing_hard_limit/.test(code);
    return new AIProviderError(
      quotaExhausted ? "quota_exhausted" : "rate_limited",
      !quotaExhausted,
      status,
    );
  }
  if (status === 408 || status === 504) {
    return new AIProviderError("timeout", true, status);
  }
  return new AIProviderError("provider_failure", status >= 500, status);
}

export async function requestOpenAIJson(
  prompt: string,
  temperature: number,
): Promise<unknown> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new AIProviderError("configuration", false);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature,
      }),
    });

    if (!response.ok) {
      let errorValue: unknown = null;
      try {
        errorValue = await response.json();
      } catch {
        // Classification uses only safe, allowlisted status/code fields.
      }
      throw errorForStatus(response.status, providerErrorCode(errorValue));
    }

    let envelopeValue: unknown;
    try {
      envelopeValue = await response.json();
    } catch {
      throw new AIProviderError("malformed_output", false, response.status);
    }
    const envelope = completionEnvelopeSchema.safeParse(envelopeValue);
    if (!envelope.success) {
      throw new AIProviderError("malformed_output", false, response.status);
    }

    const content = envelope.data.choices[0].message.content;
    try {
      return JSON.parse(content) as unknown;
    } catch {
      throw new AIProviderError("malformed_output", false, response.status);
    }
  } catch (error) {
    if (error instanceof AIProviderError) throw error;
    if (
      controller.signal.aborted ||
      (error instanceof Error && error.name === "AbortError")
    ) {
      throw new AIProviderError("timeout", true);
    }
    throw new AIProviderError("provider_failure", true);
  } finally {
    clearTimeout(timeout);
  }
}