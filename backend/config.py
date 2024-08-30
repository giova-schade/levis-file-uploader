# backend/app/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    print(os.getenv('POSTGRES_HOST_DB')    )
    SQLALCHEMY_DATABASE_URI = (
        f"postgresql+psycopg2://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}"
        f"@{os.getenv('POSTGRES_HOST_DB', 'localhost')}:{os.getenv('POSTGRES_PORT', 5432)}/{os.getenv('POSTGRES_DB')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
