# ✦ Sentilytics — Multimodal Sentiment Analysis Dashboard

A production-grade, full-stack SaaS analytics platform for customer sentiment analysis across products. Supports **English**, **Hindi**, and **Hinglish** mixed-language reviews, real-time emotion detection via webcam, image sentiment, review scraping, and advanced RBAC-based access control.

---

## 🗂 Project Structure

```
sentiment_analysis/
├── backend/
│   ├── app.py              # Flask API server (auth, CRUD, analytics, export)
│   ├── sentiment.py        # NLP engine (TextBlob + Hindi/Hinglish heuristics + image sentiment)
│   ├── scraper.py          # Web scraper for product reviews
│   ├── models.py           # SQLAlchemy model definitions (standalone reference)
│   ├── auth.py             # Auth utility helpers
│   ├── data_store.py       # Seed data constants
│   ├── test_api.py         # Pytest API integration tests
│   ├── test_sentiment.py   # Pytest NLP unit tests
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx         # Overview: stats, bar/pie charts, product cards
│   │   │   ├── ProductPage.jsx       # Per-product reviews, trend, word cloud
│   │   │   ├── AdminPanel.jsx        # User management (admin only)
│   │   │   ├── AnalyzePage.jsx       # Live text + image analyzer with AI explanation
│   │   │   ├── ScrapePage.jsx        # Scrape reviews from URLs
│   │   │   ├── ComparePage.jsx       # Side-by-side product comparison
│   │   │   ├── LeaderboardPage.jsx   # Products ranked by positive sentiment
│   │   │   ├── AlertsPage.jsx        # High-negative-sentiment product alerts
│   │   │   ├── ImportPage.jsx        # Bulk review import (JSON)
│   │   │   ├── SearchPage.jsx        # Global full-text review search
│   │   │   ├── AuditPage.jsx         # Admin audit log viewer
│   │   │   ├── CameraPage.jsx        # Real-time face emotion detection (face-api.js)
│   │   │   └── LoginPage.jsx         # JWT login screen
│   │   ├── components/
│   │   │   ├── Layout.jsx            # Sidebar + routing shell + notifications
│   │   │   ├── SentimentBadge.jsx
│   │   │   ├── SentimentPieChart.jsx
│   │   │   ├── SentimentBarChart.jsx
│   │   │   ├── TrendChart.jsx
│   │   │   ├── WordCloud.jsx
│   │   │   ├── StatCard.jsx
│   │   │   └── Spinner.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # JWT auth context + protected routes
│   │   ├── api.js                    # Axios API client (JWT headers, interceptors)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── sentilytics-icon.svg          # Sentilytics brand SVG logo
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── vitest.config.js
└── README.md
```

---

## ⚡ Quick Start

### 1. Backend (Python / Flask)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy and fill in environment variables
cp .env.example .env
# Edit .env — set SECRET_KEY, JWT_SECRET_KEY, ADMIN_USERNAME, ADMIN_EMAIL, ADMIN_PASSWORD

# Start Flask server (auto-creates & seeds the SQLite database on first run)
python app.py
```

Backend runs at: **http://localhost:5000**

---

### 2. Frontend (React + Vite)

```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend runs at: **http://localhost:3000**

---

### 3. Login

Use the credentials you set in `ADMIN_USERNAME` / `ADMIN_PASSWORD` in your `.env` file.
No default credentials are seeded — you must configure them via environment variables.

---

## 🚀 Deploying to Render

The repo includes a `render.yaml` for one-click deployment.

1. Push the repo to GitHub.
2. Go to [render.com](https://render.com) → New → Blueprint → connect your repo.
3. Render will create the backend (Flask), frontend (static), and PostgreSQL database automatically.
4. In the Render dashboard, set these environment variables on the **backend** service:
   - `ADMIN_USERNAME` — your admin username
   - `ADMIN_EMAIL` — your admin email
   - `ADMIN_PASSWORD` — a strong password
   - `FRONTEND_URL` — your frontend's Render URL (e.g. `https://sentilytics-frontend.onrender.com`)
5. On the **frontend** service, set:
   - `VITE_API_URL` — your backend's Render URL (e.g. `https://sentilytics-backend.onrender.com`)
6. Trigger a redeploy on both services.

### Manual deployment (any PaaS)

**Backend:**
```bash
# Required env vars
SECRET_KEY=<long-random-string>
JWT_SECRET_KEY=<another-long-random-string>
DATABASE_URL=postgresql://user:pass@host:5432/dbname
ADMIN_USERNAME=youradmin
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<strong-password>
FRONTEND_URL=https://your-frontend-domain.com

# Start command
gunicorn app:app --workers 4 --bind 0.0.0.0:$PORT --timeout 120
```

**Frontend:**
```bash
# Build
VITE_API_URL=https://your-backend-domain.com npm run build
# Serve the dist/ folder as static files
```

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login → returns JWT token |
| GET  | `/auth/me` | Get current user profile |
| POST | `/auth/register` | Create user *(admin only)* |
| GET  | `/auth/users` | List all users *(admin only)* |
| PATCH | `/auth/users/<id>` | Update role / active status *(admin only)* |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/products` | List active products |
| POST   | `/products` | Create product *(admin/analyst)* |
| DELETE | `/products/<id>` | Deactivate product *(admin only)* |

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/reviews/<product>` | Paginated reviews (filter, search, sort) |
| POST   | `/reviews/<product>/add` | Add review *(admin/analyst)* |
| PATCH  | `/reviews/<product>/<id>` | Edit review / tags *(admin/analyst)* |
| DELETE | `/reviews/<product>/<id>` | Delete review *(admin/analyst)* |

### Analytics & Export
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET  | `/stats` | Aggregate sentiment stats for all products |
| GET  | `/keywords/<product>` | Word cloud keywords |
| GET  | `/leaderboard` | Products ranked by positive sentiment % |
| GET  | `/alerts` | Products with high negative sentiment |
| GET  | `/compare?products=A,B` | Side-by-side product comparison |
| GET  | `/search?q=<term>` | Global full-text review search |
| GET  | `/export/<product>/csv` | Export reviews as CSV |
| GET  | `/export/<product>/json` | Export reviews as JSON |
| GET  | `/export/<product>/xlsx` | Export reviews as Excel (styled) |
| GET  | `/export/all/csv` | Export all product reviews as CSV |

### Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analyze` | Analyze text `{ "text": "..." }` → sentiment + explanation |
| POST | `/analyze-image` | Analyze image file → sentiment score |
| POST | `/scrape` | Scrape reviews from a product URL |
| POST | `/import/<product>` | Bulk import reviews `{ "reviews": [...] }` |

### Emotion Detection
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/emotion-log` | Log detected webcam emotion to database |
| GET  | `/emotion-stats` | Emotion frequency stats for current user |

### Audit & Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET   | `/audit` | View audit logs *(admin only, paginated)* |
| GET   | `/notifications` | Get user notifications |
| PATCH | `/notifications/<id>/read` | Mark one notification read |
| PATCH | `/notifications/read-all` | Mark all notifications read |

---

## 🎨 Features

- **Dashboard** — Global stats, bar/pie charts, product cards with sentiment bars
- **Product Page** — Per-product pie chart, trend graph, word cloud, paginated/filterable reviews with sort (newest, oldest, score)
- **Analyze Text** — Real-time sentiment with polarity score gauge, AI-driven explanation, history log
- **Analyze Image** — Upload an image to get sentiment (Pillow-based heuristic model)
- **Live Camera** — Webcam emotion detection using **face-api.js** (client-side, no server round-trip); logs every detection to SQLite
- **Scraper** — Paste any product review page URL and extract + analyze reviews instantly
- **Leaderboard** — Ranks all products by positive sentiment %, shows top/worst review per product
- **Alerts** — Flags products exceeding a configurable negative sentiment threshold with severity levels
- **Compare** — Select 2+ products for a visual side-by-side sentiment breakdown
- **Import** — Bulk upload reviews as JSON array
- **Global Search** — Full-text search across all products and reviews
- **Admin Panel** — Create/deactivate users, assign roles (admin / analyst / viewer)
- **Audit Log** — Immutable log of every create / update / delete / export / scrape action
- **Notifications** — Auto-alerts fired when a product's negative ratio hits ≥ 40%
- **RBAC** — Role-based access control enforced on every sensitive endpoint
- **Rate Limiting** — 500 req/hr, 100 req/min global; 10 req/min on login & scrape
- **Export** — Per-product CSV, JSON, and styled XLSX; all-products CSV

---

## 🧠 Sentiment Engine

- **TextBlob** for English polarity scoring (range −1.0 → +1.0)
- Augmented with **Hindi/Hinglish keyword dictionaries** for mixed-language detection
- Language auto-detected as `english`, `hinglish`, or `hindi`
- Thresholds: score > 0.05 → **Positive** · < −0.05 → **Negative** · else → **Neutral**
- `/analyze` endpoint additionally returns a human-readable **explanation** of the result
- Image sentiment via **Pillow** (brightness / color-histogram heuristic)

---

## 🎭 Real-Time Emotion Detection

The **Live Camera** page uses **face-api.js** loaded entirely in the browser:
- Detects 7 emotions: `happy`, `sad`, `angry`, `disgusted`, `fearful`, `surprised`, `neutral`
- Overlays bounding boxes and confidence bars on the video feed
- Logs each detection to the backend (`/emotion-log`) for session-level statistics
- `/emotion-stats` returns per-emotion counts, percentages, avg confidence, and a 60-point timeline

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, React Router v6, Recharts, Axios, face-api.js |
| Auth | JWT (flask-jwt-extended), AuthContext, protected routes |
| Backend | Python 3.10+, Flask 3, Flask-CORS, Flask-Limiter |
| Database | SQLite via Flask-SQLAlchemy (auto-created on startup) |
| NLP | TextBlob, NLTK, Pandas |
| Image | Pillow |
| Scraping | Requests, BeautifulSoup4, Fake-UserAgent |
| Export | openpyxl (XLSX), csv (CSV), json |
| Testing | Pytest, pytest-flask |
| Styling | CSS Modules, Inter font |

---

## 🧪 Running Tests

```bash
cd backend

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest test_api.py
pytest test_sentiment.py
```

---

## 🗄 Database

SQLite database (`senti.db`) is automatically created and seeded with 8 products and sample bilingual reviews on first run. Tables:

| Table | Description |
|-------|-------------|
| `users` | User accounts with roles and login tracking |
| `products` | Product catalog (soft-delete via `is_active`) |
| `reviews` | Review text, sentiment, score, language, source, tags |
| `audit_logs` | Immutable action log (user, action, resource, IP) |
| `notifications` | In-app alerts for admin events |
| `emotion_logs` | Webcam emotion detection history per user |

---

## 🌐 Products Seeded by Default

| Product | Category | Icon |
|---------|----------|------|
| Adidas | Footwear | 👟 |
| Zara | Fashion | 👗 |
| Dell | Electronics | 💻 |
| Supra | Footwear | 👠 |
| iPhone | Electronics | 📱 |
| Lenskart | Eyewear | 👓 |
| Lloyd AC | Appliances | ❄️ |
| Titan Watch | Accessories | ⌚ |
