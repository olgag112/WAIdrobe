from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from .db_engine import Base

# schema of wardrobe_items table
class WardrobeItemDB(Base):
    __tablename__ = "wardrobe_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    type = Column(String(50))
    color = Column(String(50))
    material = Column(String(100))
    size = Column(String(20))
    season = Column(String(20))
    style = Column(String(50))
    favorite = Column(Integer) # 0 or 1
    special_property = Column(String(255), nullable=True)
    category = Column(String(50))
    image_url = Column(String(500), nullable=True) 

    user = relationship("UserDB", back_populates="wardrobe_items")

# schema of users table
class UserDB(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    password = Column(String(255))
    name = Column(String(50))
    surname = Column(String(50))

    wardrobe_items = relationship("WardrobeItemDB", back_populates="user", cascade="all, delete-orphan")