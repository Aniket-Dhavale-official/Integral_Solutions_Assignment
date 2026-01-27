import logging
import re
from datetime import datetime
from uuid import uuid4

from flask import Blueprint, jsonify, request

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

