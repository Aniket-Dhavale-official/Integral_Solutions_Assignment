import logging
from flask import Blueprint, jsonify, current_app, request
from bson import ObjectId
from datetime import datetime, timedelta
import jwt

from db.mongo import get_db_client

logger = logging.getLogger(__name__)

video_bp = Blueprint("video", __name__, url_prefix="/video")
dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.get("/dashboard")
def get_dashboard():
    client = get_db_client()
    db = client.get_default_database()
    videos_collection = db["videos"]
    
    # Use MongoDB aggregation pipeline to get random 2 active videos
    cursor = videos_collection.aggregate([
        {"$match": {"is_active": True}},
        {"$sample": {"size": 2}},
        {"$project": {
            "title": 1,
            "description": 1,
            "thumbnail_url": 1,
            "_id": 1
        }}
    ])
    
    videos = []
    for doc in cursor:
        jwt_secret = current_app.config.get("JWT_SECRET_KEY")
        jwt_algorithm = current_app.config.get("JWT_ALGORITHM", "HS256")
        payload = {
            "video_id": str(doc.get("_id")),
            "exp": datetime.utcnow() + timedelta(minutes=5),
        }
        token = jwt.encode(payload, jwt_secret, algorithm=jwt_algorithm)
        
        videos.append({
            "video_id": str(doc.get("_id")),
            "title": doc.get("title", "Untitled Video"),
            "description": doc.get("description", "No description available"),
            "thumbnail_url": doc.get("thumbnail_url", ""),
            "playback_token": token,
        })
    
    return jsonify({"success": True, "videos": videos}), 200


@video_bp.get("/<video_id>/stream")
def stream_video(video_id):
    playback_token = request.args.get("token", "").strip()
    if not playback_token:
        logger.warning(
            "video_token_error",
            extra={
                "error": "missing_playback_token",
                "video_id": video_id,
                "ip": request.remote_addr or "unknown",
            },
        )
        return jsonify({"error": "unauthorized"}), 401
    
    jwt_secret = current_app.config.get("JWT_SECRET_KEY")
    jwt_algorithm = current_app.config.get("JWT_ALGORITHM", "HS256")
    
    try:
        payload = jwt.decode(playback_token, jwt_secret, algorithms=[jwt_algorithm])
    except jwt.ExpiredSignatureError:
        logger.warning(
            "video_token_error",
            extra={
                "error": "expired_playback_token",
                "video_id": video_id,
                "ip": request.remote_addr or "unknown",
            },
        )
        return jsonify({"error": "unauthorized"}), 401
    except jwt.InvalidTokenError:
        logger.warning(
            "video_token_error",
            extra={
                "error": "invalid_playback_token",
                "video_id": video_id,
                "ip": request.remote_addr or "unknown",
            },
        )
        return jsonify({"error": "unauthorized"}), 401
    
    token_video_id = payload.get("video_id")
    if not token_video_id or token_video_id != video_id:
        logger.warning(
            "video_access_error",
            extra={
                "error": "video_id_mismatch",
                "video_id": video_id,
                "token_video_id": token_video_id,
                "ip": request.remote_addr or "unknown",
            },
        )
        return jsonify({"error": "unauthorized"}), 401
    
    client = get_db_client()
    db = client.get_default_database()
    videos_collection = db["videos"]
    
    try:
        query = {"_id": ObjectId(video_id), "is_active": True}
    except Exception:
        logger.warning(
            "video_access_error",
            extra={
                "error": "invalid_video_id_format",
                "video_id": video_id,
                "ip": request.remote_addr or "unknown",
            },
        )
        return jsonify({"error": "unauthorized"}), 401
    
    video = videos_collection.find_one(query)
    if not video:
        logger.warning(
            "video_access_error",
            extra={
                "error": "video_not_found_or_inactive",
                "video_id": video_id,
                "ip": request.remote_addr or "unknown",
            },
        )
        return jsonify({"error": "unauthorized"}), 401
    
    youtube_id = video.get("youtube_id")
    if not youtube_id:
        logger.warning(
            "video_access_error",
            extra={
                "error": "missing_youtube_id",
                "video_id": video_id,
                "ip": request.remote_addr or "unknown",
            },
        )
        return jsonify({"error": "unauthorized"}), 401
    
    embed_url = f"https://www.youtube-nocookie.com/embed/{youtube_id}"
    return jsonify({"embed_url": embed_url}), 200


@video_bp.post("/<video_id>/watch")
def watch_video(video_id):
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        logger.warning(
            "video_watch_error",
            extra={
                "error": "missing_bearer_prefix",
                "video_id": video_id,
                "ip": request.remote_addr or "unknown",
            },
        )
        return jsonify({"success": False, "error": "unauthorized"}), 401
    
    token = auth_header[7:].strip()
    if not token:
        logger.warning(
            "video_watch_error",
            extra={
                "error": "empty_token",
                "video_id": video_id,
                "ip": request.remote_addr or "unknown",
            },
        )
        return jsonify({"success": False, "error": "unauthorized"}), 401
    
    jwt_secret = current_app.config.get("JWT_SECRET_KEY")
    jwt_algorithm = current_app.config.get("JWT_ALGORITHM", "HS256")
    
    try:
        payload = jwt.decode(token, jwt_secret, algorithms=[jwt_algorithm])
    except jwt.ExpiredSignatureError:
        logger.warning(
            "video_watch_error",
            extra={
                "error": "expired_access_token",
                "video_id": video_id,
                "ip": request.remote_addr or "unknown",
            },
        )
        return jsonify({"success": False, "error": "unauthorized"}), 401
    except jwt.InvalidTokenError:
        logger.warning(
            "video_watch_error",
            extra={
                "error": "invalid_access_token",
                "video_id": video_id,
                "ip": request.remote_addr or "unknown",
            },
        )
        return jsonify({"success": False, "error": "unauthorized"}), 401
    
    user_id = payload.get("user_id")
    if not user_id:
        logger.warning(
            "video_watch_error",
            extra={
                "error": "missing_user_id_claim",
                "video_id": video_id,
                "ip": request.remote_addr or "unknown",
            },
        )
        return jsonify({"success": False, "error": "unauthorized"}), 401
    
    client = get_db_client()
    db = client.get_default_database()
    history = db["video_watch_history"]
    
    doc = {
        "user_id": user_id,
        "video_id": video_id,
        "watched_at": datetime.utcnow(),
    }
    
    try:
        history.insert_one(doc)
    except Exception:
        logger.exception(
            "video_watch_error",
            extra={
                "error": "persistence_failure",
                "video_id": video_id,
                "user_id": user_id,
                "ip": request.remote_addr or "unknown",
            },
        )
        return jsonify({"success": False, "error": "failed to record watch"}), 500
    
    return jsonify({"success": True, "message": "watch recorded"}), 200