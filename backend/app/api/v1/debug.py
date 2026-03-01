# backend/app/api/v1/debug.py
"""
Debug endpoints para facilitar el testing de la API.

Estos endpoints son temporales y deben eliminarse en producción.
"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from ...auth.service import get_current_user
from ...database.core import AsyncSession, get_db

router = APIRouter(prefix="/debug", tags=["Debug"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.post("/login-simple")
async def login_simple(username: str, password: str, db: DbSession):
    """
    Login simple para debugging.
    Usa query params en lugar de OAuth2 form.

    Ejemplo: POST /api/v1/debug/login-simple?username=test@example.com&password=Test123456!
    """
    from fastapi.security import OAuth2PasswordRequestForm

    from ...auth.service import login_for_access_token

    # Crear un form_data temporal
    form_data = OAuth2PasswordRequestForm(username=username, password=password)

    try:
        return await login_for_access_token(form_data, db)
    except Exception as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/test-auth")
async def test_auth(current_user=Depends(get_current_user)):
    """
    Test simple de autenticación.
    Muestra que el token está funcionando.

    Requiere: Authorization header con token válido
    """
    return {
        "message": "Autenticación exitosa!",
        "user_id": str(current_user.get_uuid()),
        "token_type": "JWT",
    }


@router.get("/info")
async def get_debug_info():
    """
    Información de debugging sobre la configuración.
    """
    return {
        "message": "API de Debugging",
        "version": "1.0.0",
        "endpoints": [
            {
                "method": "POST",
                "path": "/api/v1/debug/login-simple",
                "description": "Login simple con query params",
                "example": "?username=apitest@example.com&password=Test123456!",
            },
            {
                "method": "GET",
                "path": "/api/v1/debug/test-auth",
                "description": "Test de autenticación (requiere token)",
                "example": "Authorization: Bearer <token>",
            },
        ],
        "credentials": {"email": "apitest@example.com", "password": "Test123456!"},
    }
