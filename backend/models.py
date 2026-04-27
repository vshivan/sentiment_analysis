"""
Senti ERP — Database Models (SQLAlchemy + SQLite)
"""
from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = "users"
    id         = db.Column(db.Integer, primary_key=True)
    username   = db.Column(db.String(80),  unique=True, nullable=False)
    email      = db.Column(db.String(120), unique=True, nullable=False)
    password   = db.Column(db.String(256), nullable=False)          # hashed
    role       = db.Column(db.String(20),  default="viewer")        # admin | analyst | viewer
    is_active  = db.Column(db.Boolean,     default=True)
    created_at = db.Column(db.DateTime,    default=lambda: datetime.now(timezone.utc))
    last_login = db.Column(db.DateTime,    nullable=True)

    def to_dict(self):
        return {
            "id": self.id, "username": self.username,
            "email": self.email, "role": self.role,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }


class Product(db.Model):
    __tablename__ = "products"
    id         = db.Column(db.Integer, primary_key=True)
    name       = db.Column(db.String(100), unique=True, nullable=False)
    category   = db.Column(db.String(50),  default="General")
    icon       = db.Column(db.String(10),  default="📦")
    is_active  = db.Column(db.Boolean,     default=True)
    created_at = db.Column(db.DateTime,    default=lambda: datetime.now(timezone.utc))
    reviews    = db.relationship("Review", backref="product", lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id, "name": self.name,
            "category": self.category, "icon": self.icon,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat(),
        }


class Review(db.Model):
    __tablename__ = "reviews"
    id          = db.Column(db.Integer, primary_key=True)
    product_id  = db.Column(db.Integer, db.ForeignKey("products.id"), nullable=False)
    text        = db.Column(db.Text,    nullable=False)
    sentiment   = db.Column(db.String(20), nullable=True)   # cached
    score       = db.Column(db.Float,      nullable=True)   # cached
    language    = db.Column(db.String(20), default="mixed") # english | hindi | mixed
    source      = db.Column(db.String(50), default="manual") # manual | import | scrape
    tags        = db.Column(db.String(200), default="")
    created_at  = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    created_by  = db.Column(db.String(80), default="system")

    def to_dict(self):
        return {
            "id": self.id, "product_id": self.product_id,
            "text": self.text, "sentiment": self.sentiment,
            "score": self.score, "language": self.language,
            "source": self.source, "tags": self.tags,
            "created_at": self.created_at.isoformat(),
            "created_by": self.created_by,
        }


class AuditLog(db.Model):
    __tablename__ = "audit_logs"
    id         = db.Column(db.Integer, primary_key=True)
    user       = db.Column(db.String(80),  nullable=False)
    action     = db.Column(db.String(50),  nullable=False)  # CREATE | UPDATE | DELETE | LOGIN | EXPORT
    resource   = db.Column(db.String(100), nullable=False)  # e.g. "Review #42" or "Product: iPhone"
    detail     = db.Column(db.Text,        nullable=True)
    ip_address = db.Column(db.String(45),  nullable=True)
    created_at = db.Column(db.DateTime,    default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id, "user": self.user,
            "action": self.action, "resource": self.resource,
            "detail": self.detail, "ip_address": self.ip_address,
            "created_at": self.created_at.isoformat(),
        }


class Notification(db.Model):
    __tablename__ = "notifications"
    id         = db.Column(db.Integer, primary_key=True)
    user       = db.Column(db.String(80), nullable=False)
    title      = db.Column(db.String(120), nullable=False)
    message    = db.Column(db.Text, nullable=False)
    type       = db.Column(db.String(20), default="info")   # info | warning | alert | success
    is_read    = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id, "user": self.user,
            "title": self.title, "message": self.message,
            "type": self.type, "is_read": self.is_read,
            "created_at": self.created_at.isoformat(),
        }
