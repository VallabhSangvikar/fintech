'use client';

import { useState, useEffect } from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  Bookmark, 
  Clock, 
  ExternalLink, 
  Filter, 
  Sparkles, 
  Target, 
  TrendingDown, 
  Eye, 
  RefreshCw,
  Bot,
  User,
  Newspaper,
  FileText,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  const [tips, setTips] = useState<InvestmentTip[]>([]);
  const [filteredTips, setFilteredTips] = useState<InvestmentTip[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Professional investment tips data
  const professionalTips: InvestmentTip[] = [
    {
      id: '1',
      title: 'AI-Powered Tech Sector Analysis: Strong Buy Signals Detected',
      summary: 'Advanced AI algorithms identify compelling opportunities in cloud computing, AI infrastructure, and cybersecurity stocks with 87% confidence rating.',
      content: 'Our proprietary AI engine has analyzed over 500 technology companies and identified strong momentum in the sector. Key drivers include enterprise AI adoption accelerating 40% year-over-year, cloud migration hitting new highs, and cybersecurity spending increasing due to global threats. Recommended exposure: 15-20% portfolio allocation through diversified tech ETFs like NASDAQ-100 or sector-specific funds.',
      category: 'stocks',
      riskLevel: 'medium',
      timeHorizon: 'medium',
      source: 'AI Analysis',
      author: 'FinSight AI Engine',
      publishedAt: '2024-01-16T08:30:00Z',
      readTime: '4 min',
      tags: ['Technology', 'AI', 'Cloud Computing', 'ETF', 'Growth'],
      isBookmarked: false,
      viewCount: 2847,
      confidence: 87,
      isPremium: false,
      marketImpact: 'bullish'
    },
    {
      id: '2',
      title: 'Fixed Income Alert: Government Bond Yields Hit Sweet Spot',
      summary: '10-year government bonds now offering 7.6% yield - highest in 15 years. Conservative investors should consider immediate allocation.',
      content: 'Government bond yields have reached historically attractive levels, offering real returns after inflation for the first time in years. With RBI signaling peak rates, this could be an optimal entry point. Strategy: Consider 30-40% allocation for conservative portfolios, ladder maturities from 3-10 years to capture yield while managing reinvestment risk. Corporate bonds offering additional 100-150 bps spread for moderate risk tolerance.',
      category: 'bonds',
      riskLevel: 'low',
      timeHorizon: 'long',
      source: 'Expert Analyst',
      author: 'Rajesh Kumar, CFA',
      publishedAt: '2024-01-16T06:15:00Z',
      readTime: '6 min',
      tags: ['Bonds', 'Fixed Income', 'Interest Rates', 'Conservative', 'Yield'],
      isBookmarked: true,
      viewCount: 1892,
      isPremium: false,
      marketImpact: 'bullish'
    },
    {
      id: '3',
      title: 'BREAKING: RBI Holds Rates Steady - Market Impact Analysis',
      summary: 'Reserve Bank maintains 6.50% repo rate, citing inflation concerns. Banking and FMCG sectors expected to outperform.',
      content: 'RBI\'s decision to maintain current rates while shifting stance to "neutral" signals cautious optimism. Key implications: 1) Banking sector margins stabilize, 2) FMCG companies benefit from steady consumer demand, 3) Real estate sector faces continued pressure, 4) IT services gain from stable rupee. Immediate action: Rotate from rate-sensitive sectors to defensive plays.',
      category: 'economic-news',
      riskLevel: 'low',
      timeHorizon: 'short',
      source: 'Market News',
      author: 'Economic Times Research',
      publishedAt: '2024-01-15T14:20:00Z',
      readTime: '3 min',
      tags: ['RBI', 'Monetary Policy', 'Banking', 'FMCG', 'Interest Rates'],
      isBookmarked: false,
      viewCount: 4156,
      sourceUrl: 'https://economictimes.com/rbi-policy-analysis',
      isPremium: false,
      marketImpact: 'neutral'
    },
    {
      id: '4',
      title: 'Gold Investment Strategy: Digital Gold vs Physical vs ETFs',
      summary: 'Comprehensive analysis of gold investment options as prices stabilize near ₹62,000/10g. Optimal allocation strategies revealed.',
      content: 'Gold maintains its role as portfolio diversifier amid global uncertainties. Analysis of options: 1) Physical gold: Storage costs, making charges reduce returns, 2) Gold ETFs: Most cost-effective, high liquidity, 3) Digital gold: Convenient but higher costs, 4) Gold mutual funds: Professional management, added fees. Recommendation: 5-8% portfolio allocation through Gold ETFs for optimal cost-benefit ratio.',
      category: 'commodities',
      riskLevel: 'low',
      timeHorizon: 'long',
      source: 'Research Report',
      author: 'Commodity Research Desk',
      publishedAt: '2024-01-15T11:45:00Z',
      readTime: '7 min',
      tags: ['Gold', 'Commodities', 'ETF', 'Diversification', 'Portfolio'],
      isBookmarked: true,
      viewCount: 1743,
      isPremium: true,
      marketImpact: 'bullish'
    },
    {
      id: '5',
      title: 'SIP Masterclass: Large Cap vs Mid Cap vs Small Cap Strategy',
      summary: 'Data-driven analysis of SIP performance across market caps. Optimal allocation model for different risk profiles revealed.',
      content: 'Historical analysis of 10-year SIP returns shows: Large Cap (12.5% CAGR, low volatility), Mid Cap (15.8% CAGR, moderate volatility), Small Cap (18.2% CAGR, high volatility). Optimal strategy: Core-Satellite approach - 60% Large Cap (stability), 25% Mid Cap (growth), 15% Small Cap (alpha generation). Start with ₹10,000 monthly, increase 10% annually to combat inflation.',
      category: 'mutual-funds',
      riskLevel: 'medium',
      timeHorizon: 'long',
      source: 'Expert Analyst',
      author: 'Priya Sharma, Fund Manager',
      publishedAt: '2024-01-14T16:30:00Z',
      readTime: '8 min',
      tags: ['SIP', 'Mutual Funds', 'Asset Allocation', 'Long-term', 'Strategy'],
      isBookmarked: false,
      viewCount: 3583,
      isPremium: true,
      marketImpact: 'bullish'
    },
    {
      id: '6',
      title: 'Crypto Alert: Bitcoin Technical Analysis - Consolidation Breakout',
      summary: 'Bitcoin shows strong accumulation patterns near $42,000. Technical indicators suggest potential 25% upside in Q2 2024.',
      content: 'Technical analysis reveals: 1) Bitcoin consolidating in $40,000-$45,000 range for 8 weeks, 2) On-chain metrics show institutional accumulation, 3) RSI reset to healthy levels, 4) Volume profile supports upward breakout. Risk management: Only 2-5% portfolio allocation, strict stop-loss at $38,000. Alternative: Bitcoin ETFs for regulated exposure without custody risks.',
      category: 'crypto',
      riskLevel: 'high',
      timeHorizon: 'short',
      source: 'AI Analysis',
      author: 'Crypto Analytics AI',
      publishedAt: '2024-01-14T12:00:00Z',
      readTime: '5 min',
      tags: ['Bitcoin', 'Cryptocurrency', 'Technical Analysis', 'High Risk', 'ETF'],
      isBookmarked: false,
      viewCount: 2167,
      confidence: 73,
      isPremium: true,
      marketImpact: 'bullish'
    },
    {
      id: '7',
      title: 'Market Outlook 2024: Sectoral Rotation Strategy Ahead',
      summary: 'Comprehensive market analysis predicts sectoral shifts. IT and Pharma set to outperform, while Banking faces headwinds.',
      content: 'Market analysis indicates major sectoral rotation: OUTPERFORM - IT (AI boom, stable margins), Pharma (new drug approvals, export recovery), Consumer Goods (rural recovery). UNDERPERFORM - Banking (NPA concerns), Real Estate (high interest rates), Metals (China slowdown). Strategy: Gradually shift allocations over next 2 quarters, maintain diversification.',
      category: 'market-analysis',
      riskLevel: 'medium',
      timeHorizon: 'medium',
      source: 'Research Report',
      author: 'Market Strategy Team',
      publishedAt: '2024-01-13T09:00:00Z',
      readTime: '10 min',
      tags: ['Market Outlook', 'Sectoral Analysis', 'IT', 'Pharma', 'Strategy'],
      isBookmarked: true,
      viewCount: 5234,
      isPremium: true,
      marketImpact: 'neutral'
    },
    {
      id: '8',
      title: 'ESG Investing: Sustainable Funds Beating Traditional Returns',
      summary: 'ESG-focused mutual funds delivering superior risk-adjusted returns. Environmental regulations driving investment flows.',
      content: 'ESG funds show 2.3% outperformance over traditional funds in last 3 years while reducing portfolio risk by 15%. Key drivers: regulatory support, corporate governance improvements, environmental compliance requirements. Top ESG themes: Clean energy, water management, sustainable agriculture. Recommended allocation: 20-30% of equity portfolio through dedicated ESG funds.',
      category: 'mutual-funds',
      riskLevel: 'medium',
      timeHorizon: 'long',
      source: 'Expert Analyst',
      author: 'Sustainable Finance Team',
      publishedAt: '2024-01-12T14:15:00Z',
      readTime: '6 min',
      tags: ['ESG', 'Sustainable Investing', 'Clean Energy', 'Mutual Funds', 'Risk-adjusted'],
      isBookmarked: false,
      viewCount: 1456,
      isPremium: false,
      marketImpact: 'bullish'
    }
  ];

  useEffect(() => {
    // Simulate API call with realistic loading time
    setIsLoading(true);
    setTimeout(() => {
      setTips(professionalTips);
      setFilteredTips(professionalTips);
      setIsLoading(false);
    }, 1200);
  }, []);

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
        tip.author.toLowerCase().includes(query) ||
        tip.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    setFilteredTips(filtered);
  }, [tips, selectedCategory, selectedSource, selectedRisk, searchQuery]);

  const categoryColors = {
    'stocks': 'bg-blue-100 text-blue-800 border-blue-200',
    'mutual-funds': 'bg-green-100 text-green-800 border-green-200',
    'bonds': 'bg-purple-100 text-purple-800 border-purple-200',
    'crypto': 'bg-orange-100 text-orange-800 border-orange-200',
    'commodities': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'market-analysis': 'bg-indigo-100 text-indigo-800 border-indigo-200',
    'economic-news': 'bg-red-100 text-red-800 border-red-200'
  };

  const riskColors = {
    'low': 'bg-green-100 text-green-700 border-green-200',
    'medium': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'high': 'bg-red-100 text-red-700 border-red-200'
  };

  const sourceIcons = {
    'AI Analysis': Bot,
    'Expert Analyst': User,
    'Market News': Newspaper,
    'Research Report': FileText
  };

  const handleBookmark = (id: string) => {
    setTips(prevTips => prevTips.map(tip => 
      tip.id === id ? { ...tip, isBookmarked: !tip.isBookmarked } : tip
    ));
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      // Simulate new tips being fetched
      const shuffledTips = [...professionalTips].sort(() => Math.random() - 0.5);
      setTips(shuffledTips);
      setIsLoading(false);
    }, 800);
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

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedSource('all');
    setSelectedRisk('all');
    setSearchQuery('');
  };

  return (
    <DashboardLayout currentPage="investment-tips">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
              <Lightbulb className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Investment Tips</h1>
              <p className="text-slate-600 mt-1">Expert insights, AI analysis, and market intelligence</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="px-3 py-1">
              {tips.filter(t => t.isBookmarked).length} Bookmarked
            </Badge>
            <Button 
              onClick={handleRefresh} 
              disabled={isLoading} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters Bar */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search tips, authors, tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="stocks">📈 Stocks</SelectItem>
                  <SelectItem value="mutual-funds">🏛️ Mutual Funds</SelectItem>
                  <SelectItem value="bonds">📊 Bonds</SelectItem>
                  <SelectItem value="commodities">🏆 Commodities</SelectItem>
                  <SelectItem value="crypto">₿ Cryptocurrency</SelectItem>
                  <SelectItem value="market-analysis">📋 Market Analysis</SelectItem>
                  <SelectItem value="economic-news">📰 Economic News</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Source Filter */}
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="AI Analysis">🤖 AI Analysis</SelectItem>
                  <SelectItem value="Expert Analyst">👨‍💼 Expert Analyst</SelectItem>
                  <SelectItem value="Market News">📰 Market News</SelectItem>
                  <SelectItem value="Research Report">📄 Research Report</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Risk Filter */}
              <Select value={selectedRisk} onValueChange={setSelectedRisk}>
                <SelectTrigger>
                  <SelectValue placeholder="All Risk Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">🟢 Low Risk</SelectItem>
                  <SelectItem value="medium">🟡 Medium Risk</SelectItem>
                  <SelectItem value="high">🔴 High Risk</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Results & Clear */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  <span className="font-semibold text-slate-900">{filteredTips.length}</span> tips
                </div>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="h-5 w-20 bg-slate-200 rounded"></div>
                    <div className="h-5 w-16 bg-slate-200 rounded"></div>
                  </div>
                  <div className="h-5 bg-slate-200 rounded mb-3"></div>
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-24 bg-slate-200 rounded"></div>
                    <div className="h-8 w-8 bg-slate-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tips Grid */}
        {!isLoading && filteredTips.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTips.map(tip => {
              const SourceIcon = sourceIcons[tip.source];
              
              return (
                <Card key={tip.id} className="hover:shadow-xl transition-all duration-200 relative group">
                  <CardContent className="p-6">
                    {/* Premium Badge */}
                    {tip.isPremium && (
                      <div className="absolute -top-2 -right-2">
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-2 py-1 shadow-lg">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      </div>
                    )}
                    
                    {/* Header Badges */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Badge className={`text-xs px-2 py-1 border ${categoryColors[tip.category]}`}>
                          {tip.category.replace('-', ' ').toUpperCase()}
                        </Badge>
                        <Badge className={`text-xs px-2 py-1 border ${riskColors[tip.riskLevel]}`}>
                          {tip.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                      <div className={`flex items-center text-xs px-2 py-1 rounded-full border ${
                        tip.marketImpact === 'bullish' ? 'bg-green-50 text-green-700 border-green-200' :
                        tip.marketImpact === 'bearish' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-gray-50 text-gray-700 border-gray-200'
                      }`}>
                        {tip.marketImpact === 'bullish' && <TrendingUp className="w-3 h-3 mr-1" />}
                        {tip.marketImpact === 'bearish' && <TrendingDown className="w-3 h-3 mr-1" />}
                        {tip.marketImpact === 'neutral' && <Target className="w-3 h-3 mr-1" />}
                        {tip.marketImpact}
                      </div>
                    </div>
                    
                    {/* Title & Summary */}
                    <h3 className="font-bold text-slate-900 mb-3 text-base leading-tight line-clamp-2">
                      {tip.title}
                    </h3>
                    
                    <p className="text-slate-600 text-sm mb-4 line-clamp-3 leading-relaxed">
                      {tip.summary}
                    </p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {tip.tags.slice(0, 4).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs px-2 py-0.5">
                          {tag}
                        </Badge>
                      ))}
                      {tip.tags.length > 4 && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5 text-slate-500">
                          +{tip.tags.length - 4}
                        </Badge>
                      )}
                    </div>
                    
                    {/* AI Confidence Score */}
                    {tip.confidence && (
                      <div className="mb-4 p-3 bg-slate-50 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Bot className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-medium text-slate-700">AI Confidence</span>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{tip.confidence}%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              tip.confidence >= 80 ? 'bg-green-500' :
                              tip.confidence >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${tip.confidence}%` }}
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center space-x-3 text-slate-500 text-xs">
                        <div className="flex items-center space-x-1">
                          <SourceIcon className="w-3 h-3" />
                          <span className="max-w-20 truncate">{tip.author.split(',')[0]}</span>
                        </div>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{tip.readTime}</span>
                        </span>
                        <span>{formatDate(tip.publishedAt)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center space-x-1 text-xs text-slate-500">
                          <Eye className="w-3 h-3" />
                          <span>{tip.viewCount.toLocaleString()}</span>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBookmark(tip.id)}
                          className={`h-8 w-8 p-0 transition-colors ${
                            tip.isBookmarked ? 'text-blue-600 hover:text-blue-700' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <Bookmark className={`w-4 h-4 ${tip.isBookmarked ? 'fill-current' : ''}`} />
                        </Button>
                        
                        {tip.sourceUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(tip.sourceUrl, '_blank')}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTips.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Filter className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No investment tips found</h3>
              <p className="text-slate-600 mb-6 max-w-md mx-auto">
                Try adjusting your search terms or filters to discover relevant investment insights
              </p>
              <Button variant="outline" onClick={clearFilters}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Clear All Filters
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
