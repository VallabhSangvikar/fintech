'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { 
  Lightbulb, 
  TrendingUp, 
  Bookmark, 
  Clock, 
  ExternalLink, 
  RefreshCw,
  Bot,
  User,
  Newspaper,
  FileText,
  Search,
  Target,
  TrendingDown,
  Eye,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DashboardLayout from '@/components/DashboardLayout';

interface InvestmentTip {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'stocks' | 'mutual-funds' | 'bonds' | 'commodities' | 'crypto' | 'market-analysis' | 'economic-news';
  riskLevel: 'low' | 'medium' | 'high';
  timeHorizon: 'short' | 'medium' | 'long';
  source: 'AI Analysis' | 'Expert Analyst' | 'Market News' | 'Research Report';
  author: string;
  publishedAt: string;
  readTime: string;
  tags: string[];
  isBookmarked: boolean;
  viewCount: number;
  confidence?: number;
  sourceUrl?: string;
  isPremium: boolean;
  marketImpact: 'bullish' | 'bearish' | 'neutral';
}

export default function InvestmentTipsPage() {
  const { user } = useAuth();
  const [tips, setTips] = useState<InvestmentTip[]>([]);
  const [filteredTips, setFilteredTips] = useState<InvestmentTip[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Load investment tips from API
  const loadInvestmentTips = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/ai/investment-tips', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.tips && Array.isArray(data.tips)) {
          // Map API response to our InvestmentTip interface
          const mappedTips = data.tips.map((tip: any) => ({
            id: tip.id || tip._id,
            title: tip.title,
            summary: tip.summary || tip.content?.substring(0, 150) + '...',
            content: tip.content,
            category: tip.category || 'market-analysis',
            riskLevel: tip.risk_level || tip.riskLevel || 'medium',
            timeHorizon: tip.time_horizon || tip.timeHorizon || 'medium',
            source: tip.source || 'AI Analysis',
            author: tip.author || 'FinSight AI',
            publishedAt: tip.created_at || tip.publishedAt || new Date().toISOString(),
            readTime: tip.read_time || tip.readTime || '3 min read',
            tags: tip.tags || [],
            isBookmarked: false,
            viewCount: tip.view_count || tip.viewCount || 0,
            confidence: tip.confidence || 85,
            sourceUrl: tip.source_url || tip.sourceUrl,
            isPremium: tip.is_premium || tip.isPremium || false,
            marketImpact: tip.market_impact || tip.marketImpact || 'neutral'
          }));
          setTips(mappedTips);
          setFilteredTips(mappedTips);
        }
      } else {
        console.error('Failed to load investment tips:', response.statusText);
        setTips([]);
        setFilteredTips([]);
      }
    } catch (error) {
      console.error('Error loading investment tips:', error);
      setTips([]);
      setFilteredTips([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadInvestmentTips();
    }
  }, [user]);

  useEffect(() => {
    let filtered = tips;

    // Apply filters
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(tip => tip.category === selectedCategory);
    }

    if (selectedSource !== 'all') {
      filtered = filtered.filter(tip => tip.source === selectedSource);
    }

    if (selectedRisk !== 'all') {
      filtered = filtered.filter(tip => tip.riskLevel === selectedRisk);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tip =>
        tip.title.toLowerCase().includes(query) ||
        tip.summary.toLowerCase().includes(query) ||
        tip.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredTips(filtered);
  }, [tips, selectedCategory, selectedSource, selectedRisk, searchQuery]);

  const handleBookmark = (id: string) => {
    setTips(tips.map(tip =>
      tip.id === id ? { ...tip, isBookmarked: !tip.isBookmarked } : tip
    ));
  };

  const handleRefresh = () => {
    loadInvestmentTips();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'stocks': return <TrendingUp className="w-4 h-4" />;
      case 'bonds': return <Target className="w-4 h-4" />;
      case 'mutual-funds': return <FileText className="w-4 h-4" />;
      case 'commodities': return <Sparkles className="w-4 h-4" />;
      case 'crypto': return <TrendingUp className="w-4 h-4" />;
      case 'market-analysis': return <Eye className="w-4 h-4" />;
      case 'economic-news': return <Newspaper className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'stocks': return 'bg-blue-100 text-blue-700';
      case 'bonds': return 'bg-green-100 text-green-700';
      case 'mutual-funds': return 'bg-purple-100 text-purple-700';
      case 'commodities': return 'bg-yellow-100 text-yellow-700';
      case 'crypto': return 'bg-orange-100 text-orange-700';
      case 'market-analysis': return 'bg-gray-100 text-gray-700';
      case 'economic-news': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-700';
      case 'medium': return 'bg-yellow-100 text-yellow-700';
      case 'high': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getMarketImpactIcon = (impact: string) => {
    switch (impact) {
      case 'bullish': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'bearish': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'AI Analysis': return <Bot className="w-4 h-4" />;
      case 'Expert Analyst': return <User className="w-4 h-4" />;
      case 'Market News': return <Newspaper className="w-4 h-4" />;
      case 'Research Report': return <FileText className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout currentPage="investment-tips">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Investment Tips</h1>
              <p className="text-slate-600 mt-1">AI-powered insights and expert analysis for smarter investing</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>

          {/* Filters and Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search tips by title, content, or tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="stocks">Stocks</SelectItem>
                      <SelectItem value="mutual-funds">Mutual Funds</SelectItem>
                      <SelectItem value="bonds">Bonds</SelectItem>
                      <SelectItem value="commodities">Commodities</SelectItem>
                      <SelectItem value="crypto">Cryptocurrency</SelectItem>
                      <SelectItem value="market-analysis">Market Analysis</SelectItem>
                      <SelectItem value="economic-news">Economic News</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedSource} onValueChange={setSelectedSource}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="All Sources" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="AI Analysis">AI Analysis</SelectItem>
                      <SelectItem value="Expert Analyst">Expert Analyst</SelectItem>
                      <SelectItem value="Market News">Market News</SelectItem>
                      <SelectItem value="Research Report">Research Report</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedRisk} onValueChange={setSelectedRisk}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="All Risk Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Risk Levels</SelectItem>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="medium">Medium Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips Grid */}
          <div className="grid gap-6">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, index) => (
                <Card key={`loading-${index}`} className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="w-3/4 h-6 bg-slate-200 rounded animate-pulse"></div>
                        <div className="w-full h-4 bg-slate-200 rounded animate-pulse"></div>
                        <div className="w-2/3 h-4 bg-slate-200 rounded animate-pulse"></div>
                      </div>
                      <div className="w-8 h-8 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-6 bg-slate-200 rounded animate-pulse"></div>
                      <div className="w-16 h-6 bg-slate-200 rounded animate-pulse"></div>
                      <div className="w-16 h-6 bg-slate-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                </Card>
              ))
            ) : filteredTips.length === 0 ? (
              // Empty state
              <Card className="p-12 text-center">
                <Lightbulb className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  {searchQuery || selectedCategory !== 'all' || selectedSource !== 'all' || selectedRisk !== 'all' 
                    ? 'No tips match your filters' 
                    : 'No investment tips available'
                  }
                </h3>
                <p className="text-slate-600 mb-4">
                  {searchQuery || selectedCategory !== 'all' || selectedSource !== 'all' || selectedRisk !== 'all'
                    ? 'Try adjusting your search criteria or filters'
                    : 'Check back later for new AI-powered investment insights'
                  }
                </p>
                {(searchQuery || selectedCategory !== 'all' || selectedSource !== 'all' || selectedRisk !== 'all') && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setSelectedSource('all');
                      setSelectedRisk('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Card>
            ) : (
              // Tips list
              filteredTips.map((tip) => (
                <Card key={tip.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getCategoryColor(tip.category)}>
                            {getCategoryIcon(tip.category)}
                            <span className="ml-1 capitalize">{(tip.category || '').replace('-', ' ')}</span>
                          </Badge>
                          <Badge className={getRiskColor(tip.riskLevel)}>
                            <span className="capitalize">{tip.riskLevel} Risk</span>
                          </Badge>
                          {tip.isPremium && (
                            <Badge className="bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700">
                              <Sparkles className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-xl font-semibold text-slate-800 mb-2 leading-tight">
                          {tip.title}
                        </h3>

                        <p className="text-slate-600 mb-4 leading-relaxed">
                          {tip.summary}
                        </p>

                        <div className="flex items-center justify-between text-sm text-slate-500 mb-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              {getSourceIcon(tip.source)}
                              <span>{tip.author}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{tip.readTime}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="w-4 h-4" />
                              <span>{tip.viewCount.toLocaleString()}</span>
                            </div>
                            <span>{formatDate(tip.publishedAt)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {tip.confidence && (
                              <Badge variant="outline" className="text-xs">
                                {tip.confidence}% confidence
                              </Badge>
                            )}
                            {getMarketImpactIcon(tip.marketImpact)}
                          </div>
                        </div>

                        {tip.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {tip.tags.slice(0, 5).map((tag, tagIndex) => (
                              <Badge key={tagIndex} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {tip.tags.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{tip.tags.length - 5} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBookmark(tip.id)}
                        className={tip.isBookmarked ? 'text-amber-500' : 'text-slate-400'}
                      >
                        <Bookmark className={`w-4 h-4 ${tip.isBookmarked ? 'fill-current' : ''}`} />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Read Analysis
                        </Button>
                        {tip.sourceUrl && (
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Source
                          </Button>
                        )}
                      </div>
                      
                      <div className="text-xs text-slate-500">
                        {tip.timeHorizon} term • {tip.source}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Footer Stats */}
          {!isLoading && filteredTips.length > 0 && (
            <div className="text-center text-sm text-slate-500 pt-4 border-t">
              Showing {filteredTips.length} of {tips.length} investment tips
              {(selectedCategory !== 'all' || selectedSource !== 'all' || selectedRisk !== 'all' || searchQuery) && (
                <span> • Filters applied</span>
              )}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
