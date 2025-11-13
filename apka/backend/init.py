# init_db.py
from database import engine
from models import Base

print("Creating database tables...")
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
print("Database initialized successfully!")
