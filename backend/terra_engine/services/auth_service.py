import os
import json
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

def _auth_db_path() -> str:
    data_dir = os.environ.get("TERRA_DATA_DIR", "./data")
    return os.path.join(data_dir, "auth_db.json")

def _load_auth_db() -> dict:
    db_path = _auth_db_path()
    if not os.path.exists(db_path):
        default_db = {"users": {}, "sessions": {}}
        with open(db_path, "w") as f:
            json.dump(default_db, f, indent=2)
        return default_db
    try:
        with open(db_path, "r") as f:
            return json.load(f)
    except Exception:
        return {"users": {}, "sessions": {}}

def _save_auth_db(db: dict):
    data_dir = os.environ.get("TERRA_DATA_DIR", "./data")
    os.makedirs(data_dir, exist_ok=True)
    with open(_auth_db_path(), "w") as f:
        json.dump(db, f, indent=2)

def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()

def register_user(email: str, password: str) -> bool:
    db = _load_auth_db()
    email_clean = email.strip().lower()
    if email_clean in db["users"]:
        return False
    db["users"][email_clean] = {
        "email": email_clean,
        "password_hash": _hash_password(password)
    }
    _save_auth_db(db)
    return True

def authenticate_user(email: str, password: str) -> bool:
    db = _load_auth_db()
    email_clean = email.strip().lower()
    user = db["users"].get(email_clean)
    if not user:
        return False
    return user["password_hash"] == _hash_password(password)

def create_session(email: str) -> str:
    db = _load_auth_db()
    email_clean = email.strip().lower()
    token = secrets.token_hex(32)
    # Expiry 30 days from now
    expiry = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    db["sessions"][token] = {
        "email": email_clean,
        "expiry": expiry
    }
    _save_auth_db(db)
    return token

def get_session(token: str) -> dict | None:
    db = _load_auth_db()
    session = db["sessions"].get(token)
    if not session:
        return None
    
    # Check expiry
    expiry_dt = datetime.fromisoformat(session["expiry"])
    if datetime.now(timezone.utc) > expiry_dt:
        del db["sessions"][token]
        _save_auth_db(db)
        return None
        
    return session

def prolong_session(token: str):
    db = _load_auth_db()
    session = db["sessions"].get(token)
    if session:
        expiry = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
        session["expiry"] = expiry
        _save_auth_db(db)

def delete_session(token: str) -> bool:
    db = _load_auth_db()
    if token in db["sessions"]:
        del db["sessions"][token]
        _save_auth_db(db)
        return True
    return False
