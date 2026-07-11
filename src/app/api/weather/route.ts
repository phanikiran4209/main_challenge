import { NextResponse } from "next/server";

// Helper to map WMO code to description and severity
function getWMOWeatherDetails(code: number) {
  switch (code) {
    case 0:
      return { desc: "Clear sky", category: "clear" };
    case 1:
      return { desc: "Mainly clear", category: "clear" };
    case 2:
      return { desc: "Partly cloudy", category: "cloudy" };
    case 3:
      return { desc: "Overcast", category: "cloudy" };
    case 45:
      return { desc: "Fog", category: "fog" };
    case 48:
      return { desc: "Depositing rime fog", category: "fog" };
    case 51:
      return { desc: "Light drizzle", category: "drizzle" };
    case 53:
      return { desc: "Moderate drizzle", category: "drizzle" };
    case 55:
      return { desc: "Dense drizzle", category: "drizzle" };
    case 56:
      return { desc: "Light freezing drizzle", category: "drizzle" };
    case 57:
      return { desc: "Dense freezing drizzle", category: "drizzle" };
    case 61:
      return { desc: "Slight rain", category: "rain_light" };
    case 63:
      return { desc: "Moderate rain", category: "rain_moderate" };
    case 65:
      return { desc: "Heavy rain", category: "rain_heavy" };
    case 66:
      return { desc: "Light freezing rain", category: "rain_moderate" };
    case 67:
      return { desc: "Heavy freezing rain", category: "rain_heavy" };
    case 71:
      return { desc: "Slight snowfall", category: "snow" };
    case 73:
      return { desc: "Moderate snowfall", category: "snow" };
    case 75:
      return { desc: "Heavy snowfall", category: "snow" };
    case 77:
      return { desc: "Snow grains", category: "snow" };
    case 80:
      return { desc: "Slight rain showers", category: "rain_light" };
    case 81:
      return { desc: "Moderate rain showers", category: "rain_moderate" };
    case 82:
      return { desc: "Violent rain showers", category: "rain_heavy" };
    case 85:
      return { desc: "Slight snow showers", category: "snow" };
    case 86:
      return { desc: "Heavy snow showers", category: "snow" };
    case 95:
      return { desc: "Thunderstorm", category: "thunderstorm" };
    case 96:
      return { desc: "Thunderstorm with slight hail", category: "thunderstorm_hail" };
    case 99:
      return { desc: "Thunderstorm with heavy hail", category: "thunderstorm_hail" };
    default:
      return { desc: "Unknown weather", category: "unknown" };
  }
}

// Deterministic risk engine to compute Risk Level (GREEN, YELLOW, ORANGE, RED)
function calculateRisk(weatherCode: number, rainMm: number, windKph: number) {
  // RED Risk conditions: Thunderstorm with hail, violent rain showers, extreme wind, or massive rain accumulation
  if (weatherCode === 99 || weatherCode === 82 || rainMm >= 45 || windKph >= 65) {
    return {
      level: "RED",
      reason: `Severe weather warning: ${getWMOWeatherDetails(weatherCode).desc} with extreme precipitation (${rainMm.toFixed(1)} mm) or dangerous winds (${windKph.toFixed(1)} km/h). Immediate precautions required.`,
    };
  }

  // ORANGE Risk conditions: Moderate/heavy thunderstorm, heavy rain, high winds, or high rain accumulation
  if (
    weatherCode === 95 ||
    weatherCode === 96 ||
    weatherCode === 65 ||
    weatherCode === 67 ||
    weatherCode === 81 ||
    rainMm >= 15 ||
    windKph >= 35
  ) {
    return {
      level: "ORANGE",
      reason: `Heavy weather alert: ${getWMOWeatherDetails(weatherCode).desc} detected. Rainfall of ${rainMm.toFixed(1)} mm or winds of ${windKph.toFixed(1)} km/h. Avoid travel and secure home.`,
    };
  }

  // YELLOW Risk conditions: Light/moderate rain, drizzle, fog, or moderate winds
  if (
    [51, 53, 55, 56, 57, 61, 63, 66, 80].includes(weatherCode) ||
    rainMm > 1 ||
    windKph >= 15
  ) {
    return {
      level: "YELLOW",
      reason: `Moderate advisory: Light or moderate rain (${rainMm.toFixed(1)} mm) and breeze. Outdoor activities should be planned with caution.`,
    };
  }

  // GREEN Risk conditions: Clear or cloudy, light wind, no rain
  return {
    level: "GREEN",
    reason: "Normal weather conditions. No alerts or warnings active.",
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    let latStr = searchParams.get("lat");
    let lonStr = searchParams.get("lon");

    let lat = 0;
    let lon = 0;
    let locationName = "Your Location";

    // 1. Geocode if city name is provided
    if (city) {
      const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
      const geoRes = await fetch(geocodeUrl);
      if (!geoRes.ok) {
        return NextResponse.json({ error: "Geocoding service unavailable" }, { status: 500 });
      }
      const geoData = await geoRes.json();
      if (!geoData.results || geoData.results.length === 0) {
        return NextResponse.json({ error: `City "${city}" not found.` }, { status: 404 });
      }
      const result = geoData.results[0];
      lat = result.latitude;
      lon = result.longitude;
      locationName = `${result.name}, ${result.admin1 || ""} (${result.country})`;
    } else if (latStr && lonStr) {
      lat = parseFloat(latStr);
      lon = parseFloat(lonStr);
      // Optional reverse geocode or fallback name
      locationName = `Coordinates: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } else {
      // Default to Mumbai coordinates if nothing is supplied
      lat = 19.0760;
      lon = 72.8777;
      locationName = "Mumbai, Maharashtra (India)";
    }

    // 2. Fetch current and daily forecast weather
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,showers,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_hours,precipitation_probability_max&timezone=auto`;
    
    const weatherRes = await fetch(weatherUrl);
    if (!weatherRes.ok) {
      return NextResponse.json({ error: "Weather service unavailable" }, { status: 500 });
    }
    const weatherData = await weatherRes.json();
    const current = weatherData.current;
    const daily = weatherData.daily;

    if (!current) {
      return NextResponse.json({ error: "Failed to parse weather data" }, { status: 500 });
    }

    // 3. Map values
    const currentCode = current.weather_code;
    const weatherDetails = getWMOWeatherDetails(currentCode);
    const rain = current.precipitation || current.rain || current.showers || 0;
    const wind = current.wind_speed_10m || 0;

    const risk = calculateRisk(currentCode, rain, wind);

    // 4. Build daily forecast list
    const forecast = [];
    if (daily && daily.time) {
      for (let i = 0; i < daily.time.length; i++) {
        const dCode = daily.weather_code[i];
        forecast.push({
          date: daily.time[i],
          temp_max: daily.temperature_2m_max[i],
          temp_min: daily.temperature_2m_min[i],
          precipitation_sum: daily.precipitation_sum[i],
          precipitation_prob: daily.precipitation_probability_max[i],
          weather_code: dCode,
          description: getWMOWeatherDetails(dCode).desc,
        });
      }
    }

    const payload = {
      location: locationName,
      coordinates: { lat, lon },
      current: {
        temp: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        feels_like: current.apparent_temperature,
        rain: rain,
        wind: wind,
        weather_code: currentCode,
        description: weatherDetails.desc,
        category: weatherDetails.category,
      },
      risk: {
        level: risk.level,
        reason: risk.reason,
      },
      forecast,
    };

    return NextResponse.json(payload);
  } catch (error: any) {
    console.error("Weather API Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
