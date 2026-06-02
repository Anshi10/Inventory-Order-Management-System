from pydantic import BaseModel, EmailStr, field_validator
from typing import List, Optional
from datetime import datetime


# ── Product ──────────────────────────────────────────────────────────────────
class ProductBase(BaseModel):
    name: str
    sku: str
    price: float
    quantity: int
    description: Optional[str] = None

    @field_validator("price")
    @classmethod
    def price_positive(cls, v):
        if v < 0:
            raise ValueError("Price must be non-negative")
        return v

    @field_validator("quantity")
    @classmethod
    def quantity_non_negative(cls, v):
        if v < 0:
            raise ValueError("Quantity cannot be negative")
        return v


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None
    description: Optional[str] = None

    @field_validator("price")
    @classmethod
    def price_positive(cls, v):
        if v is not None and v < 0:
            raise ValueError("Price must be non-negative")
        return v

    @field_validator("quantity")
    @classmethod
    def quantity_non_negative(cls, v):
        if v is not None and v < 0:
            raise ValueError("Quantity cannot be negative")
        return v


class Product(ProductBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Customer ─────────────────────────────────────────────────────────────────
class CustomerBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class Customer(CustomerBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ── Order ─────────────────────────────────────────────────────────────────────
class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be positive")
        return v


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    unit_price: float
    product: Optional[Product] = None

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemCreate]


class Order(BaseModel):
    id: int
    customer_id: int
    total_amount: float
    status: str
    created_at: datetime
    customer: Optional[Customer] = None
    items: List[OrderItemOut] = []

    class Config:
        from_attributes = True
