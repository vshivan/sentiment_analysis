"""
Senti - In-memory Data Store
Holds product reviews dataset and provides CRUD operations.
"""

# ─────────────────────────────────────────────
# Master dataset (English + Hindi/Hinglish reviews)
# ─────────────────────────────────────────────
_DATA: dict[str, list[str]] = {
    "Adidas": [
        "The shoes are super comfortable and perfect for running. Totally worth it.",
        "Quality achhi hai but price thoda zyada lagta hai.",
        "I love the design, very stylish and durable.",
        "Ek mahine ke baad sole thoda ghis gaya, disappointed.",
        "Best sports brand experience so far, बहुत बढ़िया।"
    ],
    "Zara": [
        "Clothes look premium but stitching could be better.",
        "Zara ka collection trendy hota hai, mujhe pasand aaya.",
        "Fabric quality is average, not worth the high price.",
        "Amazing designs, feels very fashionable.",
        "Kapde ache hain lekin size fitting issue hai."
    ],
    "Dell": [
        "Laptop performance is smooth and reliable.",
        "Battery backup utna achha nahi hai.",
        "Dell ka build quality solid hai.",
        "Got heating issues after some months.",
        "Perfect for students and office work."
    ],
    "Supra": [
        "Shoes look cool but comfort could improve.",
        "Design mast hai, youth ke liye perfect.",
        "Material quality is not very durable.",
        "Affordable and stylish option.",
        "Thoda heavy feel hota hai pehenne mein."
    ],
    "iPhone": [
        "Camera quality is outstanding, best in class.",
        "Bahut mehenga hai, sabke liye nahi hai.",
        "Performance is super smooth, no lag at all.",
        "Battery life improve ho sakti thi.",
        "Premium feel and great ecosystem."
    ],
    "Lenskart": [
        "Affordable glasses and good service.",
        "Frame quality utni strong nahi lagi.",
        "Delivery fast thi aur fitting perfect.",
        "Customer service could be better.",
        "Great variety of stylish frames."
    ],
    "Lloyd AC": [
        "Cooling is very effective even in peak summer.",
        "Installation service late tha.",
        "Energy efficient and silent operation.",
        "Remote kabhi kabhi properly work nahi karta.",
        "Value for money product."
    ],
    "Titan Watch": [
        "Elegant design and premium feel.",
        "Thoda expensive hai but quality achhi hai.",
        "Strap quality could be better.",
        "Perfect gift option.",
        "Time accuracy aur durability top notch hai."
    ]
}


def get_all_products() -> list[str]:
    """Return list of all product names."""
    return list(_DATA.keys())


def get_reviews(product: str) -> list[str] | None:
    """Return reviews for a product, or None if not found."""
    return _DATA.get(product)


def add_review(product: str, text: str) -> bool:
    """
    Add a new review to a product.
    Returns True on success, False if product not found.
    """
    if product not in _DATA:
        return False
    _DATA[product].append(text.strip())
    return True


def remove_review(product: str, review_id: int) -> bool:
    """
    Remove a review by index.
    Returns True on success, False if not found.
    """
    if product not in _DATA:
        return False
    reviews = _DATA[product]
    if review_id < 0 or review_id >= len(reviews):
        return False
    _DATA[product].pop(review_id)
    return True
