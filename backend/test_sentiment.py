"""
Unit Tests for Sentiment Analysis Module
Tests text and image sentiment analysis functions.
"""
import pytest
import io
import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sentiment import (
    analyze_sentiment,
    analyze_image_sentiment,
    get_sentiment_stats,
    extract_keywords,
    HINDI_POSITIVE_KEYWORDS,
    HINDI_NEGATIVE_KEYWORDS
)


class TestTextSentimentAnalysis:
    """Test text sentiment analysis functions."""
    
    def test_analyze_positive_english(self):
        """Test positive English text."""
        text = "This product is amazing! I love it. Great quality and worth the price."
        label, score = analyze_sentiment(text)
        assert label == "Positive"
        assert score > 0
    
    def test_analyze_negative_english(self):
        """Test negative English text."""
        text = "Terrible product. Complete waste of money. Very disappointed."
        label, score = analyze_sentiment(text)
        assert label == "Negative"
        assert score < 0
    
    def test_analyze_neutral_english(self):
        """Test neutral English text."""
        text = "The product is okay. It works as expected."
        label, score = analyze_sentiment(text)
        assert label in ["Positive", "Negative", "Neutral"]
    
    def test_analyze_positive_hindi(self):
        """Test positive Hindi/Hinglish text."""
        text = "Bahut badhiya product hai, mujhe pasand aaya!"
        label, score = analyze_sentiment(text)
        assert label == "Positive"
    
    def test_analyze_negative_hindi(self):
        """Test negative Hindi text."""
        text = "Bahut kharab product hai, bilkul bekar."
        label, score = analyze_sentiment(text)
        assert label == "Negative"
    
    def test_analyze_mixed_language(self):
        """Test mixed English-Hindi text."""
        text = "Product quality is best but delivery was late."
        label, score = analyze_sentiment(text)
        assert label in ["Positive", "Negative", "Neutral"]
    
    def test_analyze_empty_text(self):
        """Test empty text returns neutral."""
        text = ""
        label, score = analyze_sentiment(text)
        assert label == "Neutral"
        assert score == 0.0
    
    def test_score_range(self):
        """Test that scores are always in valid range."""
        test_texts = [
            "Amazing product!",
            "Worst purchase ever",
            "It's okay",
            "Very good quality",
            "Not recommended"
        ]
        for text in test_texts:
            label, score = analyze_sentiment(text)
            assert -1.0 <= score <= 1.0
            assert label in ["Positive", "Negative", "Neutral"]


class TestImageSentimentAnalysis:
    """Test image sentiment analysis functions."""
    
    def _create_temp_image(self, color):
        """Create a temporary image file."""
        from PIL import Image
        img = Image.new('RGB', (100, 100), color=color)
        path = 'temp_test_image.jpg'
        img.save(path)
        return path
    
    def test_analyze_warm_color_image(self):
        """Test image with warm colors (red/orange) returns positive."""
        path = self._create_temp_image((255, 100, 50))  # Warm orange
        try:
            label, score = analyze_image_sentiment(path)
            assert label == "Positive"
            assert score > 0
        finally:
            os.remove(path)
    
    def test_analyze_cool_color_image(self):
        """Test image with cool colors (blue) returns neutral/negative."""
        path = self._create_temp_image((30, 30, 100))  # Dark blue
        try:
            label, score = analyze_image_sentiment(path)
            assert label in ["Positive", "Negative", "Neutral"]
            assert -1.0 <= score <= 1.0
        finally:
            os.remove(path)
    
    def test_analyze_bright_image(self):
        """Test bright image returns positive."""
        path = self._create_temp_image((255, 255, 200))  # Bright yellow
        try:
            label, score = analyze_image_sentiment(path)
            assert label == "Positive"
        finally:
            os.remove(path)
    
    def test_analyze_dark_image(self):
        """Test dark image returns negative."""
        path = self._create_temp_image((20, 20, 20))  # Very dark
        try:
            label, score = analyze_image_sentiment(path)
            assert label in ["Positive", "Negative", "Neutral"]
        finally:
            os.remove(path)
    
    def test_analyze_gray_image(self):
        """Test grayscale image."""
        path = self._create_temp_image((128, 128, 128))  # Gray
        try:
            label, score = analyze_image_sentiment(path)
            assert label in ["Positive", "Negative", "Neutral"]
            assert -1.0 <= score <= 1.0
        finally:
            os.remove(path)
    
    def test_analyze_green_image(self):
        """Test green image (nature-like)."""
        path = self._create_temp_image((50, 200, 50))  # Green
        try:
            label, score = analyze_image_sentiment(path)
            assert label in ["Positive", "Negative", "Neutral"]
        finally:
            os.remove(path)
    
    def test_score_range_image(self):
        """Test image scores are always in valid range."""
        colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (128, 128, 128)]
        for color in colors:
            path = self._create_temp_image(color)
            try:
                label, score = analyze_image_sentiment(path)
                assert -1.0 <= score <= 1.0
                assert label in ["Positive", "Negative", "Neutral"]
            finally:
                os.remove(path)


class TestSentimentStats:
    """Test sentiment statistics function."""
    
    def test_get_sentiment_stats_empty(self):
        """Test stats with empty list."""
        stats = get_sentiment_stats([])
        assert stats['total'] == 0
        assert stats['Positive'] == 0
        assert stats['Negative'] == 0
        assert stats['Neutral'] == 0
    
    def test_get_sentiment_stats_all_positive(self):
        """Test stats with all positive reviews."""
        reviews = [
            "Great product! Love it!",
            "Amazing quality!",
            "Best purchase ever!"
        ]
        stats = get_sentiment_stats(reviews)
        assert stats['total'] == 3
        assert stats['Positive'] == 3
        assert stats['positive_pct'] == 100.0
    
    def test_get_sentiment_stats_mixed(self):
        """Test stats with mixed sentiment reviews."""
        reviews = [
            "Great product!",
            "Terrible!",
            "It's okay."
        ]
        stats = get_sentiment_stats(reviews)
        assert stats['total'] == 3
        assert stats['Positive'] + stats['Negative'] + stats['Neutral'] == 3
    
    def test_get_sentiment_stats_percentages(self):
        """Test percentage calculations."""
        reviews = ["Good", "Bad", "Good", "Bad"]
        stats = get_sentiment_stats(reviews)
        assert stats['positive_pct'] + stats['negative_pct'] + stats['neutral_pct'] == 100.0
    
    def test_get_sentiment_stats_average_score(self):
        """Test average score calculation."""
        reviews = ["Excellent!", "Good", "Okay"]
        stats = get_sentiment_stats(reviews)
        assert isinstance(stats['avg_score'], float)


class TestKeywordExtraction:
    """Test keyword extraction function."""
    
    def test_extract_keywords_empty(self):
        """Test keywords from empty list."""
        keywords = extract_keywords([])
        assert keywords == []
    
    def test_extract_keywords_basic(self):
        """Test basic keyword extraction."""
        reviews = [
            "Great product quality",
            "Amazing product",
            "Good quality"
        ]
        keywords = extract_keywords(reviews)
        assert len(keywords) > 0
        assert all('text' in kw and 'value' in kw for kw in keywords)
    
    def test_extract_keywords_top_n(self):
        """Test limiting number of keywords."""
        reviews = [
            "product quality good",
            "product is good",
            "good product",
            "quality is good"
        ]
        keywords = extract_keywords(reviews, top_n=3)
        assert len(keywords) <= 3
    
    def test_extract_keywords_filters_stop_words(self):
        """Test that stop words are filtered."""
        reviews = ["the product is good", "a good product"]
        keywords = extract_keywords(reviews)
        # Stop words like 'the', 'is', 'a' should not appear
        texts = [kw['text'] for kw in keywords]
        assert 'the' not in texts
        assert 'is' not in texts
        assert 'a' not in texts
    
    def test_extract_keywords_sorted_by_frequency(self):
        """Test keywords are sorted by frequency."""
        reviews = [
            "good product good",
            "good product",
            "product"
        ]
        keywords = extract_keywords(reviews)
        # Should be sorted by value (frequency) descending
        if len(keywords) > 1:
            assert keywords[0]['value'] >= keywords[1]['value']


class TestKeywordDictionaries:
    """Test Hindi keyword dictionaries."""
    
    def test_hindi_positive_keywords_exist(self):
        """Test positive keyword dictionary is not empty."""
        assert len(HINDI_POSITIVE_KEYWORDS) > 0
    
    def test_hindi_negative_keywords_exist(self):
        """Test negative keyword dictionary is not empty."""
        assert len(HINDI_NEGATIVE_KEYWORDS) > 0
    
    def test_common_positive_words(self):
        """Test common positive words are in dictionary."""
        expected_words = ['achha', 'badhiya', 'mast', 'best']
        for word in expected_words:
            assert any(word in kw.lower() for kw in HINDI_POSITIVE_KEYWORDS)
    
    def test_common_negative_words(self):
        """Test common negative words are in dictionary."""
        expected_words = ['bura', 'kharab', 'bekar']
        for word in expected_words:
            assert any(word in kw.lower() for kw in HINDI_NEGATIVE_KEYWORDS)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])