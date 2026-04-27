"""
Senti - Sentiment Analysis Dashboard
Flask Backend API
"""

from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from sentiment import analyze_sentiment, get_sentiment_stats, extract_keywords
from data_store import get_all_products, get_reviews, add_review, remove_review
from scraper import scrape_reviews
import csv, io, json

app = Flask(__name__)
CORS(app)


# ─────────────────────────────────────────────
# GET /products  →  list of all product names
# ─────────────────────────────────────────────
@app.route("/products", methods=["GET"])
def products():
    return jsonify({"products": get_all_products()})


# ─────────────────────────────────────────────
# GET /reviews/<product>  →  reviews + sentiment
# ─────────────────────────────────────────────
@app.route("/reviews/<product>", methods=["GET"])
def reviews(product):
    reviews_list = get_reviews(product)
    if reviews_list is None:
        return jsonify({"error": "Product not found"}), 404

    enriched = []
    for idx, text in enumerate(reviews_list):
        sentiment, score = analyze_sentiment(text)
        enriched.append({
            "id": idx,
            "text": text,
            "sentiment": sentiment,
            "score": round(score, 4)
        })

    return jsonify({"product": product, "reviews": enriched})


# ─────────────────────────────────────────────
# POST /analyze  →  analyze a single text
# Body: { "text": "..." }
# ─────────────────────────────────────────────
@app.route("/analyze", methods=["POST"])
def analyze():
    body = request.get_json()
    if not body or "text" not in body:
        return jsonify({"error": "Missing 'text' field"}), 400

    text = body["text"]
    sentiment, score = analyze_sentiment(text)
    return jsonify({"text": text, "sentiment": sentiment, "score": round(score, 4)})


# ─────────────────────────────────────────────
# GET /stats  →  aggregate stats for all products
# ─────────────────────────────────────────────
@app.route("/stats", methods=["GET"])
def stats():
    all_stats = {}
    total_reviews = 0
    overall = {"Positive": 0, "Negative": 0, "Neutral": 0}

    for product in get_all_products():
        reviews_list = get_reviews(product)
        product_stats = get_sentiment_stats(reviews_list)
        all_stats[product] = product_stats
        total_reviews += product_stats["total"]
        for key in overall:
            overall[key] += product_stats[key]

    return jsonify({
        "total_reviews": total_reviews,
        "overall_sentiment": overall,
        "product_stats": all_stats
    })


# ─────────────────────────────────────────────
# POST /reviews/<product>/add  →  add a review
# Body: { "text": "..." }
# ─────────────────────────────────────────────
@app.route("/reviews/<product>/add", methods=["POST"])
def add_review_route(product):
    body = request.get_json()
    if not body or "text" not in body:
        return jsonify({"error": "Missing 'text' field"}), 400

    success = add_review(product, body["text"])
    if not success:
        return jsonify({"error": "Product not found"}), 404

    return jsonify({"message": "Review added successfully"})


# ─────────────────────────────────────────────
# DELETE /reviews/<product>/<int:review_id>  →  remove a review
# ─────────────────────────────────────────────
@app.route("/reviews/<product>/<int:review_id>", methods=["DELETE"])
def remove_review_route(product, review_id):
    success = remove_review(product, review_id)
    if not success:
        return jsonify({"error": "Review not found"}), 404

    return jsonify({"message": "Review removed successfully"})


# ─────────────────────────────────────────────
# GET /keywords/<product>  →  word cloud data
# ─────────────────────────────────────────────
@app.route("/keywords/<product>", methods=["GET"])
def keywords(product):
    reviews_list = get_reviews(product)
    if reviews_list is None:
        return jsonify({"error": "Product not found"}), 404

    words = extract_keywords(reviews_list)
    return jsonify({"product": product, "keywords": words})


# ─────────────────────────────────────────────
# GET /export/<product>/csv  →  download reviews as CSV
# GET /export/<product>/json →  download reviews as JSON
# ─────────────────────────────────────────────
@app.route("/export/<product>/<fmt>", methods=["GET"])
def export_reviews(product, fmt):
    reviews_list = get_reviews(product)
    if reviews_list is None:
        return jsonify({"error": "Product not found"}), 404

    enriched = []
    for idx, text in enumerate(reviews_list):
        sentiment, score = analyze_sentiment(text)
        enriched.append({
            "id": idx + 1,
            "product": product,
            "review": text,
            "sentiment": sentiment,
            "score": round(score, 4)
        })

    if fmt == "csv":
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=["id", "product", "review", "sentiment", "score"])
        writer.writeheader()
        writer.writerows(enriched)
        csv_data = output.getvalue()
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment; filename={product}_reviews.csv"}
        )

    elif fmt == "json":
        json_data = json.dumps({"product": product, "reviews": enriched}, indent=2, ensure_ascii=False)
        return Response(
            json_data,
            mimetype="application/json",
            headers={"Content-Disposition": f"attachment; filename={product}_reviews.json"}
        )

    return jsonify({"error": "Format must be csv or json"}), 400


# ─────────────────────────────────────────────
# GET /export/all/csv  →  export ALL products as CSV
# ─────────────────────────────────────────────
@app.route("/export/all/csv", methods=["GET"])
def export_all_csv():
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["id", "product", "review", "sentiment", "score"])
    writer.writeheader()
    for product in get_all_products():
        for idx, text in enumerate(get_reviews(product)):
            sentiment, score = analyze_sentiment(text)
            writer.writerow({
                "id": idx + 1,
                "product": product,
                "review": text,
                "sentiment": sentiment,
                "score": round(score, 4)
            })
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": "attachment; filename=senti_all_reviews.csv"}
    )


# ─────────────────────────────────────────────
# GET /compare?products=iPhone,Dell  →  side-by-side stats
# ─────────────────────────────────────────────
@app.route("/compare", methods=["GET"])
def compare():
    names = request.args.get("products", "")
    product_list = [p.strip() for p in names.split(",") if p.strip()]

    if len(product_list) < 2:
        return jsonify({"error": "Provide at least 2 products"}), 400

    result = {}
    for product in product_list:
        reviews_list = get_reviews(product)
        if reviews_list is None:
            return jsonify({"error": f"Product '{product}' not found"}), 404

        stats = get_sentiment_stats(reviews_list)
        enriched = []
        for idx, text in enumerate(reviews_list):
            sentiment, score = analyze_sentiment(text)
            enriched.append({"id": idx, "text": text, "sentiment": sentiment, "score": round(score, 4)})

        result[product] = {
            "stats": stats,
            "reviews": enriched,
            "keywords": extract_keywords(reviews_list, top_n=15)
        }

    return jsonify({"comparison": result})


# ─────────────────────────────────────────────
# GET /leaderboard  →  ranked products by positive %
# ─────────────────────────────────────────────
@app.route("/leaderboard", methods=["GET"])
def leaderboard():
    board = []
    for product in get_all_products():
        reviews_list = get_reviews(product)
        s = get_sentiment_stats(reviews_list)
        enriched = []
        for idx, text in enumerate(reviews_list):
            sentiment, score = analyze_sentiment(text)
            enriched.append({"id": idx, "text": text, "sentiment": sentiment, "score": round(score, 4)})
        board.append({
            "product": product,
            "total": s["total"],
            "positive": s["Positive"],
            "negative": s["Negative"],
            "neutral": s["Neutral"],
            "positive_pct": s["positive_pct"],
            "negative_pct": s["negative_pct"],
            "neutral_pct": s["neutral_pct"],
            "avg_score": s["avg_score"],
            "top_review": max(enriched, key=lambda r: r["score"])["text"] if enriched else "",
            "worst_review": min(enriched, key=lambda r: r["score"])["text"] if enriched else "",
        })
    # Sort by positive_pct descending
    board.sort(key=lambda x: x["positive_pct"], reverse=True)
    for i, item in enumerate(board):
        item["rank"] = i + 1
    return jsonify({"leaderboard": board})


# ─────────────────────────────────────────────
# POST /import/<product>  →  bulk import reviews from JSON array
# Body: { "reviews": ["text1", "text2", ...] }
# ─────────────────────────────────────────────
@app.route("/import/<product>", methods=["POST"])
def bulk_import(product):
    body = request.get_json()
    if not body or "reviews" not in body:
        return jsonify({"error": "Missing 'reviews' array"}), 400
    if get_reviews(product) is None:
        return jsonify({"error": "Product not found"}), 404

    added = 0
    for text in body["reviews"]:
        if isinstance(text, str) and text.strip():
            add_review(product, text.strip())
            added += 1

    return jsonify({"message": f"Imported {added} reviews", "added": added})


# ─────────────────────────────────────────────
# GET /alerts  →  products with negative sentiment > threshold
# Query param: threshold (default 40 = 40%)
# ─────────────────────────────────────────────
@app.route("/alerts", methods=["GET"])
def alerts():
    threshold = float(request.args.get("threshold", 40))
    result = []
    for product in get_all_products():
        reviews_list = get_reviews(product)
        s = get_sentiment_stats(reviews_list)
        if s["negative_pct"] >= threshold:
            result.append({
                "product": product,
                "negative_pct": s["negative_pct"],
                "negative": s["Negative"],
                "total": s["total"],
                "avg_score": s["avg_score"],
                "severity": "high" if s["negative_pct"] >= 60 else "medium"
            })
    result.sort(key=lambda x: x["negative_pct"], reverse=True)
    return jsonify({"alerts": result, "threshold": threshold})


# ─────────────────────────────────────────────
# POST /scrape  →  scrape reviews from a URL + analyze sentiment
# Body: { "url": "https://..." }
# ─────────────────────────────────────────────
@app.route("/scrape", methods=["POST"])
def scrape():
    body = request.get_json()
    if not body or "url" not in body:
        return jsonify({"error": "Missing 'url' field"}), 400

    url = body["url"].strip()
    if not url:
        return jsonify({"error": "URL cannot be empty"}), 400

    # Scrape the page
    scraped = scrape_reviews(url)

    if not scraped["success"]:
        return jsonify({
            "success": False,
            "url": url,
            "site": scraped.get("site", "unknown"),
            "product_name": scraped.get("product_name", ""),
            "error": scraped["error"],
            "reviews": [],
            "stats": None
        }), 200   # 200 so frontend can read the error message

    # Run sentiment analysis on each scraped review
    enriched = []
    for idx, text in enumerate(scraped["reviews"]):
        sentiment, score = analyze_sentiment(text)
        enriched.append({
            "id": idx,
            "text": text,
            "sentiment": sentiment,
            "score": round(score, 4)
        })

    stats = get_sentiment_stats(scraped["reviews"])
    keywords = extract_keywords(scraped["reviews"], top_n=25)

    return jsonify({
        "success": True,
        "url": url,
        "site": scraped["site"],
        "product_name": scraped["product_name"],
        "reviews": enriched,
        "stats": stats,
        "keywords": keywords,
        "count": len(enriched),
        "error": None
    })


if __name__ == "__main__":
    app.run(debug=True, port=5000)
