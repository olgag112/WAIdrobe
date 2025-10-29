# backend.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
import torch
import pandas as pd
from inference import load_model, recommend_outfits

app = FastAPI()

model, dataset = load_model("model_fine_tuned_topOuter.pth", "training_topOuter3.csv")

class Item(BaseModel):
    id: int
    type: str
    color: str
    material: str
    size: str
    style: str
    favorite: int
    special_property: str


class RecommendRequest(BaseModel):
    wardrobe: List[Item]
    temperature: float
    rain: float
    wind: float
    top_k: Optional[int] = 5


@app.post("/recommend")
def recommend(req: RecommendRequest):
    # Convert to DataFrame like your inference expects
    wardrobe_df = pd.DataFrame([item.dict() for item in req.wardrobe])
    wardrobe_df["user_id"] = 1  # single user
    weather = {"temperature": req.temperature, "rain": req.rain, "wind": req.wind}

    recs = recommend_outfits(model, dataset, wardrobe_df, user_id=1, weather=weather, top_k=req.top_k)
    return {"recommendations": recs}
