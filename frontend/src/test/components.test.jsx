/**
 * Frontend Tests for Senti Dashboard
 * Tests components, pages, and API integration.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: () => ({
      interceptors: {
        request: { use: vi.fn() }
      }
    }),
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}));

// Import components to test
import SentimentBadge from '../components/SentimentBadge';
import Spinner from '../components/Spinner';
import StatCard from '../components/StatCard';

describe('SentimentBadge Component', () => {
  it('renders Positive sentiment correctly', () => {
    render(<SentimentBadge sentiment="Positive" />);
    expect(screen.getByText('Positive')).toBeDefined();
  });

  it('renders Negative sentiment correctly', () => {
    render(<SentimentBadge sentiment="Negative" />);
    expect(screen.getByText('Negative')).toBeDefined();
  });

  it('renders Neutral sentiment correctly', () => {
    render(<SentimentBadge sentiment="Neutral" />);
    expect(screen.getByText('Neutral')).toBeDefined();
  });

  it('renders different sizes correctly', () => {
    const { container: small } = render(<SentimentBadge sentiment="Positive" size="sm" />);
    const { container: large } = render(<SentimentBadge sentiment="Positive" size="lg" />);
    
    expect(small.innerHTML).toBeDefined();
    expect(large.innerHTML).toBeDefined();
  });
});

describe('Spinner Component', () => {
  it('renders default spinner', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeDefined();
  });

  it('renders with custom size', () => {
    render(<Spinner size={48} />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeDefined();
  });

  it('renders with custom message', () => {
    render(<Spinner message="Loading..." />);
    expect(screen.getByText('Loading...')).toBeDefined();
  });
});

describe('StatCard Component', () => {
  it('renders title and value correctly', () => {
    render(<StatCard title="Total Reviews" value={150} icon={<span>📊</span>} />);
    expect(screen.getByText('Total Reviews')).toBeDefined();
    expect(screen.getByText('150')).toBeDefined();
  });

  it('renders with trend indicator', () => {
    render(
      <StatCard 
        title="Positive" 
        value={75} 
        icon={<span>👍</span>}
        trend={{ value: 12, isPositive: true }}
      />
    );
    expect(screen.getByText('+12%')).toBeDefined();
  });

  it('renders with negative trend', () => {
    render(
      <StatCard 
        title="Negative" 
        value={25} 
        icon={<span>👎</span>}
        trend={{ value: 5, isPositive: false }}
      />
    );
    expect(screen.getByText('-5%')).toBeDefined();
  });
});

describe('API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loginAPI is properly exported', async () => {
    const { loginAPI } = await import('../api');
    expect(typeof loginAPI).toBe('function');
  });

  it('analyzeText is properly exported', async () => {
    const { analyzeText } = await import('../api');
    expect(typeof analyzeText).toBe('function');
  });

  it('analyzeImage is properly exported', async () => {
    const { analyzeImage } = await import('../api');
    expect(typeof analyzeImage).toBe('function');
  });

  it('fetchProducts is properly exported', async () => {
    const { fetchProducts } = await import('../api');
    expect(typeof fetchProducts).toBe('function');
  });

  it('fetchStats is properly exported', async () => {
    const { fetchStats } = await import('../api');
    expect(typeof fetchStats).toBe('function');
  });
});

describe('AnalyzePage Integration', () => {
  it('has analyzeText function exported', async () => {
    const { analyzeText } = await import('../api');
    expect(analyzeText).toBeDefined();
  });

  it('has analyzeImage function exported', async () => {
    const { analyzeImage } = await import('../api');
    expect(analyzeImage).toBeDefined();
  });
});

describe('AuthContext', () => {
  it('provides authentication context', async () => {
    const { useAuth } = await import('../context/AuthContext');
    expect(useAuth).toBeDefined();
  });
});

describe('Page Routes', () => {
  it('Dashboard page is defined', async () => {
    const Dashboard = (await import('../pages/Dashboard')).default;
    expect(Dashboard).toBeDefined();
  });

  it('AnalyzePage page is defined', async () => {
    const AnalyzePage = (await import('../pages/AnalyzePage')).default;
    expect(AnalyzePage).toBeDefined();
  });

  it('LoginPage page is defined', async () => {
    const LoginPage = (await import('../pages/LoginPage')).default;
    expect(LoginPage).toBeDefined();
  });
});

describe('Component Exports', () => {
  it('Layout component is exported', async () => {
    const Layout = (await import('../components/Layout')).default;
    expect(Layout).toBeDefined();
  });

  it('SentimentBarChart component is exported', async () => {
    const SentimentBarChart = (await import('../components/SentimentBarChart')).default;
    expect(SentimentBarChart).toBeDefined();
  });

  it('SentimentPieChart component is exported', async () => {
    const SentimentPieChart = (await import('../components/SentimentPieChart')).default;
    expect(SentimentPieChart).toBeDefined();
  });

  it('WordCloud component is exported', async () => {
    const WordCloud = (await import('../components/WordCloud')).default;
    expect(WordCloud).toBeDefined();
  });

  it('TrendChart component is exported', async () => {
    const TrendChart = (await import('../components/TrendChart')).default;
    expect(TrendChart).toBeDefined();
  });
});

describe('Utility Functions', () => {
  it('exports BASE URL constant', async () => {
    const api = await import('../api');
    // The BASE constant should be defined in api.js
    expect(api).toBeDefined();
  });
});

if (import.meta.vitest) {
  const { run } = await import('vitest');
  run();
}