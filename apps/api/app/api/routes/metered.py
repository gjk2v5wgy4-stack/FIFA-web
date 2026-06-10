from datetime import UTC, datetime, timedelta
from decimal import Decimal

from fastapi import APIRouter, Request

from app.api.deps import CurrentUser, DbSession
from app.core.errors import ApiException
from app.core.ids import new_id
from app.models import Prediction, RagQuery, Report, User
from app.models.access_contracts import FeatureType, UserRecord
from app.schemas.requests import (
    GroupSimulationRequest,
    MatchPredictionRequest,
    MeteredConsumeRequest,
    RagAskRequest,
    ReportGenerateRequest,
    WhatIfPredictionRequest,
)
from app.services.access_control import access_control_service
from app.services.token_quota import token_quota_service

router = APIRouter(tags=["metered"])
MODEL_VERSION = "football-models-0.1.0"
MATCH_PREDICTION_OUTPUT = {
    "homeWinProbability": 0.43,
    "drawProbability": 0.28,
    "awayWinProbability": 0.29,
    "expectedGoals": {"home": 1.42, "away": 1.16},
    "scorelineProbabilities": [{"score": "1-1", "probability": 0.12}],
    "confidence": "medium",
    "riskFactors": [
        "Draw probability is material and raises scenario uncertainty.",
    ],
    "keyDrivers": [
        "xG profile projects the home side at 1.42 and the away side at 1.16 expected goals.",
        "Elo and Poisson score probabilities are blended for a probability estimate.",
    ],
}
MATCH_PREDICTION_METERING = {
    "featureType": "match_full_prediction",
    "complexity": "standard",
    "estimatedInternalTokens": 800,
}
WHAT_IF_METERING = {
    "featureType": "what_if_simulation",
    "complexity": "standard",
    "estimatedInternalTokens": 1000,
}
GROUP_SIMULATION_METERING = {
    "featureType": "group_simulation",
    "complexity": "standard",
    "estimatedInternalTokens": 1500,
}


def _require_db_user(user: CurrentUser) -> User:
    if isinstance(user, UserRecord):
        raise ApiException("UNAUTHORIZED", "Bearer authentication is required for this API.", 401)
    return user


@router.post("/features/{feature_type}/consume")
def consume_feature_tokens(
    feature_type: str,
    payload: MeteredConsumeRequest,
    request: Request,
    user: CurrentUser,
    session: DbSession,
) -> dict[str, object]:
    try:
        parsed_feature_type = FeatureType(feature_type)
    except ValueError as exc:
        raise ApiException(
            "VALIDATION_ERROR",
            "Unsupported feature type.",
            422,
            {"featureType": feature_type},
        ) from exc

    if isinstance(user, UserRecord):
        services = request.app.state.compat_services
        amount = payload.amount_tokens or services.tokens.estimateFeatureCost(
            parsed_feature_type,
            payload.payload,
        )
        result = services.tokens.consumeTokens(
            userId=user.id,
            amount=amount,
            requestId=payload.request_id,
            featureType=parsed_feature_type,
        )
        return {
            "data": {
                "tokensCharged": result.tokens_charged,
                "remainingTokens": result.remaining_tokens,
                "lowBalance": result.lowTokenWarning,
                "lowTokenWarning": result.lowTokenWarning,
                "tokenLedgerId": result.token_ledger_id,
                "apiUsageLogId": result.api_usage_log_id,
                "duplicate": result.duplicate,
            }
        }

    access_control_service.ensure_metered_access(user)
    amount = payload.amount_tokens or token_quota_service.estimateFeatureCost(
        parsed_feature_type,
        payload.payload,
    )
    charge = token_quota_service.charge_for_usage(
        session,
        user,
        parsed_feature_type.value,
        parsed_feature_type.value,
        payload.request_id,
        amount,
        MODEL_VERSION,
    )
    session.commit()
    return {
        "data": {
            "tokensCharged": charge.tokens_charged,
            "remainingTokens": charge.remaining_tokens,
            "lowBalance": charge.low_balance,
            "lowTokenWarning": charge.low_token_warning,
            "tokenLedgerId": charge.token_ledger_id,
            "apiUsageLogId": charge.ai_usage_log_id,
            "duplicate": charge.duplicate,
        }
    }


@router.post("/rag/ask")
def ask_rag(payload: RagAskRequest, user: CurrentUser, session: DbSession) -> dict[str, object]:
    db_user = _require_db_user(user)
    access_control_service.ensure_metered_access(db_user)
    rag_query = RagQuery(
        id=new_id("ragq"),
        user_id=db_user.id,
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
        db_user,
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
    db_user = _require_db_user(user)
    access_control_service.ensure_metered_access(db_user)
    prediction = Prediction(
        id=new_id("pred"),
        user_id=db_user.id,
        prediction_type="match",
        match_id=payload.match_id,
        team_ids=[],
        input_snapshot=payload.model_dump(by_alias=True),
        result={"prediction": MATCH_PREDICTION_OUTPUT, "metering": MATCH_PREDICTION_METERING},
        model_version=MODEL_VERSION,
    )
    session.add(prediction)
    session.flush()
    charge = token_quota_service.charge_for_usage(
        session,
        db_user,
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
            "prediction": MATCH_PREDICTION_OUTPUT,
            "metering": MATCH_PREDICTION_METERING,
            "usage": charge.to_contract(),
        }
    }


@router.post("/predictions/what-if")
def predict_what_if(
    payload: WhatIfPredictionRequest,
    user: CurrentUser,
    session: DbSession,
) -> dict[str, object]:
    db_user = _require_db_user(user)
    access_control_service.ensure_metered_access(db_user)
    prediction = Prediction(
        id=new_id("scenario"),
        user_id=db_user.id,
        prediction_type="what_if",
        match_id=payload.match_id,
        team_ids=[],
        input_snapshot=payload.model_dump(by_alias=True),
        result={
            "baseline": {"homeWin": 0.43, "draw": 0.28, "awayWin": 0.29},
            "adjusted": {"homeWin": 0.36, "draw": 0.30, "awayWin": 0.34},
            "delta": {"homeWin": -0.07, "draw": 0.02, "awayWin": 0.05},
            "metering": WHAT_IF_METERING,
        },
        model_version=MODEL_VERSION,
    )
    session.add(prediction)
    session.flush()
    charge = token_quota_service.charge_for_usage(
        session,
        db_user,
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
            "adjusted": {"homeWin": 0.36, "draw": 0.30, "awayWin": 0.34},
            "delta": {"homeWin": -0.07, "draw": 0.02, "awayWin": 0.05},
            "metering": WHAT_IF_METERING,
            "usage": charge.to_contract(),
        }
    }


@router.post("/simulations/group")
def simulate_group(
    payload: GroupSimulationRequest,
    user: CurrentUser,
    session: DbSession,
) -> dict[str, object]:
    db_user = _require_db_user(user)
    access_control_service.ensure_metered_access(db_user)
    prediction = Prediction(
        id=new_id("sim_group"),
        user_id=db_user.id,
        prediction_type="group_simulation",
        match_id=None,
        team_ids=[],
        input_snapshot=payload.model_dump(by_alias=True),
        result={"group": payload.group, "metering": GROUP_SIMULATION_METERING},
        model_version=MODEL_VERSION,
    )
    session.add(prediction)
    session.flush()
    charge = token_quota_service.charge_for_usage(
        session,
        db_user,
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
            "metering": GROUP_SIMULATION_METERING,
            "usage": charge.to_contract(),
        }
    }


@router.post("/reports/generate", status_code=202)
def generate_report(
    payload: ReportGenerateRequest,
    user: CurrentUser,
    session: DbSession,
) -> dict[str, object]:
    db_user = _require_db_user(user)
    access_control_service.ensure_metered_access(db_user)
    report = Report(
        id=new_id("report"),
        user_id=db_user.id,
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
        db_user,
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

