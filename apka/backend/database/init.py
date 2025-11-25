from db_engine import engine
from db_schema import Base

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
print("Database initialized successfully!")
