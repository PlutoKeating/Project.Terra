from typing import Optional
from fastapi import APIRouter, HTTPException, Response, Request, Depends, Security
from pydantic import BaseModel
from terra_engine.services import auth_service
from terra_engine.api.dependencies import get_current_user, session_cookie_sec

router = APIRouter(prefix="/auth", tags=["auth"])

class UserRegisterBody(BaseModel):
    email: str
    password: str

class UserLoginBody(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(body: UserRegisterBody):
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    if not auth_service.register_user(body.email, body.password):
        raise HTTPException(status_code=400, detail="Email is already registered")
    return {"status": "registered"}

@router.post("/login")
def login(body: UserLoginBody, response: Response):
    if not auth_service.authenticate_user(body.email, body.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create 30-day session
    token = auth_service.create_session(body.email)
    
    # Set 30-day session cookie
    response.set_cookie(
        key="terra_session",
        value=token,
        max_age=30 * 24 * 3600,
        httponly=True,
        samesite="lax",
        secure=False,
    )
    return {"email": body.email, "role": "Architect"}

@router.post("/logout")
def logout(response: Response, session_token: str | None = Security(session_cookie_sec)):
    if session_token:
        auth_service.delete_session(session_token)
    response.delete_cookie("terra_session")
    return {"status": "logged_out"}

@router.get("/me")
def me(current_user: str = Depends(get_current_user)):
    return {"email": current_user, "role": "Architect"}
