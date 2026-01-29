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
from flask_cors import CORS


def configure_logging() -> None:
    logger = logging.getLogger()
    if logger.handlers:
        return
    logger.setLevel(logging.INFO)
    formatter = logging.Formatter(
        "%(asctime)s %(levelname)s %(name)s %(message)s"
    )
    
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)


def create_app(config_name: str | None = None) -> Flask:
    configure_logging()

    app = Flask(__name__)
    
    # Allow ALL origins for local development
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)
    
    if config_name is None:
        config_name = os.getenv("FLASK_CONFIG", "development")

    app.config.from_object(get_config(config_name))

    init_db(app)

    app.register_blueprint(auth_bp)
    app.register_blueprint(video_bp)
    app.register_blueprint(dashboard_bp)

    @app.get("/")
    def home():
        return {"message": "Video API is running", "status": "ok"}

    @app.get("/health")
    def health():
        try:
            get_db_client().admin.command("ping")
            return {"status": "ok", "db": "ok"}
        except Exception as e:
            logging.error(f"Health check failed: {e}")
            return {"status": "ok", "db": "error", "error": str(e)}, 500

    return app


if __name__ == "__main__":
    app = create_app()
    port = int(os.getenv("PORT", 5000))
    
    print("\n" + "="*60)
    print("🚀 Flask Backend Starting...")
    print("="*60)
    print(f"📍 Local URL:          http://localhost:{port}")
    print(f"📍 Network URL:        http://0.0.0.0:{port}")
    print(f"📍 Android Emulator:   http://10.0.2.2:{port}")
    print(f"📍 Health Check:       http://localhost:{port}/health")
    print("="*60)
    print("✅ MongoDB Atlas Connected")
    print("="*60 + "\n")
    
    # Disable Flask's default startup messages to avoid duplication
    import werkzeug
    werkzeug._internal._log = lambda *args, **kwargs: None
    
    app.run(
        host="0.0.0.0",
        port=port,
        debug=True,
        use_reloader=True,
        threaded=True
    )