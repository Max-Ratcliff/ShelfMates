"""Household routes"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from ..models.household import (
    HouseholdCreate,
    HouseholdResponse,
    HouseholdMember,
    InviteCodeRequest,
    RegenerateInviteCodeResponse
)
from ..services import household_service


router = APIRouter(prefix="/households", tags=["Households"])


@router.post("", response_model=HouseholdResponse, status_code=status.HTTP_201_CREATED)
async def create_household(household_data: HouseholdCreate):
    """Create a new household"""
    # TODO: Implement create household endpoint
    pass


@router.get("/{household_id}", response_model=HouseholdResponse)
async def get_household(household_id: str):
    """Get household details"""
    # TODO: Implement get household endpoint
    pass


@router.post("/join", response_model=HouseholdResponse)
async def join_household(invite_data: InviteCodeRequest):
    """Join a household using invite code"""
    # TODO: Implement join household endpoint
    pass


@router.post("/{household_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_household(household_id: str):
    """Leave a household"""
    # TODO: Implement leave household endpoint
    pass


@router.post("/{household_id}/regenerate-code", response_model=RegenerateInviteCodeResponse)
async def regenerate_invite_code(household_id: str):
    """Regenerate household invite code (admin only)"""
    # TODO: Implement regenerate invite code endpoint
    pass


@router.get("/{household_id}/members", response_model=List[HouseholdMember])
async def get_household_members(household_id: str):
    """Get all household members"""
    # TODO: Implement get household members endpoint
    pass


@router.delete("/{household_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(household_id: str, member_id: str):
    """Remove a member from household (admin only)"""
    # TODO: Implement remove member endpoint
    pass
