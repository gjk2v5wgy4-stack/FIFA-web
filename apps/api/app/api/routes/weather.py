from typing import Annotated

from fastapi import APIRouter, Query

from app.services.weather import weather_forecast_service

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/forecast")
def forecast(
    region: Annotated[str | None, Query(min_length=1)] = None,
    latitude: Annotated[float | None, Query(ge=-90, le=90)] = None,
    longitude: Annotated[float | None, Query(ge=-180, le=180)] = None,
    days: Annotated[int, Query(ge=1, le=7)] = 3,
) -> dict[str, object]:
    return {
        "data": weather_forecast_service.get_forecast(
            region=region,
            latitude=latitude,
            longitude=longitude,
            days=days,
        )
    }

