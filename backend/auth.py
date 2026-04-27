"""
Senti ERP — Authentication & Authorization helpers
"""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from models import User


def roles_required(*roles):
    """Decorator: allow only users with specified roles."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            identity = get_jwt_identity()
            user = User.query.filter_by(username=identity).first()
            if not user or user.role not in roles:
                return jsonify({"error": "Insufficient permissions"}), 403
            if not user.is_active:
                return jsonify({"error": "Account is deactivated"}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def get_current_user():
    """Return current user object from JWT."""
    try:
        verify_jwt_in_request()
        identity = get_jwt_identity()
        return User.query.filter_by(username=identity).first()
    except Exception:
        return None
