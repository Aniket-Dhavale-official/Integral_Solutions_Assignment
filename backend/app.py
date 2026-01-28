import os
from dotenv import load_dotenv
load_dotenv()

from flask import Flask
from config.config import get_config
from db import init_db, get_db_client
from auth.routes import auth_bp
from video.routes import video_bp, dashboard_bp

def create_app(config_name: str | None = None) -> Flask:
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