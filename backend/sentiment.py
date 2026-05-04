"""
Senti - Sentiment Analysis Engine
Handles English + Hindi/Hinglish mixed text using TextBlob + keyword heuristics
"""

import re
from colorsys import rgb_to_hls
from textblob import TextBlob
from PIL import Image

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


def _find_keyword_matches(text_lower: str, keywords: list) -> list[str]:
    """Return which keywords from the list appear in the text."""
    return [kw for kw in keywords if kw in text_lower]


def _generate_explanation(text: str, label: str, polarity: float,
                          base_polarity: float,
                          pos_keywords: list, neg_keywords: list) -> dict:
    """
    Generate a human-readable explanation of why a text got its sentiment label.

    Returns:
        {
            "summary": str,           # one-line human-readable verdict
            "factors": [str, ...],     # list of contributing factor descriptions
            "positive_words": [str],   # detected positive keywords/words
            "negative_words": [str],   # detected negative keywords/words
            "base_polarity": float,    # TextBlob raw polarity (English)
            "keyword_boost": float,    # net polarity shift from Hindi keywords
            "final_polarity": float    # final clamped score
        }
    """
    factors = []
    text_lower = text.lower()

    # ── 1. TextBlob English analysis ──
    blob = TextBlob(text)
    if abs(base_polarity) > 0.01:
        direction = "positive" if base_polarity > 0 else "negative"
        factors.append(
            f"English language analysis detected {direction} tone "
            f"(base polarity: {base_polarity:+.3f})"
        )
    else:
        factors.append("English language analysis found a neutral/balanced tone")

    # ── 2. Positive English words (from TextBlob word-level) ──
    eng_pos_words = []
    eng_neg_words = []
    for word in blob.words:
        wp = TextBlob(word).sentiment.polarity
        if wp > 0.2:
            eng_pos_words.append(str(word).lower())
        elif wp < -0.2:
            eng_neg_words.append(str(word).lower())

    if eng_pos_words:
        factors.append(
            f"Positive English words detected: {', '.join(set(eng_pos_words))}"
        )
    if eng_neg_words:
        factors.append(
            f"Negative English words detected: {', '.join(set(eng_neg_words))}"
        )

    # ── 3. Hindi/Hinglish keyword matches ──
    if pos_keywords:
        factors.append(
            f"Hindi/Hinglish positive keywords found: {', '.join(pos_keywords)}"
        )
    if neg_keywords:
        factors.append(
            f"Hindi/Hinglish negative keywords found: {', '.join(neg_keywords)}"
        )

    keyword_boost = (len(pos_keywords) * 0.15) - (len(neg_keywords) * 0.15)
    if abs(keyword_boost) > 0.01:
        direction = "positively" if keyword_boost > 0 else "negatively"
        factors.append(
            f"Hindi keyword matching shifted sentiment {direction} "
            f"by {abs(keyword_boost):.2f}"
        )

    # ── 4. Negation patterns ──
    negation_words = ["not", "no", "never", "don't", "doesn't", "didn't",
                      "won't", "can't", "wasn't", "isn't", "nahi", "na"]
    found_negations = [n for n in negation_words if n in text_lower]
    if found_negations:
        factors.append(
            f"Negation words detected ({', '.join(found_negations)}) which may "
            f"reverse sentiment of nearby words"
        )

    # ── 5. Intensity modifiers ──
    intensity_words = ["very", "extremely", "super", "absolutely", "totally",
                       "bahut", "bilkul", "ekdum", "completely", "utterly"]
    found_intensity = [w for w in intensity_words if w in text_lower]
    if found_intensity:
        factors.append(
            f"Intensity modifiers detected ({', '.join(found_intensity)}) "
            f"which amplify the sentiment strength"
        )

    # ── 6. Contrast/mixed signals ──
    contrast_words = ["but", "however", "although", "though", "yet",
                      "lekin", "magar", "par"]
    found_contrast = [w for w in contrast_words if w in text_lower]
    if found_contrast:
        factors.append(
            f"Contrast words detected ({', '.join(found_contrast)}) indicating "
            f"mixed or nuanced opinion"
        )

    # ── Summary ──
    all_pos = list(set(eng_pos_words + pos_keywords))
    all_neg = list(set(eng_neg_words + neg_keywords))

    if label == "Positive":
        if all_pos:
            summary = (f"This text is classified as Positive (score: {polarity:+.4f}) "
                       f"due to positive expressions like \"{', '.join(all_pos[:4])}\".")
        else:
            summary = (f"This text is classified as Positive (score: {polarity:+.4f}) "
                       f"based on overall positive language tone.")
    elif label == "Negative":
        if all_neg:
            summary = (f"This text is classified as Negative (score: {polarity:+.4f}) "
                       f"due to negative expressions like \"{', '.join(all_neg[:4])}\".")
        else:
            summary = (f"This text is classified as Negative (score: {polarity:+.4f}) "
                       f"based on overall negative language tone.")
    else:
        summary = (f"This text is classified as Neutral (score: {polarity:+.4f}) "
                   f"because it has a balanced mix of positive and negative signals, "
                   f"or no strong sentiment indicators.")

    return {
        "summary": summary,
        "factors": factors,
        "positive_words": all_pos[:8],
        "negative_words": all_neg[:8],
        "base_polarity": round(base_polarity, 4),
        "keyword_boost": round(keyword_boost, 4),
        "final_polarity": round(polarity, 4)
    }


def analyze_sentiment(text: str) -> tuple[str, float, dict]:
    """
    Analyze sentiment of a review (English + Hindi/Hinglish).

    Returns:
        (sentiment_label, polarity_score, explanation)
        sentiment_label: "Positive" | "Negative" | "Neutral"
        polarity_score: float in [-1.0, 1.0]
        explanation: dict with summary, factors, and word-level details
    """
    text_lower = text.lower()

    # TextBlob polarity on the full text (works well for English parts)
    blob = TextBlob(text)
    base_polarity = blob.sentiment.polarity  # -1.0 to 1.0

    # Find Hindi/Hinglish keyword matches
    pos_keywords = _find_keyword_matches(text_lower, HINDI_POSITIVE_KEYWORDS)
    neg_keywords = _find_keyword_matches(text_lower, HINDI_NEGATIVE_KEYWORDS)

    # Boost/reduce polarity based on Hindi keyword hits
    polarity = base_polarity
    polarity += (len(pos_keywords) * 0.15) - (len(neg_keywords) * 0.15)

    # Clamp to [-1, 1]
    polarity = max(-1.0, min(1.0, polarity))

    # Classify
    if polarity > 0.05:
        label = "Positive"
    elif polarity < -0.05:
        label = "Negative"
    else:
        label = "Neutral"

    # Generate explanation
    explanation = _generate_explanation(
        text, label, polarity, base_polarity, pos_keywords, neg_keywords
    )

    return label, polarity, explanation


def analyze_image_sentiment(image_file) -> tuple[str, float]:
    """Analyze sentiment from an image using color and brightness heuristics."""
    import random
    
    image = Image.open(image_file).convert("RGB")
    image.thumbnail((160, 160), Image.LANCZOS)
    pixels = list(image.getdata())
    if not pixels:
        raise ValueError("Empty image")

    # Sample up to 2000 pixels randomly for performance
    sample_size = min(2000, len(pixels))
    sampled_pixels = random.sample(pixels, sample_size) if len(pixels) > sample_size else pixels
    
    total = len(sampled_pixels)
    brightness_sum = 0.0
    saturation_sum = 0.0
    warmth_sum = 0.0

    for r, g, b in sampled_pixels:
        r_f, g_f, b_f = r / 255.0, g / 255.0, b / 255.0
        h, l, s = rgb_to_hls(r_f, g_f, b_f)
        brightness_sum += l
        saturation_sum += s

        # warmer hues and higher saturation tend to feel more positive
        if s > 0.15:
            if h <= 0.16 or h >= 0.83:  # Red hues
                warmth_sum += 1.0
            elif h < 0.6:  # Yellow/orange hues
                warmth_sum += 0.15
            else:  # Blue/green hues
                warmth_sum -= 0.1

    avg_lightness = brightness_sum / total
    avg_saturation = saturation_sum / total
    avg_warmth = warmth_sum / total

    # Calculate sentiment score with weighted factors
    score = ((avg_lightness - 0.47) * 1.3) + ((avg_saturation - 0.3) * 0.5) + (avg_warmth * 0.22)
    score = max(-1.0, min(1.0, score))

    if score > 0.05:
        label = "Positive"
    elif score < -0.05:
        label = "Negative"
    else:
        label = "Neutral"

    return label, score


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
        label, score, _expl = analyze_sentiment(review)
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
