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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
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
  const [selectedTip, setSelectedTip] = useState<InvestmentTip | null>(null);
  
  // Helper functions to map API response to frontend format
  const mapApiCategory = (apiCategory: string) => {
    const mapping: { [key: string]: string } = {
      'MARKET_ANALYSIS': 'market-analysis',
      'RISK_MANAGEMENT': 'stocks',
      'PORTFOLIO_OPTIMIZATION': 'mutual-funds',
      'SECTOR_INSIGHTS': 'stocks'
    };
    return mapping[apiCategory] || 'market-analysis';
  };

  const mapApiRiskLevel = (apiRiskLevels: string[] | string) => {
    if (Array.isArray(apiRiskLevels) && apiRiskLevels.length > 0) {
      return apiRiskLevels[0].toLowerCase();
    }
    if (typeof apiRiskLevels === 'string') {
      return apiRiskLevels.toLowerCase();
    }
    return 'medium';
  };

  const handleReadAnalysis = (tip: InvestmentTip) => {
    setSelectedTip(tip);
  };

  const mapApiMarketImpact = (apiMarketImpact: string) => {
    const mapping: { [key: string]: string } = {
      'LOW': 'neutral',
      'MEDIUM': 'bullish',
      'HIGH': 'bullish'
    };
    return mapping[apiMarketImpact] || 'neutral';
  };
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // New states for API parameters
  const [apiCategory, setApiCategory] = useState<string>('MARKET_ANALYSIS');
  const [apiRiskLevel, setApiRiskLevel] = useState<string>('MEDIUM');
  const [apiMarketImpact, setApiMarketImpact] = useState<string>('MEDIUM');
  const [personalized, setPersonalized] = useState<boolean>(true);

  useEffect(() => {
    fetchStoredTips();
  }, []);

  const handleGenerateClick = () => {
    generateAndLoadTips();
  };

  const processTipsResponse = (data: any) => {
    if (data.success && data.data && Array.isArray(data.data.tips)) {
      const mappedTips = data.data.tips.map((tip: any) => ({
        id: tip.id || tip._id,
        title: tip.title,
        summary: tip.summary || tip.content?.substring(0, 150) + '...' || 'AI-generated investment insight',
        content: tip.content,
        category: mapApiCategory(tip.category) || 'market-analysis',
        riskLevel: mapApiRiskLevel(tip.applicableRiskLevel) || 'medium',
        timeHorizon: tip.timeHorizon || 'medium',
        source: 'AI Analysis',
        author: 'FinSight AI',
        publishedAt: tip.publishedAt || new Date().toISOString(),
        readTime: '3 min read',
        tags: tip.tags || [],
        isBookmarked: false,
        viewCount: tip.viewCount || Math.floor(Math.random() * 1000),
        confidence: tip.aiConfidenceScore || 85,
        sourceUrl: tip.sourceUrl,
        isPremium: tip.isPremium || false,
        marketImpact: mapApiMarketImpact(tip.marketImpact) || 'neutral'
      }));
      setTips(mappedTips);
      setFilteredTips(mappedTips);
    } else {
      console.log('No tips found in API response');
      setTips([]);
      setFilteredTips([]);
    }
  };

  const fetchStoredTips = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/ai/investment-tips`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Stored investment tips API response:', data);
        processTipsResponse(data);
      } else {
        console.error('Failed to load stored investment tips:', response.statusText);
        setTips([]);
        setFilteredTips([]);
      }
    } catch (error) {
      console.error('Error loading stored investment tips:', error);
      setTips([]);
      setFilteredTips([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Renamed from loadInvestmentTips
  const generateAndLoadTips = async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams();
      if (apiCategory !== 'all') params.append('category', apiCategory);
      if (apiRiskLevel !== 'all') params.append('riskLevel', apiRiskLevel);
      if (apiMarketImpact !== 'all') params.append('marketImpact', apiMarketImpact);
      params.append('personalized', personalized.toString());
      params.append('generateNew', 'true'); // Explicitly request generation
      params.append('limit', '20');
      params.append('offset', '0');
      
      const response = await fetch(`/api/ai/investment-tips?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Generated investment tips API response:', data);
        processTipsResponse(data);
      } else {
        console.error('Failed to generate investment tips:', response.statusText);
        setTips([]);
        setFilteredTips([]);
      }
    } catch (error) {
      console.error('Error generating investment tips:', error);
      setTips([]);
      setFilteredTips([]);
    } finally {
      setIsLoading(false);
    }
  };

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
    fetchStoredTips();
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
              
              {/* AI Parameters Section */}
              <div className="mt-4 pt-4 border-t border-slate-200">
                <div className="flex items-center mb-3">
                  <Bot className="w-4 h-4 mr-2 text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">AI Tip Generation Parameters</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs text-slate-600 mb-1 block">Category Focus</label>
                    <Select value={apiCategory} onValueChange={setApiCategory}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="MARKET_ANALYSIS">Market Analysis</SelectItem>
                        <SelectItem value="RISK_MANAGEMENT">Risk Management</SelectItem>
                        <SelectItem value="PORTFOLIO_OPTIMIZATION">Portfolio Optimization</SelectItem>
                        <SelectItem value="SECTOR_INSIGHTS">Sector Insights</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-slate-600 mb-1 block">Risk Appetite</label>
                    <Select value={apiRiskLevel} onValueChange={setApiRiskLevel}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Risk Level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Risk Levels</SelectItem>
                        <SelectItem value="LOW">Conservative (Low)</SelectItem>
                        <SelectItem value="MEDIUM">Moderate (Medium)</SelectItem>
                        <SelectItem value="HIGH">Aggressive (High)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-slate-600 mb-1 block">Market Impact</label>
                    <Select value={apiMarketImpact} onValueChange={setApiMarketImpact}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Impact" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Impact Levels</SelectItem>
                        <SelectItem value="LOW">Low Impact</SelectItem>
                        <SelectItem value="MEDIUM">Medium Impact</SelectItem>
                        <SelectItem value="HIGH">High Impact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-xs text-slate-600 mb-1 block">Personalization</label>
                    <Select 
                      value={personalized.toString()} 
                      onValueChange={(value) => setPersonalized(value === 'true')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Personalized" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Personalized Tips</SelectItem>
                        <SelectItem value="false">General Tips</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end mt-3">
                  <Button 
                    onClick={handleGenerateClick} 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate AI Tips
                  </Button>
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
                        <Button variant="outline" size="sm" onClick={() => handleReadAnalysis(tip)}>
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

        {selectedTip && (
          <Dialog open={!!selectedTip} onOpenChange={(isOpen) => !isOpen && setSelectedTip(null)}>
            <DialogContent className="sm:max-w-[700px] max-h-[80vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-xl font-bold pr-6">{selectedTip.title}</DialogTitle>
                <div className="flex items-center flex-wrap gap-2 text-sm text-slate-500 pt-2">
                  <div className="flex items-center space-x-1">
                    {getSourceIcon(selectedTip.source)}
                    <span>{selectedTip.author}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{selectedTip.readTime}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatDate(selectedTip.publishedAt)}</span>
                  </div>
                  <Badge className={getRiskColor(selectedTip.riskLevel)}>
                    <span className="capitalize">{selectedTip.riskLevel} Risk</span>
                  </Badge>
                  {selectedTip.confidence && (
                    <Badge variant="outline" className="text-xs">
                      {selectedTip.confidence}% confidence
                    </Badge>
                  )}
                  <div className="flex items-center">
                    {getMarketImpactIcon(selectedTip.marketImpact)}
                    <span className="ml-1 capitalize text-xs">{selectedTip.marketImpact}</span>
                  </div>
                </div>
              </DialogHeader>
              <div className="prose max-w-none text-slate-700 leading-relaxed py-4 overflow-y-auto flex-1">
                {selectedTip.content.split('\\n').map((paragraph, index) => (
                  <p key={index} className="mb-3">{paragraph}</p>
                ))}
                
                {selectedTip.tags.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Related Topics:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTip.tags.map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
