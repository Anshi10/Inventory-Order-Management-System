from sqlalchemy.orm import Session
from sqlalchemy import func
import models, schemas


# ── Products ─────────────────────────────────────────────────────────────────
def get_product(db: Session, product_id: int):
    return db.query(models.Product).filter(models.Product.id == product_id).first()


def get_product_by_sku(db: Session, sku: str):
    return db.query(models.Product).filter(models.Product.sku == sku).first()


def get_products(db: Session):
    return db.query(models.Product).all()


def create_product(db: Session, product: schemas.ProductCreate):
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def update_product(db: Session, product_id: int, product: schemas.ProductUpdate):
    db_product = get_product(db, product_id)
    update_data = product.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)
    db.commit()
    db.refresh(db_product)
    return db_product


def delete_product(db: Session, product_id: int):
    db_product = get_product(db, product_id)
    db.delete(db_product)
    db.commit()


# ── Customers ─────────────────────────────────────────────────────────────────
def get_customer(db: Session, customer_id: int):
    return db.query(models.Customer).filter(models.Customer.id == customer_id).first()


def get_customer_by_email(db: Session, email: str):
    return db.query(models.Customer).filter(models.Customer.email == email).first()


def get_customers(db: Session):
    return db.query(models.Customer).all()


def create_customer(db: Session, customer: schemas.CustomerCreate):
    db_customer = models.Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


def delete_customer(db: Session, customer_id: int):
    db_customer = get_customer(db, customer_id)
    db.delete(db_customer)
    db.commit()


# ── Orders ────────────────────────────────────────────────────────────────────
def get_order(db: Session, order_id: int):
    return db.query(models.Order).filter(models.Order.id == order_id).first()


def get_orders(db: Session):
    return db.query(models.Order).all()


def create_order(db: Session, order: schemas.OrderCreate, total: float):
    db_order = models.Order(
        customer_id=order.customer_id,
        total_amount=total,
        status="pending",
    )
    db.add(db_order)
    db.flush()  # get order id before adding items

    for item in order.items:
        product = get_product(db, item.product_id)
        db_item = models.OrderItem(
            order_id=db_order.id,
            product_id=item.product_id,
            quantity=item.quantity,
            unit_price=product.price,
        )
        db.add(db_item)
        # Reduce stock
        product.quantity -= item.quantity

    db.commit()
    db.refresh(db_order)
    return db_order


def delete_order(db: Session, order_id: int):
    db_order = get_order(db, order_id)
    # Restore stock
    for item in db_order.items:
        item.product.quantity += item.quantity
    db.delete(db_order)
    db.commit()


# ── Dashboard ─────────────────────────────────────────────────────────────────
def get_dashboard_stats(db: Session):
    total_products = db.query(func.count(models.Product.id)).scalar()
    total_customers = db.query(func.count(models.Customer.id)).scalar()
    total_orders = db.query(func.count(models.Order.id)).scalar()
    total_revenue = db.query(func.sum(models.Order.total_amount)).scalar() or 0.0
    low_stock = db.query(models.Product).filter(models.Product.quantity <= 5).all()

    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "total_revenue": round(total_revenue, 2),
        "low_stock_products": [
            {"id": p.id, "name": p.name, "sku": p.sku, "quantity": p.quantity}
            for p in low_stock
        ],
    }
