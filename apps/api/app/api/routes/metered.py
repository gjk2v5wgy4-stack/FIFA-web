from datetime import UTC, datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.core.ids import new_id
from app.models import Prediction, RagQuery, Report
from app.schemas.requests import (
    GroupSimulationRequest,
    MatchPredictionRequest,
    RagAskRequest,
    ReportGenerateRequest,
    WhatIfPredictionRequest,
)
from app.services.access_control import access_control_service
from app.services.token_quota import token_quota_service

router = APIRouter(tags=["metered"])
MODEL_VERSION = "football-models-0.1.0"


@router.post("/rag/ask")
def ask_rag(payload: RagAskRequest, user: CurrentUser, session: DbSession) -> dict[str, object]:
    access_control_service.ensure_metered_access(user)
    rag_query = RagQuery(
        id=new_id("ragq"),
        user_id=user.id,
        question=payload.question,
        answer=(
            "Stub analysis based on available football data. "
            "It highlights probability, uncertainty, risk factors, and model evidence."
        ),
        context=payload.context,
        retrieval_config=payload.retrieval,
        citation_chunk_ids=[],
        confidence=Decimal("0.74"),
    )
    session.add(rag_query)
    session.flush()
    charge = token_quota_service.charge_for_usage(
        session,
        user,
        "rag_query",
        "rag_query",
        rag_query.id,
        1_200,
    )
    rag_query.ai_usage_log_id = charge.ai_usage_log_id
    session.commit()
    return {
        "data": {
            "ragQueryId": rag_query.id,
            "answer": rag_query.answer,
            "confidence": 0.74,
            "citations": [],
            "usage": {
                **charge.to_contract(),
                "providerUsage": {
                    "prompt_tokens": 1200,
                    "completion_tokens": 0,
                    "embedding_tokens": 0,
                    "total_provider_tokens": 1200,
                    "estimated_cost": 0,
                },
            },
        }
    }


@router.post("/predictions/match")
def predict_match(
    payload: MatchPredictionRequest,
    user: CurrentUser,
    session: DbSession,
) -> dict[str, object]:
    access_control_service.ensure_metered_access(user)
    prediction = Prediction(
        id=new_id("pred"),
        user_id=user.id,
        prediction_type="match",
        match_id=payload.match_id,
        team_ids=[],
        input_snapshot=payload.model_dump(by_alias=True),
        result={"homeWin": 0.43, "draw": 0.28, "awayWin": 0.29},
        model_version=MODEL_VERSION,
    )
    session.add(prediction)
    session.flush()
    charge = token_quota_service.charge_for_usage(
        session,
        user,
        "match_prediction",
        "prediction",
        prediction.id,
        800,
        MODEL_VERSION,
    )
    prediction.ai_usage_log_id = charge.ai_usage_log_id
    session.commit()
    return {
        "data": {
            "predictionId": prediction.id,
            "matchId": payload.match_id,
            "modelVersion": MODEL_VERSION,
            "probabilities": {"homeWin": 0.43, "draw": 0.28, "awayWin": 0.29},
            "expectedGoals": {"home": 1.42, "away": 1.16},
            "scoreDistribution": [{"homeGoals": 1, "awayGoals": 1, "probability": 0.12}],
            "usage": charge.to_contract(),
        }
    }


@router.post("/predictions/what-if")
def predict_what_if(
    payload: WhatIfPredictionRequest,
    user: CurrentUser,
    session: DbSession,
) -> dict[str, object]:
    access_control_service.ensure_metered_access(user)
    prediction = Prediction(
        id=new_id("scenario"),
        user_id=user.id,
        prediction_type="what_if",
        match_id=payload.match_id,
        team_ids=[],
        input_snapshot=payload.model_dump(by_alias=True),
        result={"homeWin": 0.36, "draw": 0.30, "awayWin": 0.34},
        model_version=MODEL_VERSION,
    )
    session.add(prediction)
    session.flush()
    charge = token_quota_service.charge_for_usage(
        session,
        user,
        "what_if_prediction",
        "prediction",
        prediction.id,
        1_000,
        MODEL_VERSION,
    )
    prediction.ai_usage_log_id = charge.ai_usage_log_id
    session.commit()
    return {
        "data": {
            "scenarioId": prediction.id,
            "baseline": {"homeWin": 0.43, "draw": 0.28, "awayWin": 0.29},
            "scenario": {"homeWin": 0.36, "draw": 0.30, "awayWin": 0.34},
            "delta": {"homeWin": -0.07, "draw": 0.02, "awayWin": 0.05},
            "usage": charge.to_contract(),
        }
    }


@router.post("/simulations/group")
def simulate_group(
    payload: GroupSimulationRequest,
    user: CurrentUser,
    session: DbSession,
) -> dict[str, object]:
    access_control_service.ensure_metered_access(user)
    prediction = Prediction(
        id=new_id("sim_group"),
        user_id=user.id,
        prediction_type="group_simulation",
        match_id=None,
        team_ids=[],
        input_snapshot=payload.model_dump(by_alias=True),
        result={"group": payload.group},
        model_version=MODEL_VERSION,
    )
    session.add(prediction)
    session.flush()
    charge = token_quota_service.charge_for_usage(
        session,
        user,
        "group_simulation",
        "prediction",
        prediction.id,
        1_500,
        MODEL_VERSION,
    )
    prediction.ai_usage_log_id = charge.ai_usage_log_id
    session.commit()
    return {
        "data": {
            "simulationId": prediction.id,
            "group": payload.group,
            "modelVersion": MODEL_VERSION,
            "iterations": int(payload.options.get("iterations", 1000)),
            "table": [
                {
                    "teamId": "team_usa",
                    "projectedPoints": 6.4,
                    "qualifyProbability": 0.78,
                    "groupWinnerProbability": 0.42,
                }
            ],
            "usage": charge.to_contract(),
        }
    }


@router.post("/reports/generate", status_code=202)
def generate_report(
    payload: ReportGenerateRequest,
    user: CurrentUser,
    session: DbSession,
) -> dict[str, object]:
    access_control_service.ensure_metered_access(user)
    report = Report(
        id=new_id("report"),
        user_id=user.id,
        report_type=payload.report_type,
        status="queued",
        context=payload.context,
        format=payload.format,
        language=payload.language,
        citation_chunk_ids=[],
        prediction_ids=[],
        model_versions=[MODEL_VERSION],
    )
    session.add(report)
    session.flush()
    charge = token_quota_service.charge_for_usage(
        session,
        user,
        "report_generation",
        "report",
        report.id,
        3_000,
        MODEL_VERSION,
    )
    report.ai_usage_log_id = charge.ai_usage_log_id
    session.commit()
    estimated = datetime.now(UTC) + timedelta(minutes=5)
    return {
        "data": {
            "reportId": report.id,
            "status": report.status,
            "estimatedReadyAt": estimated.isoformat().replace("+00:00", "Z"),
            "usage": charge.to_contract(),
        }
    }

