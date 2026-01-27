from flask import Flask
from pymongo import MongoClient
from typing import Optional
from urllib.parse import quote_plus
import os

_client: Optional[MongoClient] = None

def init_db(app: Flask) -> None:
    global _client
    mongo_user = os.getenv("MONGO_USER")
    mongo_password = os.getenv("MONGO_PASSWORD")
    mongo_db = os.getenv("MONGO_DB")
    if not mongo_user or not mongo_password or not mongo_db:
        raise RuntimeError("MongoDB credentials not set in .env")

    mongo_uri = f"mongodb+srv://{quote_plus(mongo_user)}:{quote_plus(mongo_password)}@cluster0.wjqbtix.mongodb.net/{mongo_db}?retryWrites=true&w=majority"
    app.config["MONGO_URI"] = mongo_uri

    _client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
    try:
        _client.admin.command("ping")
        print("Connected to MongoDB Atlas successfully")
    except Exception as e:
        raise RuntimeError(f"Failed to connect to MongoDB Atlas: {e}")

def get_db_client() -> MongoClient:
    if _client is None:
        raise RuntimeError("MongoDB client not initialized. Call init_db(app) first.")
    return _client