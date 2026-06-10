from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class RagQueryRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    question: str = Field(min_length=1)
    match_id: str | None = Field(default=None, alias="matchId")
    team_id: str | None = Field(default=None, alias="teamId")
    player_id: str | None = Field(default=None, alias="playerId")
    top_k: int = Field(default=8, alias="topK", ge=1, le=20)
    filters: dict[str, Any] = Field(default_factory=dict)
    model: str = Field(default="worldcup-rag-qdrant")

    # Backward-compatible fields from the original API contract.
    context: dict[str, Any] = Field(default_factory=dict)
    retrieval: dict[str, Any] = Field(default_factory=dict)
    request_id: str | None = Field(default=None, alias="requestId")
    mock_usage: "RagUsageEstimateRequest | None" = Field(default=None, alias="mockUsage")


class RagUsageEstimateRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    model: str = "unknown-rag-model"
    model_version: str | None = Field(default=None, alias="modelVersion")
    prompt_tokens: int = Field(default=0, alias="promptTokens", ge=0)
    completion_tokens: int = Field(default=0, alias="completionTokens", ge=0)
    embedding_tokens: int = Field(default=0, alias="embeddingTokens", ge=0)
    total_provider_tokens: int = Field(default=0, alias="totalProviderTokens", ge=0)
    estimated_cost: float = Field(default=0.0, alias="estimatedCost", ge=0)

