from flask import Flask
from pymongo import MongoClient
from typing import Optional
from urllib.parse import quote_plus
import os

_client: Optional[MongoClient] = None

def init_db(app: Flask) -> None:
    global _client

    user = os.getenv("MONGO_USER")
    password = os.getenv("MONGO_PASSWORD")
    db_name = os.getenv("MONGO_DB")

    if not user or not password or not db_name:
        raise RuntimeError("MongoDB credentials missing in .env")

    uri = (
        "mongodb+srv://"
        f"{quote_plus(user)}:{quote_plus(password)}"
        "@cluster0.wjqbtix.mongodb.net/"
        f"{db_name}?retryWrites=true&w=majority"
    )

    app.config["MONGO_URI"] = uri

    _client = MongoClient(
        uri,
        serverSelectionTimeoutMS=5000,
        tls=True
    )

    _client.admin.command("ping")
    print("MongoDB Atlas connected")

def get_db_client() -> MongoClient:
    if _client is None:
        raise RuntimeError("MongoDB not initialized")
    return _client