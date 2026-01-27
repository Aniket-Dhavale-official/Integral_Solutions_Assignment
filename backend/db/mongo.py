from __future__ import annotations

from typing import Optional

from flask import Flask
from pymongo import MongoClient

_client: Optional[MongoClient] = None


def init_db(app: Flask) -> None:
    global _client

    mongo_uri = app.config.get("MONGO_URI")
    _client = MongoClient(mongo_uri)


def get_db_client() -> MongoClient:
    if _client is None:
        raise RuntimeError("MongoDB client has not been initialized. Call init_db(app) first.")
    return _client

