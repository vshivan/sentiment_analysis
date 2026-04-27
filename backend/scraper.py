"""
Senti - Review Scraper v3
=========================
Uses JSON-LD structured data (Schema.org Review objects) which is
publicly embedded in HTML — no bot-protection bypass needed.

Confirmed working sites:
  - Sitejabber  (sitejabber.com/reviews/<brand>)  ✅ 20 reviews/page
  - MouthShut   (mouthshut.com)                   ✅ JSON-LD
  - Any site    with Schema.org Review markup      ✅

For Amazon/Flipkart/Trustpilot (all behind Cloudflare/bot-protection),
we redirect users to Sitejabber which has reviews for every major brand.
"""

import re
import json
import time
import random
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse

TIMEOUT = 15

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9,hi;q=0.8",
    # Do NOT send Accept-Encoding — let requests handle it automatically
    # so the response is always decompressed text
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
}


def _get(url: str) -> requests.Response | None:
    try:
        time.sleep(random.uniform(0.3, 0.8))
        r = requests.get(url, headers=HEADERS, timeout=TIMEOUT, allow_redirects=True)
        return r if r.status_code == 200 else None
    except Exception:
        return None


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def _detect_site(url: str) -> str:
    host = urlparse(url).netloc.lower()
    for site in ["sitejabber", "mouthshut", "amazon", "flipkart",
                 "trustpilot", "g2", "capterra", "yelp"]:
        if site in host:
            return site
    return "generic"


def _extract_product_name(soup: BeautifulSoup, url: str) -> str:
    for sel in ["h1", "[itemprop='name']"]:
        el = soup.select_one(sel)
        if el:
            t = _clean(el.get_text())
            if t:
                return t[:120]
    og = soup.find("meta", property="og:title")
    if og and og.get("content"):
        return _clean(og["content"])[:120]
    return urlparse(url).netloc


def _extract_jsonld_reviews(soup: BeautifulSoup) -> list[str]:
    """
    Extract review text from Schema.org JSON-LD embedded in the page.
    Handles: direct Review objects, nested reviews in Product/Organization,
    and list-wrapped structures.
    """
    reviews = []
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
        except Exception:
            continue

        items = data if isinstance(data, list) else [data]
        for item in items:
            # Direct Review object
            if item.get("@type") == "Review":
                body = (
                    item.get("reviewBody") or
                    item.get("description") or
                    item.get("name") or ""
                )
                if body and len(body.strip()) > 10:
                    reviews.append(_clean(body))
                continue

            # Any object with nested reviews array (Product, Organization, etc.)
            nested = item.get("review", [])
            if isinstance(nested, list):
                for rev in nested:
                    body = (
                        rev.get("reviewBody") or
                        rev.get("description") or
                        rev.get("name") or ""
                    )
                    if body and len(body.strip()) > 10:
                        reviews.append(_clean(body))

            # Also check aggregateRating description
            agg = item.get("aggregateRating", {})
            if isinstance(agg, dict) and agg.get("description"):
                pass  # skip — not a review text

    return reviews


def _scrape_sitejabber(url: str) -> dict:
    """Sitejabber: JSON-LD gives 20 reviews per page. Reliable."""
    r = _get(url)
    if not r:
        return {"error": "Could not fetch Sitejabber page."}

    soup = BeautifulSoup(r.text, "html.parser")
    product_name = _extract_product_name(soup, url)
    reviews = _extract_jsonld_reviews(soup)

    # Also try HTML selectors as backup
    if not reviews:
        for sel in [".review__text p", ".review-content p",
                    "[itemprop='reviewBody']", ".review__body"]:
            for el in soup.select(sel):
                t = _clean(el.get_text())
                if len(t) > 20:
                    reviews.append(t)
            if reviews:
                break

    return {"product_name": product_name, "reviews": reviews}


def _scrape_mouthshut(url: str) -> dict:
    """MouthShut: JSON-LD structured reviews."""
    r = _get(url)
    if not r:
        return {"error": "Could not fetch MouthShut page."}

    soup = BeautifulSoup(r.text, "html.parser")
    product_name = _extract_product_name(soup, url)
    reviews = _extract_jsonld_reviews(soup)

    # HTML fallback
    if not reviews:
        for sel in [".reviewdata p", ".review-text", ".review_text",
                    "[itemprop='reviewBody']"]:
            for el in soup.select(sel):
                t = _clean(el.get_text())
                if len(t) > 20:
                    reviews.append(t)
            if reviews:
                break

    return {"product_name": product_name, "reviews": reviews}


def _scrape_generic(url: str) -> dict:
    """
    Generic: try JSON-LD first, then broad CSS selectors.
    Works on any site that uses Schema.org markup.
    """
    r = _get(url)
    if not r:
        return {"error": f"Could not fetch page (HTTP error or timeout)."}

    if r.status_code == 403:
        return {"error": "Access denied (403). This site blocks automated requests."}

    soup = BeautifulSoup(r.text, "html.parser")
    for tag in soup(["script", "style", "noscript", "nav", "footer", "header"]):
        tag.decompose()

    product_name = _extract_product_name(soup, url)

    # Try JSON-LD first
    reviews = _extract_jsonld_reviews(soup)

    # CSS selector sweep
    if not reviews:
        seen = set()
        for sel in [
            "[class*='review']", "[class*='Review']",
            "[class*='comment']", "[class*='feedback']",
            "[itemprop='reviewBody']", "[itemprop='description']",
        ]:
            for el in soup.select(sel):
                t = _clean(el.get_text())
                if 25 < len(t) < 800 and re.search(r"[a-zA-Z\u0900-\u097F]{4,}", t):
                    if t not in seen:
                        seen.add(t)
                        reviews.append(t)
            if reviews:
                break

    return {"product_name": product_name, "reviews": reviews}


# ── Brand → Sitejabber URL mapper ─────────────────────────────────────────────
BRAND_MAP = {
    "amazon":   "amazon.com",
    "flipkart": "flipkart.com",
    "apple":    "apple.com",
    "iphone":   "apple.com",
    "samsung":  "samsung.com",
    "dell":     "dell.com",
    "adidas":   "adidas.com",
    "nike":     "nike.com",
    "zara":     "zara.com",
    "myntra":   "myntra.com",
    "meesho":   "meesho.com",
    "lenskart": "lenskart.com",
    "titan":    "titan.co.in",
}


def _redirect_to_sitejabber(url: str) -> str | None:
    """
    If the URL is an Amazon/Flipkart/Trustpilot/G2 page (all blocked),
    try to map it to a Sitejabber URL for the same brand.
    """
    url_lower = url.lower()
    for brand, domain in BRAND_MAP.items():
        if brand in url_lower:
            return f"https://www.sitejabber.com/reviews/{domain}"
    return None


# ── MAIN ──────────────────────────────────────────────────────────────────────
def scrape_reviews(url: str) -> dict:
    """
    Scrape and return reviews from a product URL.
    Returns: { success, url, site, product_name, reviews, count, error }
    """
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    site = _detect_site(url)
    original_url = url
    redirected = False

    # For known-blocked sites, redirect to Sitejabber
    BLOCKED = {"amazon", "flipkart", "trustpilot", "g2", "capterra", "yelp"}
    if site in BLOCKED:
        sj_url = _redirect_to_sitejabber(url)
        if sj_url:
            url = sj_url
            site = "sitejabber"
            redirected = True

    # Route to scraper
    scrapers = {
        "sitejabber": _scrape_sitejabber,
        "mouthshut":  _scrape_mouthshut,
    }
    fn = scrapers.get(site, _scrape_generic)
    result = fn(url)

    if "error" in result and not result.get("reviews"):
        return {
            "success": False,
            "url": url,
            "original_url": original_url,
            "site": site,
            "redirected": redirected,
            "product_name": result.get("product_name", ""),
            "reviews": [],
            "count": 0,
            "error": result["error"],
        }

    # Deduplicate
    seen = set()
    unique = []
    for rev in result.get("reviews", []):
        rev = rev.strip()
        if rev and rev not in seen and len(rev) > 15:
            seen.add(rev)
            unique.append(rev)

    unique = unique[:60]

    if not unique:
        return {
            "success": False,
            "url": url,
            "original_url": original_url,
            "site": site,
            "redirected": redirected,
            "product_name": result.get("product_name", ""),
            "reviews": [],
            "count": 0,
            "error": (
                "No reviews found. Try a Sitejabber URL: "
                "https://www.sitejabber.com/reviews/<brand>.com"
            ),
        }

    return {
        "success": True,
        "url": url,
        "original_url": original_url,
        "site": site,
        "redirected": redirected,
        "product_name": result.get("product_name", urlparse(url).netloc).replace("Reviews", "").strip(),
        "reviews": unique,
        "count": len(unique),
        "error": None,
    }
