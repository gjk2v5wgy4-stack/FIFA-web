from typing import Any

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    display_name: str = Field(alias="displayName", min_length=1)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class ReasonRequest(BaseModel):
    reason: str = Field(min_length=1)


class ApproveUserRequest(ReasonRequest):
    initial_token_grant: int = Field(default=0, alias="initialTokenGrant", ge=0)


class TokenChangeRequest(ReasonRequest):
    amount_tokens: int = Field(alias="amountTokens")


class RagAskRequest(BaseModel):
    question: str = Field(min_length=1)
    context: dict[str, Any] = Field(default_factory=dict)
    retrieval: dict[str, Any] = Field(default_factory=dict)


class MatchPredictionRequest(BaseModel):
    match_id: str = Field(alias="matchId", min_length=1)
    options: dict[str, Any] = Field(default_factory=dict)


class WhatIfPredictionRequest(BaseModel):
    match_id: str = Field(alias="matchId", min_length=1)
    scenario: dict[str, Any] = Field(default_factory=dict)


class GroupSimulationRequest(BaseModel):
    group: str = Field(min_length=1)
    fixed_results: list[dict[str, Any]] = Field(default_factory=list, alias="fixedResults")
    options: dict[str, Any] = Field(default_factory=dict)


class ReportGenerateRequest(BaseModel):
    report_type: str = Field(alias="reportType", min_length=1)
    context: dict[str, Any] = Field(default_factory=dict)
    format: str = Field(default="pdf")
    language: str = Field(default="zh-CN")
    options: dict[str, Any] = Field(default_factory=dict)

