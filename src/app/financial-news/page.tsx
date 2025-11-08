'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Newspaper, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ExternalLink,
  Clock,
  Globe,
  ArrowUpRight,
  Filter,
  Bookmark,
  Share2
} from 'lucide-react';
import apiClient from '@/services/api-client';

interface NewsArticle {
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
}

interface NewsResponse {
  articles: NewsArticle[];
  totalResults: number;
}

const newsSources = [
  { id: 'all', name: 'All Sources', icon: Globe },
  { id: 'reuters', name: 'Reuters', icon: Newspaper },
  { id: 'bloomberg', name: 'Bloomberg', icon: TrendingUp },
  { id: 'cnbc', name: 'CNBC', icon: TrendingDown },
  { id: 'financial-times', name: 'Financial Times', icon: Newspaper },
];

const newsCategories = [
  { id: 'general', name: 'General Finance', color: 'bg-blue-100 text-blue-700' },
  { id: 'markets', name: 'Markets', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'crypto', name: 'Cryptocurrency', color: 'bg-orange-100 text-orange-700' },
  { id: 'economy', name: 'Economy', color: 'bg-purple-100 text-purple-700' },
  { id: 'banking', name: 'Banking', color: 'bg-indigo-100 text-indigo-700' },
];

export default function FinancialNewsPage() {
  const { user, token } = useAuth();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('general');

  // Handler for search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    // Debounce search to avoid too many API calls
    const timeoutId = setTimeout(() => {
      loadNews();
    }, 500);
    return () => clearTimeout(timeoutId);
  };

  useEffect(() => {
    if (token) {
      apiClient.setToken(token);
      loadNews();
    }
  }, [token, selectedCategory]);

  const loadNews = async () => {
    try {
      setIsLoading(true);
      
      const response = await apiClient.getFinancialNews({
        category: selectedCategory,
        search: searchTerm,
        page: 1
      });
      
      if (response.success && response.data) {
        setArticles(response.data.articles || []);
      } else {
        // Fallback to mock data if API fails
        const mockNews = generateMockNews(selectedCategory);
        setArticles(mockNews);
      }
    } catch (error) {
      console.error('Error loading news:', error);
      // Fallback to mock data
      const mockNews = generateMockNews(selectedCategory);
      setArticles(mockNews);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockNews = (category: string): NewsArticle[] => {
    const baseNews = [
      {
        title: "Federal Reserve Announces New Interest Rate Decision",
        description: "The Federal Reserve has announced its latest decision on interest rates, impacting financial markets and consumer lending.",
        url: "https://example.com/fed-rates",
        urlToImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400",
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: { id: "reuters", name: "Reuters" },
        author: "Financial Correspondent"
      },
      {
        title: "Stock Market Sees Major Gains Amid Economic Recovery",
        description: "Major indices posted significant gains as investors show confidence in the ongoing economic recovery.",
        url: "https://example.com/market-gains",
        urlToImage: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400",
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        source: { id: "bloomberg", name: "Bloomberg" },
        author: "Market Analysis Team"
      },
      {
        title: "Banking Sector Shows Strong Performance in Latest Quarter",
        description: "Major banks report stronger than expected earnings, driven by increased lending and reduced loan loss provisions.",
        url: "https://example.com/banking-performance",
        urlToImage: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400",
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        source: { id: "cnbc", name: "CNBC" },
        author: "Banking Analyst"
      },
      {
        title: "Cryptocurrency Market Experiences Volatility",
        description: "Bitcoin and other major cryptocurrencies see significant price movements as regulatory discussions continue.",
        url: "https://example.com/crypto-volatility",
        urlToImage: "https://images.unsplash.com/photo-1605792657660-596af9009150?w=400",
        publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        source: { id: "financial-times", name: "Financial Times" },
        author: "Crypto Reporter"
      },
      {
        title: "Economic Indicators Point to Steady Growth",
        description: "Latest economic data suggests sustained growth trajectory with manageable inflation levels.",
        url: "https://example.com/economic-growth",
        urlToImage: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400",
        publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        source: { id: "reuters", name: "Reuters" },
        author: "Economic Correspondent"
      }
    ];

    // Filter based on category
    return baseNews.filter(article => {
      switch (category) {
        case 'markets':
          return article.title.includes('Stock') || article.title.includes('Market');
        case 'crypto':
          return article.title.includes('Cryptocurrency') || article.title.includes('Bitcoin');
        case 'economy':
          return article.title.includes('Economic') || article.title.includes('Federal Reserve');
        case 'banking':
          return article.title.includes('Banking') || article.title.includes('Bank');
        default:
          return true;
      }
    });
  };

  const filteredArticles = articles.filter(article =>
    searchTerm === '' || 
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const publishDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - publishDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="news">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Financial News</h1>
              <p className="text-slate-600 mt-1">Stay updated with the latest financial market news and trends</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Bookmark className="w-4 h-4 mr-2" />
              Bookmarks
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search financial news..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex space-x-2 overflow-x-auto">
              {newsCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={selectedCategory === category.id ? "bg-blue-600" : ""}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* News Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {isLoading ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="w-full h-48 bg-slate-200 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-full"></div>
                      <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                      <div className="flex items-center space-x-2 mt-4">
                        <div className="h-3 bg-slate-200 rounded w-20"></div>
                        <div className="h-3 bg-slate-200 rounded w-16"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredArticles.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Newspaper className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">No news found</h3>
                <p className="text-slate-600">Try adjusting your search terms or category filter</p>
              </div>
            ) : (
              filteredArticles.map((article, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group">
                  {article.urlToImage && (
                    <div className="relative w-full h-48 overflow-hidden">
                      <img
                        src={article.urlToImage}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-white/90 text-slate-700">
                          {article.source.name}
                        </Badge>
                      </div>
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-slate-800 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-sm text-slate-600 line-clamp-3">
                        {article.description}
                      </p>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <div className="flex items-center space-x-2 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(article.publishedAt)}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Bookmark className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Load More Button */}
          {!isLoading && filteredArticles.length > 0 && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={loadNews}>
                Load More News
              </Button>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}