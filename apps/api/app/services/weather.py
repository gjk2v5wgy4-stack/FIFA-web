from dataclasses import dataclass
from datetime import UTC, date, datetime, timedelta
from typing import Any

import httpx

from app.core.config import get_settings
from app.core.errors import ApiException


@dataclass(frozen=True)
class WeatherLocation:
    region: str
    latitude: float
    longitude: float
    timezone: str


KNOWN_REGIONS: dict[str, WeatherLocation] = {
    "beijing": WeatherLocation("Beijing", 39.9042, 116.4074, "Asia/Shanghai"),
    "北京": WeatherLocation("Beijing", 39.9042, 116.4074, "Asia/Shanghai"),
    "shanghai": WeatherLocation("Shanghai", 31.2304, 121.4737, "Asia/Shanghai"),
    "上海": WeatherLocation("Shanghai", 31.2304, 121.4737, "Asia/Shanghai"),
    "guangzhou": WeatherLocation("Guangzhou", 23.1291, 113.2644, "Asia/Shanghai"),
    "广州": WeatherLocation("Guangzhou", 23.1291, 113.2644, "Asia/Shanghai"),
    "shenzhen": WeatherLocation("Shenzhen", 22.5431, 114.0579, "Asia/Shanghai"),
    "深圳": WeatherLocation("Shenzhen", 22.5431, 114.0579, "Asia/Shanghai"),
    "new york": WeatherLocation("New York", 40.7128, -74.0060, "America/New_York"),
    "los angeles": WeatherLocation("Los Angeles", 34.0522, -118.2437, "America/Los_Angeles"),
    "mexico city": WeatherLocation("Mexico City", 19.4326, -99.1332, "America/Mexico_City"),
    "toronto": WeatherLocation("Toronto", 43.6532, -79.3832, "America/Toronto"),
    "vancouver": WeatherLocation("Vancouver", 49.2827, -123.1207, "America/Vancouver"),
}


WEATHER_CODE_LABELS: dict[int, str] = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    80: "Rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    95: "Thunderstorm",
}


class WeatherForecastService:
    def get_forecast(
        self,
        region: str | None,
        latitude: float | None,
        longitude: float | None,
        days: int,
    ) -> dict[str, object]:
        location = self._resolve_location(region, latitude, longitude)
        settings = get_settings()
        if settings.weather_provider.lower() == "local":
            return self._local_forecast(location, days)

        try:
            return self._open_meteo_forecast(location, days)
        except httpx.HTTPError:
            return self._local_forecast(location, days)

    def _resolve_location(
        self,
        region: str | None,
        latitude: float | None,
        longitude: float | None,
    ) -> WeatherLocation:
        if latitude is not None or longitude is not None:
            if latitude is None or longitude is None:
                raise ApiException(
                    "VALIDATION_ERROR",
                    "Both latitude and longitude are required.",
                    422,
                )
            return WeatherLocation(region or "Custom Location", latitude, longitude, "auto")

        if not region:
            raise ApiException(
                "VALIDATION_ERROR",
                "Provide region or latitude/longitude for weather forecast.",
                422,
            )

        normalized = region.strip().lower()
        known = KNOWN_REGIONS.get(normalized)
        if known is not None:
            return known
        return self._geocode_region(region)

    def _geocode_region(self, region: str) -> WeatherLocation:
        settings = get_settings()
        if settings.weather_provider.lower() == "local":
            raise ApiException(
                "NOT_FOUND",
                "Region is not supported by local weather fallback.",
                404,
            )

        response = httpx.get(
            "https://geocoding-api.open-meteo.com/v1/search",
            params={"name": region, "count": 1, "language": "en", "format": "json"},
            timeout=settings.open_meteo_timeout_seconds,
        )
        response.raise_for_status()
        results = response.json().get("results") or []
        if not results:
            raise ApiException("NOT_FOUND", "Region was not found.", 404)
        first = results[0]
        return WeatherLocation(
            region=str(first.get("name") or region),
            latitude=float(first["latitude"]),
            longitude=float(first["longitude"]),
            timezone=str(first.get("timezone") or "auto"),
        )

    def _open_meteo_forecast(self, location: WeatherLocation, days: int) -> dict[str, object]:
        settings = get_settings()
        response = httpx.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": location.latitude,
                "longitude": location.longitude,
                "current": (
                    "temperature_2m,relative_humidity_2m,apparent_temperature,"
                    "weather_code,wind_speed_10m"
                ),
                "daily": (
                    "weather_code,temperature_2m_max,temperature_2m_min,"
                    "precipitation_probability_max"
                ),
                "forecast_days": days,
                "timezone": "auto",
            },
            timeout=settings.open_meteo_timeout_seconds,
        )
        response.raise_for_status()
        payload: dict[str, Any] = response.json()
        current = payload.get("current", {})
        daily = payload.get("daily", {})
        return {
            "region": location.region,
            "latitude": location.latitude,
            "longitude": location.longitude,
            "timezone": str(payload.get("timezone") or location.timezone),
            "current": self._current_contract(current),
            "daily": self._daily_contract(daily, days),
            "source": "open-meteo",
            "updatedAt": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        }

    def _current_contract(self, current: dict[str, Any]) -> dict[str, object]:
        code = int(current.get("weather_code") or 0)
        return {
            "observedAt": str(current.get("time") or datetime.now(UTC).isoformat()),
            "temperatureC": current.get("temperature_2m"),
            "apparentTemperatureC": current.get("apparent_temperature"),
            "humidityPct": current.get("relative_humidity_2m"),
            "windKph": current.get("wind_speed_10m"),
            "weatherCode": code,
            "condition": self._condition(code),
        }

    def _daily_contract(self, daily: dict[str, Any], days: int) -> list[dict[str, object]]:
        dates = list(daily.get("time") or [])
        codes = list(daily.get("weather_code") or [])
        max_temps = list(daily.get("temperature_2m_max") or [])
        min_temps = list(daily.get("temperature_2m_min") or [])
        precipitation = list(daily.get("precipitation_probability_max") or [])
        result: list[dict[str, object]] = []
        for index in range(min(days, len(dates))):
            code = int(codes[index] if index < len(codes) else 0)
            result.append(
                {
                    "date": dates[index],
                    "maxTemperatureC": max_temps[index] if index < len(max_temps) else None,
                    "minTemperatureC": min_temps[index] if index < len(min_temps) else None,
                    "precipitationProbabilityPct": (
                        precipitation[index] if index < len(precipitation) else None
                    ),
                    "weatherCode": code,
                    "condition": self._condition(code),
                }
            )
        return result

    def _local_forecast(self, location: WeatherLocation, days: int) -> dict[str, object]:
        today = date.today()
        daily = []
        for index in range(days):
            forecast_date = today + timedelta(days=index)
            daily.append(
                {
                    "date": forecast_date.isoformat(),
                    "maxTemperatureC": 26 + index,
                    "minTemperatureC": 17 + index,
                    "precipitationProbabilityPct": 20 + index * 5,
                    "weatherCode": 2,
                    "condition": self._condition(2),
                }
            )
        return {
            "region": location.region,
            "latitude": location.latitude,
            "longitude": location.longitude,
            "timezone": location.timezone,
            "current": {
                "observedAt": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
                "temperatureC": 24,
                "apparentTemperatureC": 25,
                "humidityPct": 62,
                "windKph": 12,
                "weatherCode": 2,
                "condition": self._condition(2),
            },
            "daily": daily,
            "source": "local-fallback",
            "updatedAt": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        }

    def _condition(self, weather_code: int) -> str:
        return WEATHER_CODE_LABELS.get(weather_code, "Unknown")


weather_forecast_service = WeatherForecastService()
