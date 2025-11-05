from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class WardrobeItemDB(Base):
    __tablename__ = "wardrobe_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    type = Column(String)
    color = Column(String)
    material = Column(String)
    size = Column(String)
    season = Column(String)
    style = Column(String)
    favorite = Column(Integer)
    special_property = Column(String)
    category = Column(String)
    image_url = Column(String, nullable=True) 

    user = relationship("UserDB", back_populates="wardrobe_items")

class UserDB(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    password = Column(String)
    name = Column(String)
    surname = Column(String)

    wardrobe_items = relationship("WardrobeItemDB", back_populates="user")
