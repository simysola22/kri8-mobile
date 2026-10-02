import { z } from "zod";

const nonEmptyText = z.string().trim().min(1);

function uniqueTextList(minimum: number, maximum: number) {
  return z.array(nonEmptyText)
    .max(maximum)
    .transform((items) => [...new Set(items)])
    .refine((items) => items.length >= minimum);
}

export const inspirationContentSchema = z.object({
  relatedIdeas: uniqueTextList(3, 10),
  alternativeHooks: uniqueTextList(3, 5),
  titleSuggestions: uniqueTextList(3, 5),
  audienceQuestions: uniqueTextList(3, 5),
}).strip();

export const inspirationResultSchema = inspirationContentSchema.extend({
  canonicalQuery: nonEmptyText,
  source: z.literal("openai"),
}).strip();

export const creatorInsightSchema = z.object({
  audienceFit: nonEmptyText,
  differentiation: nonEmptyText,
  recommendedHook: nonEmptyText,
  risks: uniqueTextList(2, 4),
}).strip();

export const trendCreatorBreakdownSchema = z.object({
  openingHook: nonEmptyText,
  structure: uniqueTextList(3, 6),
  whyItMayWork: uniqueTextList(2, 4),
  adaptationAngle: nonEmptyText,
  evidenceNote: nonEmptyText,
}).strip();

export type InspirationContent = z.infer<typeof inspirationContentSchema>;

export type AIProviderErrorCategory =
  | "configuration"
  | "malformed_output"
  | "timeout"
  | "quota_exhausted"
  | "rate_limited"
  | "provider_auth"
  | "provider_failure";

export class AIProviderError extends Error {
  constructor(
    readonly category: AIProviderErrorCategory,
    readonly retryable: boolean,
    readonly httpStatus?: number,
  ) {
    super(category);
    this.name = "AIProviderError";
  }
}

export function parseAIResponse<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new AIProviderError("malformed_output", false);
  }
  return parsed.data;
}