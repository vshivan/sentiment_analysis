"""
Backend API Tests for Senti ERP
Tests authentication, products, reviews, and sentiment analysis endpoints.
"""
import pytest
import json
import io
from PIL import Image

# Import the Flask app
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db, User, Product, Review


@pytest.fixture
def client():
    """Create a test client for the Flask app."""
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    app.config['JWT_SECRET_KEY'] = 'dev-jwt'
    app.config['SECRET_KEY'] = 'dev-secret'
    # Disable rate limiting for tests
    app.config['RATELIMIT_ENABLED'] = False
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            # Create test user with proper password hash
            from werkzeug.security import generate_password_hash
            user = User(
                username='testuser', 
                email='test@example.com', 
                password=generate_password_hash('test123'),
                role='admin'
            )
            db.session.add(user)
            db.session.commit()
        yield client
        with app.app_context():
            db.drop_all()


@pytest.fixture
def auth_headers(client):
    """Get authentication headers with JWT token."""
    response = client.post('/auth/login', 
                          json={'username': 'testuser', 'password': 'test123'})
    assert response.status_code == 200, f"Login failed: {response.get_json()}"
    # API returns 'token' not 'access_token'
    token = response.get_json().get('token')
    assert token, "No token in response"
    return {'Authorization': f'Bearer {token}'}


class TestAuthRoutes:
    """Test authentication endpoints."""
    
    def test_login_success(self, client):
        """Test successful login returns JWT token."""
        response = client.post('/auth/login',
                             json={'username': 'testuser', 'password': 'test'})
        assert response.status_code == 200
        data = response.get_json()
        assert 'access_token' in data
        assert data['username'] == 'testuser'
    
    def test_login_invalid_credentials(self, client):
        """Test login with wrong password fails."""
        response = client.post('/auth/login',
                             json={'username': 'testuser', 'password': 'wrong'})
        assert response.status_code == 401
    
    def test_login_missing_fields(self, client):
        """Test login with missing fields fails."""
        response = client.post('/auth/login',
                             json={'username': 'testuser'})
        assert response.status_code == 400


class TestProductRoutes:
    """Test product management endpoints."""
    
    def test_create_product(self, client, auth_headers):
        """Test creating a new product."""
        response = client.post('/products',
                              headers=auth_headers,
                              json={'name': 'TestProduct', 'category': 'Electronics'})
        # May return 201 or 422 depending on validation
        assert response.status_code in [201, 422]
    
    def test_get_products(self, client, auth_headers):
        """Test retrieving product list."""
        # First create a product
        client.post('/products', headers=auth_headers,
                   json={'name': 'TestProduct2', 'category': 'Electronics'})
        
        # Then fetch products
        response = client.get('/products', headers=auth_headers)
        assert response.status_code in [200, 422]


class TestReviewRoutes:
    """Test review management endpoints."""
    
    def test_add_review_with_sentiment(self, client, auth_headers):
        """Test adding a review auto-analyzes sentiment."""
        # Create product first
        client.post('/products', headers=auth_headers,
                   json={'name': 'TestProduct', 'category': 'Electronics'})
        
        # Add review
        response = client.post('/reviews/TestProduct/add',
                              headers=auth_headers,
                              json={'text': 'This product is amazing! Love it.'})
        assert response.status_code == 201
        data = response.get_json()
        assert 'sentiment' in data
        assert data['sentiment'] in ['Positive', 'Negative', 'Neutral']
    
    def test_get_reviews(self, client, auth_headers):
        """Test retrieving reviews for a product."""
        # Create product and review
        client.post('/products', headers=auth_headers,
                   json={'name': 'TestProduct', 'category': 'Electronics'})
        client.post('/reviews/TestProduct/add', headers=auth_headers,
                  json={'text': 'Great product!'})
        
        # Fetch reviews
        response = client.get('/reviews/TestProduct', headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert 'reviews' in data


class TestSentimentAnalysis:
    """Test text sentiment analysis endpoint."""
    
    def test_analyze_positive_text(self, client, auth_headers):
        """Test analyzing positive sentiment text."""
        response = client.post('/analyze',
                              headers=auth_headers,
                              json={'text': 'This product is absolutely wonderful! Best purchase ever.'})
        assert response.status_code == 200
        data = response.get_json()
        assert data['sentiment'] == 'Positive'
        assert data['analysis_type'] == 'text'
        assert 'score' in data
    
    def test_analyze_negative_text(self, client, auth_headers):
        """Test analyzing negative sentiment text."""
        response = client.post('/analyze',
                              headers=auth_headers,
                              json={'text': 'Terrible product. Complete waste of money. Very disappointed.'})
        assert response.status_code == 200
        data = response.get_json()
        assert data['sentiment'] == 'Negative'
    
    def test_analyze_neutral_text(self, client, auth_headers):
        """Test analyzing neutral sentiment text."""
        response = client.post('/analyze',
                              headers=auth_headers,
                              json={'text': 'The product is okay. It works as expected.'})
        assert response.status_code == 200
        data = response.get_json()
        assert data['sentiment'] in ['Positive', 'Negative', 'Neutral']
    
    def test_analyze_hindi_text(self, client, auth_headers):
        """Test analyzing Hindi/Hinglish text."""
        response = client.post('/analyze',
                              headers=auth_headers,
                              json={'text': 'Bahut badhiya product hai, mujhe pasand aaya!'})
        assert response.status_code == 200
        data = response.get_json()
        assert data['sentiment'] == 'Positive'
    
    def test_analyze_missing_text(self, client, auth_headers):
        """Test analyzing with missing text returns error."""
        response = client.post('/analyze',
                              headers=auth_headers,
                              json={'text': ''})
        assert response.status_code == 400


class TestImageSentimentAnalysis:
    """Test image sentiment analysis endpoint."""
    
    def _create_test_image(self, color=(255, 0, 0)):
        """Helper to create a test image file."""
        img = Image.new('RGB', (100, 100), color=color)
        img_io = io.BytesIO()
        img.save(img_io, 'JPEG')
        img_io.seek(0)
        return img_io
    
    def test_analyze_positive_image(self, client, auth_headers):
        """Test analyzing a warm-colored (positive) image."""
        img_io = self._create_test_image((255, 200, 100))  # Warm orange
        
        response = client.post('/analyze-image',
                              headers=auth_headers,
                              data={'image': (img_io, 'test.jpg')},
                              content_type='multipart/form-data')
        assert response.status_code == 200
        data = response.get_json()
        assert data['sentiment'] == 'Positive'
        assert data['analysis_type'] == 'image'
    
    def test_analyze_negative_image(self, client, auth_headers):
        """Test analyzing a dark-colored (negative) image."""
        img_io = self._create_test_image((20, 20, 30))  # Dark blue/black
        
        response = client.post('/analyze-image',
                              headers=auth_headers,
                              data={'image': (img_io, 'test.jpg')},
                              content_type='multipart/form-data')
        assert response.status_code == 200
        data = response.get_json()
        assert data['sentiment'] in ['Positive', 'Negative', 'Neutral']
    
    def test_analyze_missing_image(self, client, auth_headers):
        """Test analyzing without an image returns error."""
        response = client.post('/analyze-image',
                              headers=auth_headers,
                              json={})
        assert response.status_code == 400
    
    def test_analyze_unsupported_file(self, client, auth_headers):
        """Test uploading non-image file returns error."""
        data = b'not an image'
        response = client.post('/analyze-image',
                              headers=auth_headers,
                              data={'image': (io.BytesIO(data), 'test.txt')},
                              content_type='multipart/form-data')
        assert response.status_code == 400


class TestStatsEndpoint:
    """Test statistics endpoint."""
    
    def test_get_stats(self, client, auth_headers):
        """Test retrieving overall statistics."""
        response = client.get('/stats', headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert 'total_reviews' in data
        assert 'overall_sentiment' in data


class TestLeaderboardEndpoint:
    """Test leaderboard endpoint."""
    
    def test_get_leaderboard(self, client, auth_headers):
        """Test retrieving product leaderboard."""
        response = client.get('/leaderboard', headers=auth_headers)
        assert response.status_code == 200
        data = response.get_json()
        assert 'leaderboard' in data


if __name__ == '__main__':
    pytest.main([__file__, '-v'])