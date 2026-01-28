from flask import Blueprint, jsonify, current_app
from bson import ObjectId
from datetime import datetime, timedelta
import jwt

from db.mongo import get_db_client

video_bp = Blueprint("video", __name__, url_prefix="/video")
dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.get("/dashboard")
def get_dashboard():
    client = get_db_client()
    db = client.get_default_database()
    videos_collection = db["videos"]
    cursor = videos_collection.find(
        {"is_active": True},
        {"title": 1, "description": 1, "thumbnail_url": 1}
    ).limit(2)
    jwt_secret = current_app.config.get("JWT_SECRET_KEY")
    jwt_algorithm = current_app.config.get("JWT_ALGORITHM", "HS256")
    videos = []
    for doc in cursor:
        payload = {
            "video_id": str(doc.get("_id")),
            "exp": datetime.utcnow() + timedelta(minutes=5),
        }
        token = jwt.encode(payload, jwt_secret, algorithm=jwt_algorithm)
        videos.append(
            {
                "stream_id": token,
                "title": doc.get("title"),
                "description": doc.get("description"),
                "thumbnail_url": doc.get("thumbnail_url"),
            }
        )
    return jsonify(videos)


@video_bp.get("/<token>/stream")
def stream_video(token):
    jwt_secret = current_app.config.get("JWT_SECRET_KEY")
    jwt_algorithm = current_app.config.get("JWT_ALGORITHM", "HS256")
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=[jwt_algorithm])
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "unauthorized"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"error": "unauthorized"}), 401
    video_id = payload.get("video_id")
    if not video_id:
        return jsonify({"error": "unauthorized"}), 401
    client = get_db_client()
    db = client.get_default_database()
    videos_collection = db["videos"]
    try:
        query = {"_id": ObjectId(video_id), "is_active": True}
    except Exception:
        return jsonify({"error": "unauthorized"}), 401
    video = videos_collection.find_one(query)
    if not video:
        return jsonify({"error": "unauthorized"}), 401
    youtube_id = video.get("youtube_id")
    if not youtube_id:
        return jsonify({"error": "unauthorized"}), 401
    embed_url = f"https://www.youtube-nocookie.com/embed/{youtube_id}"
    return jsonify({"embed_url": embed_url}), 200
