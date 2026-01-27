import logging
import re
from datetime import datetime, timedelta
from uuid import uuid4

import jwt
from flask import Blueprint, current_app, jsonify, request
from werkzeug.security import check_password_hash

from db.mongo import get_db_client

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")
logger = logging.getLogger(__name__)


def is_valid_email(value: str) -> bool:
    pattern = r"^[^@]+@[^@]+\.[^@]+$"
    return bool(re.match(pattern, value))


def is_strong_password(value: str) -> bool:
    if len(value) < 8:
        return False
    has_lower = any(c.islower() for c in value)
    has_upper = any(c.isupper() for c in value)
    has_digit = any(c.isdigit() for c in value)
    has_special = any(not c.isalnum() for c in value)
    return has_lower and has_upper and has_digit and has_special


@auth_bp.post("/signup")
def signup():
    payload = request.get_json(silent=True) or {}
    full_name = (payload.get("full_name") or "").strip()
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""
    confirm_password = payload.get("confirm_password") or ""

    errors = {}

    if not full_name:
        errors["full_name"] = "full_name is required"

    if not email:
        errors["email"] = "email is required"
    elif not is_valid_email(email):
        errors["email"] = "email is invalid"

    if not password:
        errors["password"] = "password is required"
    elif not is_strong_password(password):
        errors["password"] = "password is too weak"

    if confirm_password != password:
        errors["confirm_password"] = "passwords do not match"

    if errors:
        logger.info("Signup validation failed")
        return jsonify({"success": False, "errors": errors}), 400

    client = get_db_client()
    db = client.get_default_database()
    users = db["users"]

    existing = users.find_one({"email": email})
    if existing:
        logger.info("Signup failed: email already exists")
        return jsonify({"success": False, "error": "email already exists"}), 400

    from werkzeug.security import generate_password_hash

    user_id = str(uuid4())
    password_hash = generate_password_hash(password)
    created_at = datetime.utcnow()

    user_doc = {
        "user_id": user_id,
        "full_name": full_name,
        "email": email,
        "password_hash": password_hash,
        "created_at": created_at,
    }

    try:
        users.insert_one(user_doc)
    except Exception:
        logger.exception("Signup failed during persistence")
        return jsonify({"success": False, "error": "signup failed"}), 500

    logger.info("Signup succeeded")
    return jsonify({"success": True, "message": "signup successful"}), 201


@auth_bp.post("/login")
def login():
    attempt_time = datetime.utcnow()
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip().lower()
    password = payload.get("password") or ""

    if not email:
        logger.info(f"Login failed at {attempt_time}: email missing")
        return jsonify({"success": False, "error": "email is required"}), 400

    if not is_valid_email(email):
        logger.info(f"Login failed at {attempt_time}: invalid email format")
        return jsonify({"success": False, "error": "email is invalid"}), 400

    if not password:
        logger.info(f"Login failed at {attempt_time}: password missing")
        return jsonify({"success": False, "error": "password is required"}), 400

    client = get_db_client()
    db = client.get_default_database()
    users = db["users"]

    user = users.find_one({"email": email})
    if not user:
        logger.info(f"Login failed at {attempt_time}: email not found")
        return jsonify({"success": False, "error": "invalid credentials"}), 401

    stored_hash = user.get("password_hash", "")
    if not check_password_hash(stored_hash, password):
        logger.info(f"Login failed at {attempt_time}: password mismatch")
        return jsonify({"success": False, "error": "invalid credentials"}), 401

    user_id = user.get("user_id")
    if not user_id:
        logger.info(f"Login failed at {attempt_time}: user_id missing")
        return jsonify({"success": False, "error": "login failed"}), 500

    jwt_secret = current_app.config.get("JWT_SECRET_KEY")
    jwt_algorithm = current_app.config.get("JWT_ALGORITHM", "HS256")
    expiry_time = datetime.utcnow() + timedelta(hours=24)

    token_payload = {
        "user_id": user_id,
        "exp": expiry_time,
    }

    try:
        token = jwt.encode(token_payload, jwt_secret, algorithm=jwt_algorithm)
    except Exception:
        logger.exception(f"Login failed at {attempt_time}: JWT generation error")
        return jsonify({"success": False, "error": "login failed"}), 500

    logger.info(f"Login succeeded at {attempt_time} for user {user_id}")
    return jsonify({"success": True, "token": token}), 200

