import logging
from typing import List
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..auth.service import get_password_hash, verify_password
from ..entities.user import User
from ..exceptions import InvalidPasswordError, PasswordMismatchError, UserNotFoundError
from ..users import model


async def get_all_users(db: AsyncSession) -> List[model.UserResponse]:
    """Get all registered users (for admin/debug purposes)"""
    result = await db.execute(select(User))
    users = result.scalars().all()
    logging.info(f"Retrieved {len(users)} users")
    return [
        model.UserResponse.model_validate(user, from_attributes=True) for user in users
    ]


async def get_user_by_id(db: AsyncSession, user_id: UUID) -> model.UserResponse:
    result = await db.execute(select(User).filter(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        logging.warning(f"User not found with ID: {user_id}")
        raise UserNotFoundError(user_id)
    logging.info(f"Successfully retrieved user with ID: {user_id}")
    return model.UserResponse.model_validate(user, from_attributes=True)


async def change_password(
    db: AsyncSession, user_id: UUID, password_change: model.PasswordChange
) -> None:
    try:
        user_response = await get_user_by_id(db, user_id)

        # Get the actual User entity from the database
        result = await db.execute(select(User).filter(User.id == user_id))
        user = result.scalar_one_or_none()

        # Verify current password
        if not verify_password(password_change.current_password, user.password_hash):
            logging.warning(f"Invalid current password provided for user ID: {user_id}")
            raise InvalidPasswordError()

        # Verify new passwords match
        if password_change.new_password != password_change.new_password_confirm:
            logging.warning(
                f"Password mismatch during change attempt for user ID: {user_id}"
            )
            raise PasswordMismatchError()

        # Update password
        user.password_hash = get_password_hash(password_change.new_password)
        await db.commit()
        logging.info(f"Successfully changed password for user ID: {user_id}")
    except Exception as e:
        logging.error(
            f"Error during password change for user ID: {user_id}. Error: {str(e)}"
        )
        raise
