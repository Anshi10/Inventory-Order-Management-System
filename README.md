# 📦 Inventory & Order Management System

A full-stack, production-ready Inventory & Order Management System built with **FastAPI**, **React**, **PostgreSQL**, and fully containerized with **Docker**.

---

## 🏗️ Architecture

```
inventory-system/
├── backend/               # FastAPI Python API
│   ├── main.py            # Routes & app entry point
│   ├── models.py          # SQLAlchemy ORM models
│   ├── schemas.py         # Pydantic request/response schemas
│   ├── crud.py            # Database operations
│   ├── database.py        # DB connection & session
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/              # React SPA
│   ├── src/
│   │   ├── api/index.js   # Axios API client
│   │   ├── pages/         # Dashboard, Products, Customers, Orders
│   │   ├── App.js         # Router + sidebar layout
│   │   └── App.css        # All styles (responsive)
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## ✅ Features Implemented

### Business Logic
- ✅ Unique product SKUs enforced (DB + API)
- ✅ Unique customer emails enforced
- ✅ Inventory validation before order placement
- ✅ Stock automatically reduced when an order is created
- ✅ Stock restored when an order is cancelled/deleted
- ✅ Order total calculated automatically by the backend
- ✅ Quantity cannot be negative

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| POST | /products | Create product |
| GET | /products | List all products |
| GET | /products/{id} | Get product by ID |
| PUT | /products/{id} | Update product |
| DELETE | /products/{id} | Delete product |
| POST | /customers | Create customer |
| GET | /customers | List all customers |
| GET | /customers/{id} | Get customer by ID |
| DELETE | /customers/{id} | Delete customer |
| POST | /orders | Create order |
| GET | /orders | List all orders |
| GET | /orders/{id} | Get order by ID |
| DELETE | /orders/{id} | Cancel order |
| GET | /dashboard/stats | Dashboard statistics |

### Frontend Pages
- **Dashboard** — stats cards (products, customers, orders, revenue) + low-stock alerts
- **Products** — CRUD table with inline edit modal, color-coded stock badges
- **Customers** — list + add modal with email validation
- **Orders** — create multi-item orders, expandable line-item detail, cancel with stock restore

---

## 🚀 Quick Start (Docker)

### 1. Clone & configure
```bash
git clone <repo-url>
cd inventory-system
cp .env.example .env
# Edit .env if you want custom credentials
```

### 2. Run with Docker Compose
```bash
docker-compose up --build
```

- **Frontend** → http://localhost:3000
- **Backend API** → http://localhost:8000
- **API Docs** → http://localhost:8000/docs

---

## 🖥️ Local Development (without Docker)

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/inventory_db
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
REACT_APP_API_URL=http://localhost:8000 npm start
```

---

## 🐳 Docker Hub

Pull the backend image:
```bash
docker pull <your-dockerhub-username>/inventory-backend:latest
```

Push your own:
```bash
docker build -t <your-dockerhub-username>/inventory-backend:latest ./backend
docker push <your-dockerhub-username>/inventory-backend:latest
```

---

## ☁️ Deployment

### Backend → Render / Railway / Fly.io

**Render (recommended):**
1. Connect GitHub repo, choose `backend/` as root
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add env var: `DATABASE_URL` = your PostgreSQL connection string

**Fly.io:**
```bash
cd backend
fly launch
fly secrets set DATABASE_URL="postgresql://..."
fly deploy
```

### Frontend → Vercel / Netlify

**Vercel (recommended):**
1. Import GitHub repo, set root to `frontend/`
2. Build command: `npm run build`
3. Output directory: `build`
4. Add env var: `REACT_APP_API_URL` = your backend public URL

**Netlify:**
- Same settings; add `_redirects` file: `/* /index.html 200`

---

## 🔑 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@db:5432/inventory_db` |
| `POSTGRES_DB` | Database name | `inventory_db` |
| `POSTGRES_USER` | DB user | `postgres` |
| `POSTGRES_PASSWORD` | DB password | `postgres` |
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:8000` |

---

## 📋 Submission Checklist

- [ ] GitHub repository URL
- [ ] Docker Hub image URL (`docker pull ...`)
- [ ] Live frontend URL (Vercel/Netlify)
- [ ] Live backend API URL (Render/Railway/Fly.io)
