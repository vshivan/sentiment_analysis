"""
Senti - Sentiment Analysis Engine
Handles English + Hindi/Hinglish mixed text using TextBlob + keyword heuristics
"""

import re
from textblob import TextBlob

# ─────────────────────────────────────────────
# Hindi/Hinglish sentiment keyword dictionaries
# ─────────────────────────────────────────────
HINDI_POSITIVE_KEYWORDS = [
    "achha", "achhi", "badhiya", "mast", "pasand", "bahut achha",
    "bahut badhiya", "perfect", "best", "zabardast", "shandar",
    "behtareen", "lajawaab", "khushi", "pyaar", "sundar", "sahi",
    "top notch", "worth it", "value", "fast", "quick", "solid",
    "बढ़िया", "अच्छा", "अच्छी", "बेहतरीन", "शानदार", "लाजवाब",
    "पसंद", "मस्त", "जबरदस्त", "खुशी"
]

HINDI_NEGATIVE_KEYWORDS = [
    "bura", "kharab", "bekar", "ganda", "problem", "issue",
    "disappointed", "ghis", "nahi", "nahi hai", "nahi tha",
    "late", "slow", "heavy", "mehenga", "zyada", "average",
    "खराब", "बेकार", "गंदा", "निराश", "समस्या", "देर"
]

HINDI_NEUTRAL_KEYWORDS = [
    "theek", "thoda", "lekin", "but", "however", "could",
    "ठीक", "थोड़ा", "लेकिन"
]


def _count_keyword_hits(text_lower: str, keywords: list) -> int:
    """Count how many sentiment keywords appear in the text."""
    return sum(1 for kw in keywords if kw in text_lower)


def analyze_sentiment(text: str) -> tuple[str, float]:
    """
    Analyze sentiment of a review (English + Hindi/Hinglish).

    Returns:
        (sentiment_label, polarity_score)
        sentiment_label: "Positive" | "Negative" | "Neutral"
        polarity_score: float in [-1.0, 1.0]
    """
    text_lower = text.lower()

    # TextBlob polarity on the full text (works well for English parts)
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity  # -1.0 to 1.0

    # Boost/reduce polarity based on Hindi keyword hits
    pos_hits = _count_keyword_hits(text_lower, HINDI_POSITIVE_KEYWORDS)
    neg_hits = _count_keyword_hits(text_lower, HINDI_NEGATIVE_KEYWORDS)

    # Each keyword hit nudges polarity by 0.15
    polarity += (pos_hits * 0.15) - (neg_hits * 0.15)

    # Clamp to [-1, 1]
    polarity = max(-1.0, min(1.0, polarity))

    # Classify
    if polarity > 0.05:
        label = "Positive"
    elif polarity < -0.05:
        label = "Negative"
    else:
        label = "Neutral"

    return label, polarity


def get_sentiment_stats(reviews: list) -> dict:
    """
    Compute sentiment distribution stats for a list of reviews.

    Returns:
        {
            "total": int,
            "Positive": int,
            "Negative": int,
            "Neutral": int,
            "positive_pct": float,
            "negative_pct": float,
            "neutral_pct": float,
            "avg_score": float
        }
    """
    counts = {"Positive": 0, "Negative": 0, "Neutral": 0}
    scores = []

    for review in reviews:
        label, score = analyze_sentiment(review)
        counts[label] += 1
        scores.append(score)

    total = len(reviews)
    avg_score = round(sum(scores) / total, 4) if total > 0 else 0.0

    return {
        "total": total,
        "Positive": counts["Positive"],
        "Negative": counts["Negative"],
        "Neutral": counts["Neutral"],
        "positive_pct": round(counts["Positive"] / total * 100, 1) if total else 0,
        "negative_pct": round(counts["Negative"] / total * 100, 1) if total else 0,
        "neutral_pct": round(counts["Neutral"] / total * 100, 1) if total else 0,
        "avg_score": avg_score
    }


def extract_keywords(reviews: list, top_n: int = 30) -> list[dict]:
    """
    Extract top keywords from a list of reviews for word cloud.

    Returns list of { "text": word, "value": frequency }
    """
    # Common stop words (English + Hinglish)
    stop_words = {
        "the", "is", "it", "and", "a", "an", "in", "of", "for",
        "to", "are", "was", "be", "has", "have", "this", "that",
        "with", "but", "not", "very", "so", "i", "my", "me",
        "hai", "ka", "ki", "ke", "se", "mein", "nahi", "aur",
        "tha", "thi", "hain", "ho", "bhi", "koi", "kuch", "jo",
        "after", "some", "could", "would", "also", "its", "at",
        "on", "by", "or", "as", "from", "been", "more", "than"
    }

    word_freq: dict[str, int] = {}
    for review in reviews:
        # Remove special characters, lowercase
        cleaned = re.sub(r"[^\w\s]", "", review.lower())
        words = cleaned.split()
        for word in words:
            if word not in stop_words and len(word) > 2:
                word_freq[word] = word_freq.get(word, 0) + 1

    # Sort by frequency and return top N
    sorted_words = sorted(word_freq.items(), key=lambda x: x[1], reverse=True)
    return [{"text": w, "value": v} for w, v in sorted_words[:top_n]]
