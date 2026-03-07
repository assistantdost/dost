from fastapi import APIRouter, Depends
from middleware.decorators import handle_route_exception
from middleware.helper import protected_route_cache_user

router = APIRouter()


@router.get("/me")
@handle_route_exception
async def get_current_user(user=Depends(protected_route_cache_user)):
    return {
        "message": "User info retrieved successfully",
        "user": {
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        },
    }