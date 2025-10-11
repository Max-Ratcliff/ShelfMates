"""Authentication middleware"""
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional


security = HTTPBearer()


async def get_current_user_id(credentials: HTTPAuthorizationCredentials) -> str:
    """
    Extract and validate user ID from JWT token

    Args:
        credentials: HTTP authorization credentials

    Returns:
        str: User ID

    Raises:
        HTTPException: If token is invalid
    """
    # TODO: Implement get current user ID
    pass


async def verify_household_access(user_id: str, household_id: str) -> bool:
    """
    Verify user has access to household

    Args:
        user_id: User ID
        household_id: Household ID

    Returns:
        bool: True if user has access

    Raises:
        HTTPException: If access denied
    """
    # TODO: Implement verify household access
    pass


async def verify_admin_access(user_id: str, household_id: str) -> bool:
    """
    Verify user is admin of household

    Args:
        user_id: User ID
        household_id: Household ID

    Returns:
        bool: True if user is admin

    Raises:
        HTTPException: If not admin
    """
    # TODO: Implement verify admin access
    pass
