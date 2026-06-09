import { estimateTokenCount } from "../chunking/index.js";
import { buildSafetySystemText } from "../safety/index.js";

const DEFAULT_MODEL = "rag-local-estimator-v0";

export function buildRagPrompt({ question, chunks = [] }) {
  const system = buildSafetySystemText();
  const context =
    chunks.length > 0
      ? chunks
          .map((chunk, index) => {
            const citationIndex = index + 1;
            return [
              `<retrieved_document index="${citationIndex}" chunkId="${chunk.chunkId}" documentId="${chunk.documentId}">`,
              `title: ${chunk.metadata?.title ?? "Untitled document"}`,
              `sourceType: ${chunk.metadata?.sourceType ?? chunk.metadata?.source_type ?? "analysis"}`,
              `publishedAt: ${chunk.metadata?.publishedAt ?? chunk.metadata?.published_at ?? "unknown"}`,
              `content: ${chunk.content}`,
              "</retrieved_document>"
            ].join("\n");
          })
          .join("\n\n")
      : "<retrieved_documents>No retrieved documents.</retrieved_documents>";
  const user = `Question: ${question}`;
  const prompt = [system, context, user].join("\n\n");

  return {
    system,
    context,
    user,
    prompt,
    messages: [
      { role: "system", content: system },
      { role: "user", content: `${context}\n\n${user}` }
    ]
  };
}

export function estimateRagUsage({ question, topK = 8, contextLength = 0, model = DEFAULT_MODEL }) {
  const questionTokens = estimateTokenCount(question);
  const contextTokens = Math.ceil(Math.max(contextLength, 0) / 4);
  const promptTokens = Math.max(1, questionTokens + contextTokens + topK * 12 + 120);
  const completionTokens = Math.min(900, Math.max(120, Math.ceil(promptTokens * 0.22)));
  const embeddingTokens = Math.max(1, questionTokens);
  const totalProviderTokens = promptTokens + completionTokens + embeddingTokens;
  const estimatedCost = roundCurrency(
    (promptTokens / 1_000_000) * 2.5 +
      (completionTokens / 1_000_000) * 10 +
      (embeddingTokens / 1_000_000) * 0.13
  );

  return {
    promptTokens,
    completionTokens,
    embeddingTokens,
    totalProviderTokens,
    estimatedCost,
    model,
    usageSource: "estimated"
  };
}

function roundCurrency(value) {
  return Number(value.toFixed(6));
}
