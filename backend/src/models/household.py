"""Household data models"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class HouseholdBase(BaseModel):
    """Base household model"""
    name: str


class HouseholdCreate(HouseholdBase):
    """Household creation model"""
    pass


class HouseholdMember(BaseModel):
    """Household member model"""
    id: str
    name: str
    email: str
    is_admin: bool
    joined_at: datetime


class HouseholdResponse(HouseholdBase):
    """Household response model"""
    id: str
    invite_code: str
    members: List[HouseholdMember]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InviteCodeRequest(BaseModel):
    """Invite code request model"""
    invite_code: str


class RegenerateInviteCodeResponse(BaseModel):
    """Regenerate invite code response"""
    invite_code: str
