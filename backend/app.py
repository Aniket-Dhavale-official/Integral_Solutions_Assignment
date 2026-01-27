import os

from flask import Flask

from config.config import get_config
from db.mongo import init_db
from auth.routes import auth_bp
from video.routes import video_bp


def create_app(config_name: str | None = None) -> Flask:
    app = Flask(__name__)

    if config_name is None:
        config_name = os.getenv("FLASK_CONFIG", "development")

    app_config = get_config(config_name)
    app.config.from_object(app_config)

    init_db(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(video_bp)

    @app.get("/health")
    def health_check():
        return {"status": "ok"}, 200

    return app


if __name__ == "__main__":
    flask_app = create_app()
    flask_app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")))

