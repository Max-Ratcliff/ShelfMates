"""Expense and payment data models

This module defines Pydantic models used by the backend to represent
expense (previously called "split") ledger entries and payments that
settle them. These models are intentionally descriptive and include
fields that help with auditing, rounding, and partial settlements.

Notes:
- Money is stored as integer minor-units (cents) to avoid floating point
  precision issues. The field names use `_cents` suffix to make this
  explicit.
- `entries` contains the canonical per-user breakdown for the expense
  and is the single source of truth for how the total amount is divided.
- `status` is a simple lifecycle flag. For full immutability prefer
  to append reversal entries rather than mutating existing records.
"""
from __future__ import annotations

from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime


class ExpenseEntry(BaseModel):
    """Per-user share inside an expense.

    Fields:
    - user_id: UID of the household member who owes (or is owed) this amount.
    - amount_cents: integer representing the share in minor units (cents).
    - settled_cents: how many cents of this entry have been paid toward
      this share. Starts at 0 and increases as `payments` are applied.
    """
    user_id: str
    amount_cents: int
    settled_cents: int = 0


class ExpenseBase(BaseModel):
    """Common fields for expenses.

    An Expense represents a single financial event. It can be linked to
    an item (item_id) or be an independent household expense (item_id=None).
    """
    household_id: str
    created_by: str  # user who created the expense request
    payer_id: str  # user who paid up front
    total_cents: int
    currency: str = "USD"
    # participants explicitly lists which household members share this expense
    participants: List[str] = Field(default_factory=list)
    # method for splitting: equal | shares | custom | payer
    method: str = "equal"
    # optional weights when method == 'shares'
    shares: Optional[Dict[str, float]] = None
    # optional custom per-user absolute amounts (in cents) when method == 'custom'
    custom_amounts: Optional[Dict[str, int]] = None


class ExpenseCreate(ExpenseBase):
    """Model used when creating an expense. `entries` will be computed by
    backend (or frontend) canonicalization logic and therefore is optional
    on creation requests.
    """
    item_id: Optional[str] = None
    note: Optional[str] = None


class Expense(ExpenseBase):
    """Canonical expense stored in the database.

    `entries` is the expanded per-user breakdown. `processed_at` marks the
    time the ledger was updated (balances adjusted). `status` tracks
    settlement progress.
    """
    id: str
    item_id: Optional[str] = None
    entries: List[ExpenseEntry] = Field(default_factory=list)
    rounding_adjustment_cents: int = 0
    note: Optional[str] = None
    status: str = "open"  # open | partially_settled | settled | cancelled
    created_at: datetime
    processed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PaymentApply(BaseModel):
    """Describes how a payment applies to a particular expense.

    This allows a single payment to cover multiple expenses or multiple
    entries in a single expense. `amount_cents` must be <= the remaining
    unsettled amount for the referenced entry.
    """
    expense_id: str
    user_id: str  # the entry user_id being settled
    amount_cents: int


class PaymentCreate(BaseModel):
    """Client request model to record a payment.

    Fields:
    - from_user: who paid (debited)
    - to_user: who received (credited)
    - total_cents: total amount of the payment
    - applies_to: optional list describing which expense entries this payment
      should be applied against. If omitted the server can apply heuristics.
    """
    household_id: str
    from_user: str
    to_user: str
    total_cents: int
    currency: str = "USD"
    applies_to: Optional[List[PaymentApply]] = None
    note: Optional[str] = None


class Payment(PaymentCreate):
    """Canonical payment record stored in DB with metadata."""
    id: str
    status: str = "completed"  # pending | completed | failed
    created_at: datetime

    class Config:
        from_attributes = True
