import { buildRagPrompt, estimateRagUsage } from "../prompting/index.js";
import { buildSafetyBlockedAnswer, evaluateRagQuestionSafety } from "../safety/index.js";
import { retrieveContext } from "./index.js";

export async function askWithRag({
  question,
  matchId,
  teamId,
  playerId,
  topK = 8,
  filters = {},
  model = "rag-local-estimator-v0",
  vectorStore,
  embedder
}) {
  const safety = evaluateRagQuestionSafety(question);
  if (!safety.allowed) {
    return {
      answer: buildSafetyBlockedAnswer(safety),
      sources: [],
      retrievalDiagnostics: {
        requestedTopK: Number.isInteger(topK) && topK > 0 ? topK : 8,
        returnedCount: 0,
        filtersApplied: {
          ...filters,
          ...(matchId ? { matchId } : {}),
          ...(teamId ? { teamId } : {}),
          ...(playerId ? { playerId } : {})
        },
        retrievalStatus: "blocked_by_safety",
        vectorStore: vectorStore?.name ?? vectorStore?.constructor?.name ?? "not_used",
        embeddingDimensions: 0,
        scores: [],
        safety
      },
      usage: estimateRagUsage({
        question,
        topK,
        contextLength: 0,
        model
      })
    };
  }

  const retrieval = await retrieveContext({
    query: question,
    matchId,
    teamId,
    playerId,
    topK,
    filters,
    vectorStore,
    embedder
  });
  const prompt = buildRagPrompt({ question, chunks: retrieval.chunks });
  const usage = estimateRagUsage({
    question,
    topK,
    contextLength: prompt.prompt.length,
    model
  });

  return {
    answer: buildGroundedAnswer(retrieval.chunks),
    sources: retrieval.sources,
    retrievalDiagnostics: retrieval.retrievalDiagnostics,
    usage
  };
}

function buildGroundedAnswer(chunks) {
  if (chunks.length === 0) {
    return "证据不足：当前检索没有找到可引用资料，无法基于证据回答。";
  }

  const citedSnippets = chunks
    .slice(0, 3)
    .map((chunk, index) => `${summarizeChunk(chunk.content)} [${index + 1}]`)
    .join(" ");

  return `基于已检索资料，以下是数据分析，不是博彩或保证性结论：${citedSnippets} 请结合概率预测、风险因素和不确定性评估。`;
}

function summarizeChunk(content) {
  const normalized = String(content ?? "").replace(/\s+/g, " ").trim();
  if (normalized.length <= 180) {
    return normalized;
  }
  return `${normalized.slice(0, 177)}...`;
}
