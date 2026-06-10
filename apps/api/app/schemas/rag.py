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

