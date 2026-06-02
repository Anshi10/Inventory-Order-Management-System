from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, schemas, crud
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Inventory & Order Management System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ──────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok"}


# ── Products ─────────────────────────────────────────────────────────────────
@app.post("/products", response_model=schemas.Product, status_code=201)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db)):
    if crud.get_product_by_sku(db, product.sku):
        raise HTTPException(status_code=400, detail="SKU already exists")
    return crud.create_product(db, product)


@app.get("/products", response_model=List[schemas.Product])
def list_products(db: Session = Depends(get_db)):
    return crud.get_products(db)


@app.get("/products/{product_id}", response_model=schemas.Product)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = crud.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@app.put("/products/{product_id}", response_model=schemas.Product)
def update_product(product_id: int, product: schemas.ProductUpdate, db: Session = Depends(get_db)):
    existing = crud.get_product(db, product_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.sku and product.sku != existing.sku:
        if crud.get_product_by_sku(db, product.sku):
            raise HTTPException(status_code=400, detail="SKU already exists")
    return crud.update_product(db, product_id, product)


@app.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    if not crud.get_product(db, product_id):
        raise HTTPException(status_code=404, detail="Product not found")
    crud.delete_product(db, product_id)


# ── Customers ────────────────────────────────────────────────────────────────
@app.post("/customers", response_model=schemas.Customer, status_code=201)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(get_db)):
    if crud.get_customer_by_email(db, customer.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    return crud.create_customer(db, customer)


@app.get("/customers", response_model=List[schemas.Customer])
def list_customers(db: Session = Depends(get_db)):
    return crud.get_customers(db)


@app.get("/customers/{customer_id}", response_model=schemas.Customer)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = crud.get_customer(db, customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@app.delete("/customers/{customer_id}", status_code=204)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    if not crud.get_customer(db, customer_id):
        raise HTTPException(status_code=404, detail="Customer not found")
    crud.delete_customer(db, customer_id)


# ── Orders ───────────────────────────────────────────────────────────────────
@app.post("/orders", response_model=schemas.Order, status_code=201)
def create_order(order: schemas.OrderCreate, db: Session = Depends(get_db)):
    if not crud.get_customer(db, order.customer_id):
        raise HTTPException(status_code=404, detail="Customer not found")

    total = 0.0
    for item in order.items:
        product = crud.get_product(db, item.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.quantity}, Requested: {item.quantity}"
            )
        total += product.price * item.quantity

    return crud.create_order(db, order, total)


@app.get("/orders", response_model=List[schemas.Order])
def list_orders(db: Session = Depends(get_db)):
    return crud.get_orders(db)


@app.get("/orders/{order_id}", response_model=schemas.Order)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@app.patch("/orders/{order_id}", response_model=schemas.Order)
def update_order_status(order_id: int, payload: dict, db: Session = Depends(get_db)):
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    status = payload.get("status")
    if status not in ["pending", "completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    order.status = status
    db.commit()
    db.refresh(order)
    return order

@app.delete("/orders/{order_id}", status_code=204)
def delete_order(order_id: int, db: Session = Depends(get_db)):
    if not crud.get_order(db, order_id):
        raise HTTPException(status_code=404, detail="Order not found")
    crud.delete_order(db, order_id)


# ── Dashboard stats ───────────────────────────────────────────────────────────
@app.get("/dashboard/stats")
def dashboard_stats(db: Session = Depends(get_db)):
    return crud.get_dashboard_stats(db)
