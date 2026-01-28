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


def get_user_id_from_token():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None, jsonify({"success": False, "error": "invalid token"}), 401

    token = auth_header[7:].strip()
    if not token:
        return None, jsonify({"success": False, "error": "invalid token"}), 401

    client = get_db_client()
    db = client.get_default_database()
    blacklist = db["token_blacklist"]

    if blacklist.find_one({"token": token}):
        return None, jsonify({"success": False, "error": "token invalidated"}), 401

    jwt_secret = current_app.config.get("JWT_SECRET_KEY")
    jwt_algorithm = current_app.config.get("JWT_ALGORITHM", "HS256")

    try:
        payload = jwt.decode(token, jwt_secret, algorithms=[jwt_algorithm])
        user_id = payload.get("user_id")
        if not user_id:
            return None, jsonify({"success": False, "error": "invalid token"}), 401
        return user_id, None, None
    except jwt.ExpiredSignatureError:
        return None, jsonify({"success": False, "error": "token expired"}), 401
    except jwt.InvalidTokenError:
        return None, jsonify({"success": False, "error": "invalid token"}), 401
    except Exception:
        return None, jsonify({"success": False, "error": "invalid token"}), 401


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
    ip_address = request.remote_addr or "unknown"

    client = get_db_client()
    db = client.get_default_database()
    attempts_collection = db["login_attempts"]
    window_start = attempt_time - timedelta(minutes=5)
    filters = [{"ip": ip_address}]
    if email:
        filters.append({"email": email})
    attempts_count = attempts_collection.count_documents(
        {
            "timestamp": {"$gte": window_start},
            "$or": filters,
        }
    )
    if attempts_count >= 5:
        logger.info(f"Login rate limit exceeded for ip={ip_address} email={email}")
        return jsonify({"success": False, "error": "too many login attempts"}), 429

    if not email:
        logger.info(f"Login failed at {attempt_time}: email missing")
        attempts_collection.insert_one(
            {
                "email": None,
                "ip": ip_address,
                "timestamp": attempt_time,
                "success": False,
            }
        )
        return jsonify({"success": False, "error": "email is required"}), 400

    if not is_valid_email(email):
        logger.info(f"Login failed at {attempt_time}: invalid email format")
        attempts_collection.insert_one(
            {
                "email": email,
                "ip": ip_address,
                "timestamp": attempt_time,
                "success": False,
            }
        )
        return jsonify({"success": False, "error": "email is invalid"}), 400

    if not password:
        logger.info(f"Login failed at {attempt_time}: password missing")
        attempts_collection.insert_one(
            {
                "email": email,
                "ip": ip_address,
                "timestamp": attempt_time,
                "success": False,
            }
        )
        return jsonify({"success": False, "error": "password is required"}), 400

    users = db["users"]

    user = users.find_one({"email": email})
    if not user:
        logger.info(f"Login failed at {attempt_time}: email not found")
        attempts_collection.insert_one(
            {
                "email": email,
                "ip": ip_address,
                "timestamp": attempt_time,
                "success": False,
            }
        )
        return jsonify({"success": False, "error": "invalid credentials"}), 401

    stored_hash = user.get("password_hash", "")
    if not check_password_hash(stored_hash, password):
        logger.info(f"Login failed at {attempt_time}: password mismatch")
        attempts_collection.insert_one(
            {
                "email": email,
                "ip": ip_address,
                "timestamp": attempt_time,
                "success": False,
            }
        )
        return jsonify({"success": False, "error": "invalid credentials"}), 401

    user_id = user.get("user_id")
    if not user_id:
        logger.info(f"Login failed at {attempt_time}: user_id missing")
        attempts_collection.insert_one(
            {
                "email": email,
                "ip": ip_address,
                "timestamp": attempt_time,
                "success": False,
            }
        )
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
        attempts_collection.insert_one(
            {
                "email": email,
                "ip": ip_address,
                "timestamp": attempt_time,
                "success": False,
            }
        )
        return jsonify({"success": False, "error": "login failed"}), 500

    attempts_collection.insert_one(
        {
            "email": email,
            "ip": ip_address,
            "timestamp": attempt_time,
            "success": True,
        }
    )

    logger.info(f"Login succeeded at {attempt_time} for user {user_id}")
    return jsonify({"success": True, "token": token}), 200


@auth_bp.get("/me")
def get_profile():
    user_id, error_response, status_code = get_user_id_from_token()
    if error_response:
        return error_response, status_code

    client = get_db_client()
    db = client.get_default_database()
    users = db["users"]

    user = users.find_one({"user_id": user_id})
    if not user:
        return jsonify({"success": False, "error": "user not found"}), 404

    full_name = user.get("full_name", "")
    email = user.get("email", "")

    return jsonify({"success": True, "full_name": full_name, "email": email}), 200


@auth_bp.post("/logout")
def logout():
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return jsonify({"success": False, "error": "invalid token"}), 401

    token = auth_header[7:].strip()
    if not token:
        return jsonify({"success": False, "error": "invalid token"}), 401

    jwt_secret = current_app.config.get("JWT_SECRET_KEY")
    jwt_algorithm = current_app.config.get("JWT_ALGORITHM", "HS256")

    try:
        payload = jwt.decode(token, jwt_secret, algorithms=[jwt_algorithm])
    except jwt.ExpiredSignatureError:
        return jsonify({"success": False, "error": "token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"success": False, "error": "invalid token"}), 401
    except Exception:
        return jsonify({"success": False, "error": "invalid token"}), 401

    client = get_db_client()
    db = client.get_default_database()
    blacklist = db["token_blacklist"]

    existing = blacklist.find_one({"token": token})
    if existing:
        return jsonify({"success": True, "message": "logout successful"}), 200

    exp_time = payload.get("exp")
    if exp_time:
        if isinstance(exp_time, (int, float)):
            expires_at = datetime.utcfromtimestamp(exp_time)
        elif isinstance(exp_time, datetime):
            expires_at = exp_time
        else:
            expires_at = datetime.utcnow() + timedelta(hours=24)
    else:
        expires_at = datetime.utcnow() + timedelta(hours=24)

    blacklist_doc = {
        "token": token,
        "invalidated_at": datetime.utcnow(),
        "expires_at": expires_at,
    }

    try:
        blacklist.insert_one(blacklist_doc)
    except Exception:
        logger.exception("Logout failed during blacklist persistence")
        return jsonify({"success": False, "error": "logout failed"}), 500

    logger.info("Logout succeeded")
    return jsonify({"success": True, "message": "logout successful"}), 200


@auth_bp.post("/refresh")
def refresh():
    payload = request.get_json(silent=True) or {}
    refresh_token = payload.get("refresh_token") or ""
    if not refresh_token:
        return jsonify({"success": False, "error": "refresh_token is required"}), 400
    client = get_db_client()
    db = client.get_default_database()
    tokens = db["refresh_tokens"]
    record = tokens.find_one({"token": refresh_token})
    if not record:
        return jsonify({"success": False, "error": "invalid refresh token"}), 401
    now = datetime.utcnow()
    expires_at = record.get("expires_at")
    if expires_at and expires_at < now:
        tokens.delete_one({"_id": record["_id"]})
        return jsonify({"success": False, "error": "refresh token expired"}), 401
    jwt_secret = current_app.config.get("JWT_SECRET_KEY")
    jwt_algorithm = current_app.config.get("JWT_ALGORITHM", "HS256")
    try:
        decoded = jwt.decode(refresh_token, jwt_secret, algorithms=[jwt_algorithm])
    except jwt.ExpiredSignatureError:
        tokens.delete_one({"_id": record["_id"]})
        return jsonify({"success": False, "error": "refresh token expired"}), 401
    except jwt.InvalidTokenError:
        return jsonify({"success": False, "error": "invalid refresh token"}), 401
    except Exception:
        return jsonify({"success": False, "error": "invalid refresh token"}), 401
    user_id = decoded.get("user_id")
    if not user_id:
        return jsonify({"success": False, "error": "invalid refresh token"}), 401
    access_expiry = datetime.utcnow() + timedelta(hours=24)
    access_payload = {
        "user_id": user_id,
        "exp": access_expiry,
    }
    try:
        access_token = jwt.encode(access_payload, jwt_secret, algorithm=jwt_algorithm)
    except Exception:
        logger.exception("Access token generation failed during refresh")
        return jsonify({"success": False, "error": "refresh failed"}), 500
    return jsonify({"success": True, "token": access_token}), 200

