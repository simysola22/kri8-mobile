import type { TrendDashboard, IdeaAnalysisResult } from "./types.js";

const STOP_WORDS = new Set([
  "a","an","the","and","or","but","in","on","at","to","for","of","with","by",
  "is","are","was","were","be","been","have","has","had","do","does","did",
  "will","would","could","should","may","might","i","my","you","your","we",
  "our","they","their","it","its","this","that","these","those","what","when",
  "where","how","why","which","about","into","up","out","can","get","make",
  "just","like","using","use","used","want","need","more","some","all","so",
]);

export function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .split(/\s+/)
    .map(w => w.replace(/^['-]+|['-]+$/g, ""))
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
    .reduce<string[]>((acc, word) => {
      if (!acc.includes(word)) acc.push(word);
      return acc;
    }, [])
    .slice(0, 20);
}

function normalizePhrase(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}\s'-]/gu, " ").replace(/\s+/g, " ").trim();
}

function phraseOverlap(a: string, b: string): number {
  const left = normalizePhrase(a);
  const right = normalizePhrase(b);
  if (!left || !right) return 0;
  if (left === right) return 1;
  if (left.includes(right) || right.includes(left)) return 0.9;

  const leftWords = new Set(extractKeywords(left));
  const rightWords = new Set(extractKeywords(right));
  if (leftWords.size === 0 || rightWords.size === 0) return 0;
  const shared = [...leftWords].filter(word => rightWords.has(word)).length;
  return shared / Math.max(leftWords.size, rightWords.size);
}

function qualityWeight(dashboard: TrendDashboard): number {
  switch (dashboard.metricsQuality) {
    case "measured":
      return 1;
    case "estimated":
      return 0.75;
    case "fixture":
      return 0.45;
  }
}

export function analyzeIdea(
  title: string,
  notes: string,
  dashboard: TrendDashboard
): IdeaAnalysisResult {
  const canonicalQuery = normalizePhrase(title);
  const keywords = extractKeywords(`${canonicalQuery} ${notes}`);

  const topicScores = dashboard.topics.map(topic => {
    const score = Math.max(
      phraseOverlap(canonicalQuery, topic.name),
      keywords.reduce((acc, kw) => Math.max(acc, phraseOverlap(kw, topic.name)), 0),
    );
    return { topic, score };
  });

  const hashtagScores = dashboard.hashtags.map(ht => {
    const tag = ht.tag.replace("#", "").toLowerCase();
    const score = Math.max(
      phraseOverlap(canonicalQuery, tag),
      keywords.reduce((acc, kw) => Math.max(acc, phraseOverlap(kw, tag)), 0),
    );
    return { ht, score };
  });

  const relatedTopics = topicScores
    .filter(t => t.score >= 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(t => t.topic);

  const relatedHashtags = hashtagScores
    .filter(h => h.score >= 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(h => h.ht);

  const matchedTopicEvidence = topicScores
    .filter(({ topic }) => relatedTopics.some(candidate => candidate.id === topic.id))
    .reduce((sum, item) => sum + item.score, 0);
  const matchedHashtagEvidence = hashtagScores
    .filter(({ ht }) => relatedHashtags.some(candidate => candidate.tag === ht.tag))
    .reduce((sum, item) => sum + item.score, 0);
  const quality = qualityWeight(dashboard);
  const phraseCoverage = canonicalQuery
    ? Math.min(1, relatedTopics.some(topic => phraseOverlap(canonicalQuery, topic.name) >= 0.9) ? 1 : keywords.length / 6)
    : 0;
  const relevanceScore = Math.min(
    100,
    Math.round(
      quality * (
        matchedTopicEvidence * 30 +
        matchedHashtagEvidence * 20 +
        phraseCoverage * 30
      ),
    ),
  );

  const confidence =
    relatedTopics.length === 0 && relatedHashtags.length === 0
      ? "insufficient"
      : relevanceScore >= 65 && dashboard.metricsQuality !== "fixture"
        ? "high"
        : relevanceScore >= 35
          ? "medium"
          : "low";
  const scoringEvidence = [
    `Matched ${relatedTopics.length} trend topic(s) and ${relatedHashtags.length} hashtag(s) using phrase and token overlap.`,
    `Trend evidence quality: ${dashboard.metricsQuality}.`,
    `Score combines match strength, phrase coverage, and the provider's evidence quality.`,
  ];
  if (relatedTopics.length === 0 && relatedHashtags.length === 0) {
    scoringEvidence.push("No direct trend evidence matched this idea, so opportunities and angles were withheld.");
  }

  const contentOpportunities = relatedTopics.slice(0, 3).map((topic) =>
    `Source trend: "${topic.name}". Why relevant: it overlaps with "${canonicalQuery}". Adaptation: frame the idea through ${topic.category.toLowerCase()} creator content. Creator mechanism: borrow the trend's recognizable framing while keeping the subject specific to "${canonicalQuery}".`,
  );

  const suggestedAngles = relatedTopics.length > 0
    ? [
        `A creator-ready ${relatedTopics[0].category.toLowerCase()} format for "${canonicalQuery}"`,
        `What to show, test, or compare while exploring "${canonicalQuery}"`,
        `The practical mistakes creators make with "${canonicalQuery}" — and what to do instead`,
      ]
    : [];

  return {
    canonicalQuery,
    relevanceScore,
    confidence,
    scoringEvidence,
    relatedTopics,
    relatedHashtags,
    contentOpportunities,
    suggestedAngles,
  };
}
