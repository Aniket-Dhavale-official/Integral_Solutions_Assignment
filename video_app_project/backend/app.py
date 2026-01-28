import os
import logging
from logging.handlers import RotatingFileHandler
from dotenv import load_dotenv
load_dotenv()

from flask import Flask
from config.config import get_config
from db import init_db, get_db_client
from auth.routes import auth_bp
from video.routes import video_bp, dashboard_bp


def configure_logging() -> None:
    logger = logging.getLogger()
    if logger.handlers:
        return
    logger.setLevel(logging.INFO)
    formatter = logging.Formatter(
        "%(asctime)s %(levelname)s %(name)s %(message)s"
    )
    file_handler = RotatingFileHandler(
        "app.log",
        maxBytes=1_000_000,
        backupCount=5,
    )
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)


def create_app(config_name: str | None = None) -> Flask:
    configure_logging()

    app = Flask(__name__)

    if config_name is None:
        config_name = os.getenv("FLASK_CONFIG", "development")

    app.config.from_object(get_config(config_name))

    init_db(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(video_bp)
    app.register_blueprint(dashboard_bp)

    @app.get("/health")
    def health():
        try:
            get_db_client().admin.command("ping")
            return {"status": "ok", "db": "ok"}
        except Exception:
            return {"status": "ok", "db": "error"}, 500

    return app


if __name__ == "__main__":
    create_app().run(
        host="0.0.0.0",
        port=int(os.getenv("PORT", 5000))
    )