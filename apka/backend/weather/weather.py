import requests
from datetime import datetime

# router = APIRouter()

API_KEY = "be8cb59580baae4afd1256d90ee2b181"



def get_lon_lat(city: str):
    """Get latitude and longitude for a given city name."""
    url = f"http://api.openweathermap.org/geo/1.0/direct?q={city}&limit=1&appid={API_KEY}"
    response = requests.get(url)
    data = response.json()
    if not data:
        raise HTTPException(status_code=404, detail=f"City '{city}' not found")
    lat = data[0]['lat']
    lon = data[0]['lon']
    return lat, lon

def fetch_weather(city: str, long_term: bool = True):
    """Fetch 7-day weather forecast for a city."""
    lat, lon = get_lon_lat(city)
    url = f"https://api.openweathermap.org/data/3.0/onecall?lat={lat}&lon={lon}&exclude=minutely,hourly,alerts&units=metric&appid={API_KEY}"
    response = requests.get(url)
    data = response.json()

    if "daily" not in data:
        raise HTTPException(status_code=500, detail="No daily data returned from weather API")

    results = []
    for d in data["daily"]:
        results.append({
            "time": datetime.utcfromtimestamp(d["dt"]).strftime("%Y-%m-%d"),
            "temperature": d["temp"]["day"],
            "feels_like": d["feels_like"]["day"],
            "wind_speed": d["wind_speed"],
            "rain_chance": d.get("pop", 0) * 100
        })

    return {"forecast": results}