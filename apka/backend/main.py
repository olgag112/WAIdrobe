import os
import uvicorn
from fastapi import FastAPI, HTTPException, Body, Depends, Query, Path, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import pandas as pd
from weather.weather import fetch_weather
from sqlalchemy.orm import Session
from database.db_engine import SessionLocal
from database.db_schema import WardrobeItemDB, UserDB
from fastapi.staticfiles import StaticFiles
from typing import Optional
import uuid
from siec.inference import load_model, recommend_outfits
from rembg import remove
from PIL import Image

UPLOAD_DIR = "uploads"
app = FastAPI()
# Pozwól frontendowi na dostęp
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

model, dataset = load_model("siec/model_fine_tuned_topOuter.pth", "siec/data/scored_data/out/training_topOuter3.csv")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# =============
# Schemas
# =============
# Schemat pojedynczego elementu garderoby
class Item(BaseModel):
    id: int
    type: str
    color: str
    material: str
    size: str
    style: str
    favorite: int
    special_property: str

class Weather(BaseModel):
    temperature: float
    rain_chance: float
    wind_speed: float
    season: Optional[str] = None

class RecommendRequest(BaseModel):
    wardrobe: List[Item]
    weather: Weather
    user_id: int

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
    image_url: Optional[str] = None

class UserCreate(BaseModel):
    password: str
    name: str
    surname: str

class WeatherRequest(BaseModel):
    city: str
    long_term: bool = True

# =============
# FastAPI CRUDs
# =============

# get recommendations from users wardrobe
@app.post("/recommend")
def recommend(req: RecommendRequest):
    # Convert to DataFrame like your inference expects
    print(req)
    items = [
        Item(
            id=item.id,
            type=item.type,
            color=item.color,
            material=item.material,
            size=item.size,
            style=item.style,
            favorite=item.favorite,
            special_property=item.special_property,
        ) for item in req.wardrobe
    ]
    wardrobe_df = pd.DataFrame([item.dict() for item in items])
    wardrobe_df["user_id"] = req.user_id  # single user
    wardrobe_df.rename(columns={"id": "item_id"}, inplace=True)
    weather = {"temperature": req.weather.temperature, "rain": req.weather.rain_chance, "wind": req.weather.wind_speed}
    print(wardrobe_df)
    recs = recommend_outfits(model, dataset, wardrobe_df, user_id=req.user_id, weather=weather)
    return {"recommendations": recs}


# get full 7-day weather forecast for the given city
@app.post("/api/weather")
async def weather(req: WeatherRequest = Body(...)):
    return fetch_weather(req.city, req.long_term)


# add new item to the wardrobe_items table with the link to the given user
@app.post("/add_item")
async def add_item(item: WardrobeItem = Body(...), user_id: int = Query(...), db: Session = Depends(get_db)):
    db_item = WardrobeItemDB(**item.dict(), user_id=user_id)
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return {"message": "Item saved", "item_id": db_item.id}

# add new user to the users table
@app.post("/add_user")
def add_user(user: UserCreate, db: Session = Depends(get_db)):
    # check if a user with the same name+surname exists
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

# get information about user from users table by his id
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


# delete an item from wardrobe_items table (if image is linked to this item, delete it as well)
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


# get all items that belong to given user
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

# transfer images from frontend to backend and save it in "uploads/"
@app.post("/upload_image")
async def upload_image(file: UploadFile = File(...)):
    
    # Generate a unique filename
    filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)

    # Save file to disk
    with open(file_path, "wb") as f:
        f.write(await file.read())
    
    # remove background
    img = Image.open(file_path)
    output = remove(img)

    # detect output format from file extension
    root, ext = os.path.splitext(file_path)
    ext = ext.lower()

    # change to png to have clear background
    if ext in [".jpg", ".jpeg"]:
        new_path = root + ".png"
    else:
        new_path = file_path

    new_filename = os.path.basename(new_path)
    output.save(new_path)
    os.remove(file_path)

    return {"filename": new_filename, "url": f"http://localhost:8000/uploads/{new_filename}"}



if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
