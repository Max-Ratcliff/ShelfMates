"""Error handling middleware"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from typing import Callable


async def error_handler_middleware(request: Request, call_next: Callable):
    """
    Global error handling middleware

    Args:
        request: FastAPI request
        call_next: Next middleware/route handler

    Returns:
        Response with error handling
    """
    # TODO: Implement error handling middleware
    pass


class APIError(Exception):
    """Base API error"""
    def __init__(self, message: str, status_code: int = status.HTTP_400_BAD_REQUEST):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class NotFoundError(APIError):
    """Resource not found error"""
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status.HTTP_404_NOT_FOUND)


class UnauthorizedError(APIError):
    """Unauthorized access error"""
    def __init__(self, message: str = "Unauthorized"):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED)


class ForbiddenError(APIError):
    """Forbidden access error"""
    def __init__(self, message: str = "Forbidden"):
        super().__init__(message, status.HTTP_403_FORBIDDEN)
