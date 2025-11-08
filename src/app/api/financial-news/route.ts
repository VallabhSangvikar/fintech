import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { mysqlPool } from '@/lib/database';
import { APIResponse } from '@/types/database';

// Simple in-memory cache for news data
interface CacheEntry {
  data: NewsArticle[];
  timestamp: number;
  requestCount: number;
}

const newsCache = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_PER_HOUR = 90; // Leave margin below 100 limit
let hourlyRequestCount = 0;
let hourlyResetTime = Date.now() + CACHE_DURATION_MS;

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: {
    id: string | null;
    name: string;
  };
  author?: string;
  category: string;
  relevanceScore?: number;
}

interface NewsResponse {
  articles: NewsArticle[];
  totalResults: number;
  userPortfolio?: string[];
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;
    const url = new URL(request.url);
    const category = url.searchParams.get('category') || 'general';
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1');

    // Get user's investment portfolio to personalize news
    let userPortfolio: string[] = [];
    try {
      const [portfolioRows] = await mysqlPool.execute(
        `SELECT product_name, product_category FROM investment_products WHERE user_id = ?`,
        [user.userId]
      ) as any;
      
      userPortfolio = portfolioRows.map((item: any) => item.product_category || item.product_name);
    } catch (error) {
      console.error('Error fetching user portfolio:', error);
    }

    // Create cache key based on query parameters
    const cacheKey = `${category}_${search}_${page}_${userPortfolio.join(',')}`;
    
    // Check cache first
    const cachedData = newsCache.get(cacheKey);
    const now = Date.now();
    
    if (cachedData && (now - cachedData.timestamp) < CACHE_DURATION_MS) {
      console.log('📦 Serving news from cache:', cacheKey);
      return NextResponse.json({
        success: true,
        data: {
          articles: cachedData.data,
          totalResults: cachedData.data.length,
          userPortfolio,
          cached: true,
          cacheAge: Math.floor((now - cachedData.timestamp) / 1000 / 60) + ' minutes'
        }
      } as APIResponse<NewsResponse>);
    }

    // Get personalized news based on user's portfolio and preferences
    const newsArticles = await fetchPersonalizedNews(category, search, page, userPortfolio);

    // Update cache
    newsCache.set(cacheKey, {
      data: newsArticles,
      timestamp: now,
      requestCount: 1
    });

    return NextResponse.json({
      success: true,
      data: {
        articles: newsArticles,
        totalResults: newsArticles.length,
        userPortfolio,
        cached: false
      }
    } as APIResponse<NewsResponse>);

  } catch (error) {
    console.error('Error fetching financial news:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch financial news' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

async function fetchPersonalizedNews(
  category: string, 
  search: string, 
  page: number, 
  userPortfolio: string[]
): Promise<NewsArticle[]> {
  const NEWS_API_KEY = process.env.NEWS_API_KEY;
  
  if (!NEWS_API_KEY) {
    console.warn('NEWS_API_KEY not configured, using mock data');
    return getMockFinancialNews(category, userPortfolio);
  }

  // Check and reset rate limit counter
  const now = Date.now();
  if (now > hourlyResetTime) {
    hourlyRequestCount = 0;
    hourlyResetTime = now + CACHE_DURATION_MS;
    console.log('🔄 Rate limit counter reset');
  }

  // Check if we've hit rate limit
  if (hourlyRequestCount >= RATE_LIMIT_PER_HOUR) {
    console.warn('⚠️ Rate limit reached, serving cached or mock data');
    // Try to serve any cached data, even if expired
    const anyCachedData = Array.from(newsCache.values())[0];
    if (anyCachedData) {
      console.log('📦 Serving expired cache due to rate limit');
      return anyCachedData.data;
    }
    // Fall back to mock data
    return getMockFinancialNews(category, userPortfolio);
  }

  try {
    // Build search query based on category and user portfolio
    let searchQuery = buildSearchQuery(category, search, userPortfolio);
    
    const newsApiUrl = `https://newsapi.org/v2/everything?` + new URLSearchParams({
      q: searchQuery,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: '20',
      page: page.toString()
    });

    // Increment request counter
    hourlyRequestCount++;
    console.log(`📰 Making NewsAPI request (${hourlyRequestCount}/${RATE_LIMIT_PER_HOUR})`);

    const response = await fetch(newsApiUrl, {
      headers: {
        'X-API-Key': NEWS_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`NewsAPI error: ${response.status}`);
    }

    const newsData = await response.json();
    
    // Process and score articles based on user relevance
    const processedArticles = processNewsArticles(newsData.articles, category, userPortfolio);
    
    return processedArticles;
  } catch (error) {
    console.error('Error fetching from NewsAPI:', error);
    return getMockFinancialNews(category, userPortfolio);
  }
}

function buildSearchQuery(category: string, search: string, userPortfolio: string[]): string {
  let baseQuery = '';
  
  // Base queries for different categories
  const categoryQueries = {
    general: 'finance OR financial OR investment OR economy',
    markets: 'stock market OR NYSE OR NASDAQ OR trading OR securities',
    crypto: 'cryptocurrency OR bitcoin OR ethereum OR crypto OR blockchain',
    economy: 'economy OR GDP OR inflation OR federal reserve OR interest rates',
    banking: 'banking OR banks OR loans OR mortgage OR credit'
  };

  baseQuery = categoryQueries[category as keyof typeof categoryQueries] || categoryQueries.general;

  // Add portfolio-specific terms
  if (userPortfolio.length > 0) {
    const portfolioTerms = userPortfolio.map(item => {
      switch (item) {
        case 'INDEX_FUND': return 'index fund OR ETF OR S&P 500';
        case 'REAL_ESTATE': return 'real estate OR REIT OR property investment';
        case 'SIP': return 'mutual fund OR SIP OR systematic investment';
        case 'GOVERNMENT_BOND': return 'government bonds OR treasury OR municipal bonds';
        default: return item;
      }
    }).join(' OR ');
    
    baseQuery += ` OR (${portfolioTerms})`;
  }

  // Add user search terms if provided
  if (search.trim()) {
    baseQuery += ` AND (${search.trim()})`;
  }

  return baseQuery;
}

function processNewsArticles(articles: any[], category: string, userPortfolio: string[]): NewsArticle[] {
  return articles
    .filter(article => article.title && article.description && article.title !== '[Removed]')
    .map((article, index) => {
      // Calculate relevance score based on user portfolio
      const relevanceScore = calculateRelevanceScore(article, userPortfolio);
      
      return {
        id: `news-${Date.now()}-${index}`,
        title: article.title,
        description: article.description,
        url: article.url,
        urlToImage: article.urlToImage,
        publishedAt: article.publishedAt,
        source: article.source,
        author: article.author,
        category: category,
        relevanceScore
      };
    })
    .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
    .slice(0, 12); // Limit to 12 most relevant articles
}

function calculateRelevanceScore(article: any, userPortfolio: string[]): number {
  let score = 1; // Base score
  
  const text = `${article.title} ${article.description}`.toLowerCase();
  
  // Increase score based on portfolio matches
  userPortfolio.forEach(investment => {
    switch (investment) {
      case 'INDEX_FUND':
        if (text.includes('index') || text.includes('etf') || text.includes('s&p')) score += 2;
        break;
      case 'REAL_ESTATE':
        if (text.includes('real estate') || text.includes('reit') || text.includes('property')) score += 2;
        break;
      case 'SIP':
        if (text.includes('mutual fund') || text.includes('sip')) score += 2;
        break;
      case 'GOVERNMENT_BOND':
        if (text.includes('bond') || text.includes('treasury')) score += 2;
        break;
    }
  });

  // Boost score for high-impact financial terms
  const highImpactTerms = ['fed', 'federal reserve', 'interest rate', 'inflation', 'gdp', 'market crash', 'bull market', 'bear market'];
  highImpactTerms.forEach(term => {
    if (text.includes(term)) score += 1;
  });

  return score;
}

function getMockFinancialNews(category: string, userPortfolio: string[]): NewsArticle[] {
  const baseNews = [
    {
      id: 'mock-1',
      title: "Federal Reserve Signals Potential Rate Changes Ahead",
      description: "The Federal Reserve hints at upcoming monetary policy adjustments that could significantly impact investment portfolios and economic growth.",
      url: "https://example.com/fed-rates",
      urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400",
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      source: { id: "reuters", name: "Reuters" },
      author: "Financial Correspondent",
      category: category,
      relevanceScore: 5
    },
    {
      id: 'mock-2',
      title: "Stock Market Reaches New Heights Amid Economic Optimism",
      description: "Major indices post significant gains as investors show renewed confidence in economic recovery and corporate earnings growth.",
      url: "https://example.com/market-gains",
      urlToImage: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400",
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      source: { id: "bloomberg", name: "Bloomberg" },
      author: "Market Analysis Team",
      category: category,
      relevanceScore: 4
    },
    {
      id: 'mock-3',
      title: "Real Estate Investment Trusts Show Strong Performance",
      description: "REITs demonstrate resilient performance as real estate markets stabilize and rental income streams remain robust.",
      url: "https://example.com/reit-performance",
      urlToImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      source: { id: "cnbc", name: "CNBC" },
      author: "Real Estate Analyst",
      category: category,
      relevanceScore: userPortfolio.includes('REAL_ESTATE') ? 6 : 3
    },
    {
      id: 'mock-4',
      title: "Government Bond Yields Rise on Economic Growth Expectations",
      description: "Treasury yields climb as investors anticipate stronger economic growth and potential shifts in monetary policy direction.",
      url: "https://example.com/bond-yields",
      urlToImage: "https://images.unsplash.com/photo-1605792657660-596af9009150?w=400",
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      source: { id: "financial-times", name: "Financial Times" },
      author: "Bond Market Specialist",
      category: category,
      relevanceScore: userPortfolio.includes('GOVERNMENT_BOND') ? 6 : 3
    },
    {
      id: 'mock-5',
      title: "Index Funds Continue to Attract Record Inflows",
      description: "Passive investing strategies gain momentum as index funds and ETFs see unprecedented investor interest and capital flows.",
      url: "https://example.com/index-funds",
      urlToImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400",
      publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      source: { id: "reuters", name: "Reuters" },
      author: "Investment Strategy Reporter",
      category: category,
      relevanceScore: userPortfolio.includes('INDEX_FUND') ? 6 : 3
    }
  ];

  // Sort by relevance score and return
  return baseNews.sort((a, b) => b.relevanceScore! - a.relevanceScore!);
}