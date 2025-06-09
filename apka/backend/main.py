import os
import uvicorn
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import pandas as pd
from recommender import OutfitPairRecommender

app = FastAPI()
# Pozwól frontendowi na dostęp
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Schemat pojedynczego elementu garderoby
class WardrobeItem(BaseModel):
    type: str
    color: str
    material: str
    size: str
    season: str
    style: str
    favorite: int = Field(..., ge=0, le=1)
    special_property: str

# Schemat żądania do rekomendacji
class RecommendRequest(BaseModel):
    items: List[WardrobeItem]
    weather: dict  # { "temperature": float, "rain_chance": float, "wind_speed": float, "season": str }
    rule_weight: float = Field(0.5, ge=0.0, le=1.0)
    top_k: int = Field(5, ge=1)

@app.post("/recommend")
async def recommend(req: RecommendRequest = Body(...)):
    # Utwórz DataFrame z listy elementów, nadając user_id=1 i kolejne item_id
    data = []
    item_id = 1
    for it in req.items:
        row = it.dict()
        row.update({"user_id": 1, "item_id": item_id})
        data.append(row)
        item_id += 1
    df = pd.DataFrame(data)

    # Sprawdź minimum 5 tops i 5 bottoms
    count_tops = df[df['type'].isin(OutfitPairRecommender.__init__.__globals__['TOP_TYPES'])].shape[0]
    count_bottoms = df[df['type'].isin(OutfitPairRecommender.__init__.__globals__['BOTTOM_TYPES'])].shape[0]
    if count_tops < 5 or count_bottoms < 5:
        raise HTTPException(status_code=400, detail="Potrzebujesz co najmniej 5 topów i 5 bottomów w garderobie.")

    # Przygotuj pogodę
    weather = req.weather
    if not all(k in weather for k in ['temperature', 'rain_chance', 'wind_speed', 'season']):
        raise HTTPException(status_code=400, detail="Brak kompletnych parametrów pogodowych.")

    recomm = OutfitPairRecommender(df, rule_weight=req.rule_weight)
    pairs = recomm.recommend_pairs(user_id=1, weather=weather, top_k=req.top_k)
    result = []
    for top_id, top_type, bot_id, bot_type, score in pairs:
        result.append({
            "topId": top_id,
            "topType": top_type,
            "bottomId": bot_id,
            "bottomType": bot_type,
            "score": score
        })
    return {"recommendations": result}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)