from fastapi import Request, Response, HTTPException, Security
from fastapi.security import APIKeyCookie
from terra_engine.services import auth_service

session_cookie_sec = APIKeyCookie(name="terra_session", auto_error=False)

def get_current_user(request: Request, response: Response, session_token: str | None = Security(session_cookie_sec)):
    if not session_token:
        raise HTTPException(status_code=401, detail="Missing session cookie")
    session = auth_service.get_session(session_token)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
        
    # Prolong in database
    auth_service.prolong_session(session_token)
    
    # Renew cookie to 30 days in client headers
    response.set_cookie(
        key="terra_session",
        value=session_token,
        max_age=30 * 24 * 3600,
        httponly=True,
        samesite="lax",
        secure=False,  # False for local HTTP development compatibility
    )
    return session["email"]
