import os
import uvicorn
from fastapi import FastAPI, HTTPException, Body, Depends, Query, Path, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import pandas as pd
from recommender import OutfitPairRecommender
from datetime import datetime
from weather import fetch_weather
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import WardrobeItemDB, UserDB
from fastapi.staticfiles import StaticFiles
import uuid
# from rembg import remove

UPLOAD_DIR = "uploads"
app = FastAPI()
# Pozwól frontendowi na dostęp
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =============
# Recommender
# =============
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
    category: str
    image_url: str

class UserCreate(BaseModel):
    password: str
    name: str
    surname: str

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


# =============
# WEATHER
# =============
class WeatherRequest(BaseModel):
    city: str
    long_term: bool = True

@app.post("/api/weather")
async def weather(req: WeatherRequest = Body(...)):
    """Return full 7-day weather forecast for the given city."""
    return fetch_weather(req.city, req.long_term)


@app.post("/add_item")
async def add_item(item: WardrobeItem = Body(...), user_id: int = Query(...), db: Session = Depends(get_db)):
    db_item = WardrobeItemDB(**item.dict(), user_id=user_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return {"message": "Item saved", "item_id": db_item.id}

@app.post("/add_user")
def add_user(user: UserCreate, db: Session = Depends(get_db)):
    # Optional: check if a user with the same name+surname exists
    existing_user = db.query(UserDB).filter_by(name=user.name, surname=user.surname).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    # Create SQLAlchemy object from Pydantic data
    db_user = UserDB(
        password=user.password,
        name=user.name,
        surname=user.surname
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)  # Refresh to get the generated user_id

    return {"message": "User saved", "user_id": db_user.user_id}

@app.get("/users/{user_id}")
async def get_user(user_id: int = Path(...), db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "user_id": user.user_id,
        "name": user.name,
        "surname": user.surname,
        "password": user.password
    }


@app.delete("/delete_item/{item_id}")
async def delete_item(item_id: int = Path(..., description="ID of the item to delete"), 
                      db: Session = Depends(get_db)):
    db_item = db.query(WardrobeItemDB).filter(WardrobeItemDB.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if db_item.image_url:
        file_name = db_item.image_url.split('/')[-1]
        file_path = os.path.join(UPLOAD_DIR, file_name)
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Error deleting file: {e}")
        # Optional: log if file was missing
        else:
            print(f"Warning: Image file not found for item {item_id}")
    
    db.delete(db_item)
    db.commit()
    
    return {"message": f"Item {item_id} deleted successfully"}

@app.get("/wardrobe")
async def get_wardrobe(user_id: int = Query(..., description="User ID"), db: Session = Depends(get_db)):
    items = db.query(WardrobeItemDB).filter(WardrobeItemDB.user_id == user_id).all()
    return {
        "items": [
            {
                "id": item.id,
                "type": item.type,
                "color": item.color,
                "material": item.material,
                "size": item.size,
                "season": item.season,
                "style": item.style,
                "favorite": item.favorite,
                "special_property": item.special_property,
                "category": item.category,
                "image_url": item.image_url
            }
            for item in items
        ]
    }

@app.post("/upload_image")
async def upload_image(file: UploadFile = File(...)):
    # Generate a unique filename
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save file to disk
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # with open(input_path, 'rb') as i:
    #     with open(file_path, 'wb') as o:
    #         input = i.read()
    #         output = remove(input)
    #         o.write(output)

    # Return path or URL to the frontend
    return {"filename": filename, "url": f"http://localhost:8000/uploads/{filename}"}



if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
