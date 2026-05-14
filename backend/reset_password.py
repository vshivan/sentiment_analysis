"""
Run this script to reset the admin password.
Usage: python reset_password.py
"""
from dotenv import load_dotenv
load_dotenv()

from app import app, db, User
from werkzeug.security import generate_password_hash
import os

username = os.environ.get("ADMIN_USERNAME", "admin")
password = os.environ.get("ADMIN_PASSWORD")

if not password:
    print("ERROR: ADMIN_PASSWORD not set in .env")
    exit(1)

with app.app_context():
    user = User.query.filter_by(username=username).first()
    if user:
        user.password = generate_password_hash(password)
        db.session.commit()
        print(f"✓ Password updated for user: {username}")
    else:
        print(f"User '{username}' not found. Creating...")
        from werkzeug.security import generate_password_hash
        email = os.environ.get("ADMIN_EMAIL", "admin@sentilytics.io")
        new_user = User(username=username, email=email,
                        password=generate_password_hash(password), role="admin")
        db.session.add(new_user)
        db.session.commit()
        print(f"✓ Admin user created: {username}")
