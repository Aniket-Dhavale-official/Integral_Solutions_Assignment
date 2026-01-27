from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass
class BaseConfig:
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production")

    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "change-me-jwt")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")

    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/mobile_api")

    DEBUG: bool = False
    TESTING: bool = False


@dataclass
class DevelopmentConfig(BaseConfig):
    DEBUG: bool = True


@dataclass
class TestingConfig(BaseConfig):
    TESTING: bool = True
    DEBUG: bool = True


@dataclass
class ProductionConfig(BaseConfig):
    DEBUG: bool = False


def get_config(name: str) -> type[BaseConfig]:
    normalized = name.lower()
    mapping: dict[str, type[BaseConfig]] = {
        "development": DevelopmentConfig,
        "testing": TestingConfig,
        "production": ProductionConfig,
    }

    try:
        return mapping[normalized]
    except KeyError as exc:
        raise KeyError(f"Unknown configuration '{name}'") from exc

