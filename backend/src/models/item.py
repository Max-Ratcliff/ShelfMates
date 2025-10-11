"""Food item data models"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class ItemBase(BaseModel):
    """Base item model"""
    name: str
    quantity: int
    expiry_date: date
    is_communal: bool


class ItemCreate(ItemBase):
    """Item creation model"""
    pass


class ItemUpdate(BaseModel):
    """Item update model"""
    name: Optional[str] = None
    quantity: Optional[int] = None
    expiry_date: Optional[date] = None
    is_communal: Optional[bool] = None


class ItemResponse(ItemBase):
    """Item response model"""
    id: str
    household_id: str
    owner_id: Optional[str] = None
    owner_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ItemFilter(BaseModel):
    """Item filter model"""
    is_communal: Optional[bool] = None
    owner_id: Optional[str] = None
    expiring_soon: Optional[bool] = None  # Within 3 days
    expired: Optional[bool] = None
