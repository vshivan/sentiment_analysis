# ✦ Senti — Sentiment Analysis Dashboard

A full-stack SaaS-style analytics dashboard that analyzes customer sentiment across 8 products using NLP. Supports English + Hindi/Hinglish mixed reviews.

---

## 🗂 Project Structure

```
senti/
├── backend/
│   ├── app.py          # Flask API server
│   ├── sentiment.py    # NLP engine (TextBlob + Hindi heuristics)
│   ├── data_store.py   # In-memory dataset + CRUD
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Overview with charts
│   │   │   ├── ProductPage.jsx   # Per-product reviews + visuals
│   │   │   ├── AdminPanel.jsx    # Add/remove reviews
│   │   │   └── AnalyzePage.jsx   # Live text analyzer
│   │   ├── components/
│   │   │   ├── Layout.jsx        # Sidebar + routing shell
│   │   │   ├── SentimentBadge.jsx
│   │   │   ├── SentimentPieChart.jsx
│   │   │   ├── SentimentBarChart.jsx
│   │   │   ├── TrendChart.jsx
│   │   │   ├── WordCloud.jsx
│   │   │   ├── StatCard.jsx
│   │   │   └── Spinner.jsx
│   │   ├── api.js        # Axios API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
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

# Download NLTK data (one-time)
python -c "import nltk; nltk.download('punkt'); nltk.download('averaged_perceptron_tagger')"

# Start Flask server
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

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List all products |
| GET | `/reviews/<product>` | Reviews + sentiment for a product |
| GET | `/stats` | Aggregate stats for all products |
| GET | `/keywords/<product>` | Word cloud keywords |
| POST | `/analyze` | Analyze a single text `{ "text": "..." }` |
| POST | `/reviews/<product>/add` | Add a review `{ "text": "..." }` |
| DELETE | `/reviews/<product>/<id>` | Delete a review by index |

---

## 🎨 Features

- **Dashboard** — Global stats, bar chart, pie chart, product cards with sentiment bars
- **Product Page** — Per-product pie chart, trend graph, word cloud, filterable/searchable reviews
- **Admin Panel** — Add/delete reviews, live stats refresh
- **Analyze Text** — Real-time sentiment analysis with score gauge and history
- **Sidebar** — Collapsible, product quick-links, active route highlighting
- **Color coding** — 🟢 Positive · 🔴 Negative · 🟡 Neutral

---

## 🧠 Sentiment Engine

- Uses **TextBlob** for English polarity scoring
- Augmented with **Hindi/Hinglish keyword dictionaries** for mixed-language reviews
- Thresholds: score > 0.05 → Positive, < -0.05 → Negative, else Neutral

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18, Vite, React Router, Recharts, Axios |
| Backend | Python 3.10+, Flask, Flask-CORS |
| NLP | TextBlob, NLTK, Pandas |
| Styling | CSS Modules, Inter font |
