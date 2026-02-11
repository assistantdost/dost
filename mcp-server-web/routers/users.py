from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db
from crud.users import CRUDUser
from schemas.users import User, UserCreate, UserUpdate
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
            "role": user["role"]
        }
    }


# @handle_route_exception
# async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
#     db_user = await CRUDUser.get_user_by_email(db, user.email)
#     if db_user:
#         raise HTTPException(status_code=400, detail="Email already registered")
#     return await CRUDUser.create_user(db, user)


# @router.get("/{user_id}", response_model=User)
# @handle_route_exception
# async def read_user(user_id: int, db: AsyncSession = Depends(get_db)):
#     db_user = await CRUDUser.get_user_by_id(db, user_id)
#     if db_user is None:
#         raise HTTPException(status_code=404, detail="User not found")
#     return db_user


# @router.put("/{user_id}", response_model=User)
# @handle_route_exception
# async def update_user(user_id: int, user_update: UserUpdate, db: AsyncSession = Depends(get_db)):
#     db_user = await CRUDUser.update_user(db, user_id, user_update)
#     if db_user is None:
#         raise HTTPException(status_code=404, detail="User not found")
#     return db_user


# @router.delete("/{user_id}")
# @handle_route_exception
# async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
#     success = await CRUDUser.delete_user(db, user_id)
#     if not success:
#         raise HTTPException(status_code=404, detail="User not found")
#     return {"message": "User deleted successfully"}
# Note: The above CRUD routes are commented out. They can be enabled as needed.
