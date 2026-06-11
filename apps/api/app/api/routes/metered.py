from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Request
from football_models import MatchPredictionInput, TeamRating
from football_models import predict_match as run_match_prediction

from app.api.deps import CurrentUser, DbSession
from app.core.errors import ApiException
from app.core.ids import new_id
from app.models import Match, Prediction, Report, Team, User
from app.models.access_contracts import FeatureType, UserRecord
from app.schemas.requests import (
    GroupSimulationRequest,
    MatchPredictionRequest,
    MeteredConsumeRequest,
    ReportGenerateRequest,
    WhatIfPredictionRequest,
)
from app.services.access_control import access_control_service
from app.services.token_quota import token_quota_service

router = APIRouter(tags=["metered"])
MODEL_VERSION = "football-models-0.1.0"
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


TEAM_MODEL_PROFILES: dict[str, dict[str, float]] = {
    "USA": {"elo": 1824, "xg_for90": 1.72, "xg_against90": 1.08},
    "WAL": {"elo": 1762, "xg_for90": 1.24, "xg_against90": 1.31},
    "MEX": {"elo": 1798, "xg_for90": 1.46, "xg_against90": 1.10},
    "RSA": {"elo": 1640, "xg_for90": 1.08, "xg_against90": 1.33},
    "KOR": {"elo": 1768, "xg_for90": 1.38, "xg_against90": 1.16},
    "CZE": {"elo": 1714, "xg_for90": 1.22, "xg_against90": 1.24},
}


def _profile_for_team(team: Team | None, fallback_code: str, fallback_name: str) -> TeamRating:
    code = (team.code if team is not None else fallback_code).upper()
    profile = TEAM_MODEL_PROFILES.get(
        code,
        {
            "elo": 1700 + (sum(ord(character) for character in code) % 120),
            "xg_for90": 1.20 + (sum(ord(character) for character in code) % 35) / 100,
            "xg_against90": 1.10 + (sum(ord(character) for character in code[::-1]) % 35) / 100,
        },
    )
    return TeamRating(
        team_id=team.id if team is not None else f"team_{code.lower()}",
        name=team.name if team is not None else fallback_name,
        elo=profile["elo"],
        xg_for90=profile["xg_for90"],
        xg_against90=profile["xg_against90"],
    )


def _prediction_input_from_request(
    session: DbSession,
    payload: MatchPredictionRequest,
) -> tuple[MatchPredictionInput, Match | None]:
    match = session.get(Match, payload.match_id)
    options = payload.options
    include_score_distribution = bool(options.get("includeScoreDistribution", True))
    random_seed = int(options.get("randomSeed", sum(ord(char) for char in payload.match_id)))

    if match is None:
        home_code = str(options.get("homeTeamCode", "USA"))
        away_code = str(options.get("awayTeamCode", "WAL"))
        home_name = str(options.get("homeTeamName", home_code))
        away_name = str(options.get("awayTeamName", away_code))
        return (
            MatchPredictionInput(
                match_id=payload.match_id,
                home=_profile_for_team(None, home_code, home_name),
                away=_profile_for_team(None, away_code, away_name),
                include_score_distribution=include_score_distribution,
                random_seed=random_seed,
            ),
            None,
        )

    home_team = session.get(Team, match.home_team_id)
    away_team = session.get(Team, match.away_team_id)
    if home_team is None or away_team is None:
        raise ApiException("INTERNAL_ERROR", "Match team data is incomplete.", 500)

    return (
        MatchPredictionInput(
            match_id=payload.match_id,
            home=_profile_for_team(home_team, home_team.code, home_team.name),
            away=_profile_for_team(away_team, away_team.code, away_team.name),
            include_score_distribution=include_score_distribution,
            random_seed=random_seed,
        ),
        match,
    )


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


@router.post("/predictions/match")
def predict_match(
    payload: MatchPredictionRequest,
    user: CurrentUser,
    session: DbSession,
) -> dict[str, object]:
    db_user = _require_db_user(user)
    access_control_service.ensure_metered_access(db_user)
    model_input, match = _prediction_input_from_request(session, payload)
    model_payload = run_match_prediction(model_input).to_api_dict()
    metering = model_payload["metering"]
    prediction = Prediction(
        id=new_id("pred"),
        user_id=db_user.id,
        prediction_type="match",
        match_id=match.id if match is not None else None,
        team_ids=[model_input.home.team_id, model_input.away.team_id],
        input_snapshot=payload.model_dump(by_alias=True),
        result=model_payload,
        model_version=str(model_payload["modelVersion"]),
    )
    session.add(prediction)
    session.flush()
    charge = token_quota_service.charge_for_usage(
        session,
        db_user,
        "match_prediction",
        "prediction",
        prediction.id,
        int(metering["estimatedInternalTokens"]),
        str(model_payload["modelVersion"]),
    )
    prediction.ai_usage_log_id = charge.ai_usage_log_id
    session.commit()
    return {
        "data": {
            "predictionId": prediction.id,
            "matchId": payload.match_id,
            "modelVersion": model_payload["modelVersion"],
            "prediction": model_payload["prediction"],
            "explanations": model_payload["explanations"],
            "metering": metering,
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
