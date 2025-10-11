"""Data validation utilities"""
from datetime import date, datetime
from typing import Optional


def is_valid_email(email: str) -> bool:
    """
    Validate email format

    Args:
        email: Email address

    Returns:
        bool: True if valid email format
    """
    # TODO: Implement email validation
    pass


def is_valid_invite_code(code: str) -> bool:
    """
    Validate invite code format

    Args:
        code: Invite code

    Returns:
        bool: True if valid format
    """
    # TODO: Implement invite code validation
    pass


def is_date_expired(expiry_date: Optional[date]) -> bool:
    """
    Check if a date has passed

    Args:
        expiry_date: Date to check

    Returns:
        bool: True if date has passed
    """
    if expiry_date is None:
        return False
    today = date.today()
    return expiry_date < today


def days_until_expiry(expiry_date: Optional[date]) -> Optional[int]:
    """
    Calculate days until expiration

    Args:
        expiry_date: Expiration date

    Returns:
        int: Number of days until expiry (negative if expired)
    """
    if expiry_date is None:
        return None
    today = date.today()
    delta = expiry_date - today
    return delta.days


def is_expiring_soon(expiry_date: Optional[date], threshold_days: int = 3) -> bool:
    """
    Check if date is expiring within threshold

    Args:
        expiry_date: Date to check
        threshold_days: Days threshold (default: 3)

    Returns:
        bool: True if expiring within threshold
    """
    if expiry_date is None:
        return False
    days = days_until_expiry(expiry_date)
    if days is None:
        return False
    return 0 <= days <= threshold_days
