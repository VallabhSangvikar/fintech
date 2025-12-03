'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, GitCompare, Sparkles, Info, Plus, BarChart3, Compass, Bot, Send } from 'lucide-react';
import MarketIndices from './MarketIndices';
import StockSearch from './StockSearch';
import StockCard from './StockCard';
import StockComparison from './StockComparison';
import MarkdownResponse from './MarkdownResponse';

interface SelectedStock {
  ticker: string;
  name: string;
}

type TabType = 'stocks' | 'sentiment' | 'compare' | 'sectors' | 'analyst' | 'news' | 'agent';

export default function StockHubDashboard() {
  const [selectedStocks, setSelectedStocks] = useState<SelectedStock[]>([]);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [showInfo, setShowInfo] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('stocks');
  
  // Market Insights State
  const [marketSentiment, setMarketSentiment] = useState<any>(null);
  const [stockComparisonData, setStockComparisonData] = useState<any>(null);
  const [sectorInsights, setSectorInsights] = useState<any>(null);
  const [compareInput, setCompareInput] = useState('');
  const [sectorInput, setSectorInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Enhanced Compare State (Finnhub)
  const [compareSymbol1, setCompareSymbol1] = useState('AAPL');
  const [compareSymbol2, setCompareSymbol2] = useState('MSFT');
  const [finnhubCompareData, setFinnhubCompareData] = useState<any>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  
  // AI Agent State
  const [agentQuery, setAgentQuery] = useState('');
  const [agentResponse, setAgentResponse] = useState<any>(null);
  const [customSectorTickers, setCustomSectorTickers] = useState('');
  
  // Analyst Insights State (Finnhub)
  const [analystSymbol, setAnalystSymbol] = useState('AAPL');
  const [analystData, setAnalystData] = useState<any>(null);
  const [analystLoading, setAnalystLoading] = useState(false);
  
  // News State (Finnhub)
  const [newsSymbol, setNewsSymbol] = useState('AAPL');
  const [companyNews, setCompanyNews] = useState<any>(null);
  const [marketNews, setMarketNews] = useState<any>(null);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsType, setNewsType] = useState<'company' | 'market'>('company');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('stockhub-selected');
    if (saved) {
      try {
        setSelectedStocks(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load saved stocks');
      }
    } else {
      // Default stocks to show
      setSelectedStocks([
        { ticker: 'RELIANCE.NS', name: 'Reliance Industries' },
        { ticker: 'TCS.NS', name: 'Tata Consultancy Services' },
      ]);
    }
  }, []);

  // Save to localStorage when changed
  useEffect(() => {
    if (selectedStocks.length > 0) {
      localStorage.setItem('stockhub-selected', JSON.stringify(selectedStocks));
    }
  }, [selectedStocks]);

  const handleSelectStock = (ticker: string, name: string) => {
    // Check if already added
    if (selectedStocks.some(s => s.ticker === ticker)) {
      alert(`${name} is already added!`);
      return;
    }

    // Maximum 6 stocks
    if (selectedStocks.length >= 6) {
      alert('Maximum 6 stocks can be tracked at once. Remove some to add more.');
      return;
    }

    setSelectedStocks([...selectedStocks, { ticker, name }]);
  };

  const handleRemoveStock = (ticker: string) => {
    setSelectedStocks(selectedStocks.filter(s => s.ticker !== ticker));
  };

  // Market Insights Functions - Enhanced with Finnhub
  const fetchMarketSentiment = async () => {
    setLoading(true);
    try {
      // Try Finnhub first for better quality
      const res = await fetch('http://localhost:8000/api/market-insights/finnhub/sentiment');
      const data = await res.json();
      setMarketSentiment(data);
    } catch (error) {
      console.error('Failed to fetch market sentiment:', error);
      // Fallback is handled by backend
    } finally {
      setLoading(false);
    }
  };

  const fetchStockComparison = async () => {
    if (!compareInput.trim()) return;
    setLoading(true);
    try {
      // Extract two companies from input (e.g., "TCS vs Infosys", "Barclays vs BlackRock")
      const parts = compareInput.split(/vs|and|,/i).map(s => s.trim());
      if (parts.length < 2) {
        alert('Please enter two companies to compare (e.g., "TCS vs Infosys" or "Barclays vs BlackRock")');
        setLoading(false);
        return;
      }

      // Send company names/tickers as-is - backend will resolve them
      const ticker1 = parts[0];
      const ticker2 = parts[1];

      // Try Finnhub first for enhanced data (includes analyst ratings)
      const res = await fetch(`http://localhost:8000/api/market-insights/finnhub/compare?ticker1=${encodeURIComponent(ticker1)}&ticker2=${encodeURIComponent(ticker2)}`);
      const data = await res.json();
      setStockComparisonData(data);
    } catch (error) {
      console.error('Failed to compare stocks:', error);
      // Fallback is handled by backend
    } finally {
      setLoading(false);
    }
  };

  const fetchSectorInsights = async () => {
    if (!sectorInput.trim()) return;
    setLoading(true);
    try {
      // Try Finnhub first for enhanced data (includes analyst consensus)
      const res = await fetch(`http://localhost:8000/api/market-insights/finnhub/sector?sector=${encodeURIComponent(sectorInput)}`);
      const data = await res.json();
      setSectorInsights(data);
    } catch (error) {
      console.error('Failed to fetch sector insights:', error);
      // Fallback is handled by backend
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentResponse = async () => {
    if (!agentQuery.trim()) return;
    setLoading(true);
    try {
      const trackedTickers = selectedStocks.map(s => s.ticker);
      const res = await fetch('http://localhost:8000/api/stock-hub/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: agentQuery,
          tracked_tickers: trackedTickers
        })
      });
      const data = await res.json();
      setAgentResponse(data);
    } catch (error) {
      console.error('Failed to get agent response:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeCustomStocks = async () => {
    if (!customSectorTickers.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/stock-hub/sector/custom?tickers=${encodeURIComponent(customSectorTickers)}`);
      const data = await res.json();
      setSectorInsights(data);
    } catch (error) {
      console.error('Failed to analyze custom stocks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Analyst Recommendations from Finnhub
  const fetchAnalystInsights = async (symbol: string) => {
    setAnalystLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/finnhub/recommendations/${symbol}`);
      const data = await res.json();
      if (data.success) {
        setAnalystData(data);
      } else {
        setAnalystData({ error: data.error || 'Failed to fetch analyst data' });
      }
    } catch (error) {
      console.error('Failed to fetch analyst insights:', error);
      setAnalystData({ error: 'Network error' });
    } finally {
      setAnalystLoading(false);
    }
  };

  // Fetch Company News from Finnhub
  const fetchCompanyNews = async (symbol: string, days: number = 7) => {
    setNewsLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/finnhub/news/${symbol}?days=${days}`);
      const data = await res.json();
      setCompanyNews(data);
    } catch (error) {
      console.error('Failed to fetch company news:', error);
      setCompanyNews({ error: 'Network error' });
    } finally {
      setNewsLoading(false);
    }
  };

  // Fetch Market News from Finnhub
  const fetchMarketNews = async () => {
    setNewsLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/finnhub/market-news');
      const data = await res.json();
      setMarketNews(data);
    } catch (error) {
      console.error('Failed to fetch market news:', error);
      setMarketNews({ error: 'Network error' });
    } finally {
      setNewsLoading(false);
    }
  };

  // Enhanced Finnhub Stock Comparison
  const fetchFinnhubComparison = async () => {
    if (!compareSymbol1 || !compareSymbol2) return;
    setCompareLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/finnhub/compare?symbol1=${compareSymbol1}&symbol2=${compareSymbol2}`);
      const data = await res.json();
      setFinnhubCompareData(data);
    } catch (error) {
      console.error('Failed to compare stocks:', error);
      setFinnhubCompareData({ error: 'Network error' });
    } finally {
      setCompareLoading(false);
    }
  };

  const toggleComparisonMode = () => {
    if (!comparisonMode && selectedStocks.length < 2) {
      alert('Add at least 2 stocks to use comparison mode');
      return;
    }
    setComparisonMode(!comparisonMode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl shadow-lg">
              <TrendingUp className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-1">Stock Hub</h1>
              <p className="text-gray-400">Live market data • Real-time tracking • Compare stocks</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <Info className="text-gray-400" size={20} />
          </button>
        </div>

        {/* Info Banner */}
        {showInfo && (
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-lg rounded-xl p-4 border border-blue-500/30 mb-6">
            <div className="flex items-start gap-3">
              <Sparkles className="text-blue-400 flex-shrink-0 mt-1" size={20} />
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Welcome to Stock Hub - Your Complete Market Insights Platform!</h3>
                <p className="text-sm text-gray-300">
                  Track real-time stock prices, compare companies, analyze market sentiment, discover sector opportunities, and view interactive charts. 
                  Search for ANY Indian stock using company name or ticker - AI-powered universal search.
                </p>
              </div>
              <button
                onClick={() => setShowInfo(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('stocks')}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'stocks'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            <TrendingUp size={20} />
            My Stocks
          </button>
          <button
            onClick={() => {
              setActiveTab('sentiment');
              if (!marketSentiment) fetchMarketSentiment();
            }}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'sentiment'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            <BarChart3 size={20} />
            Market Sentiment
          </button>
          <button
            onClick={() => setActiveTab('compare')}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'compare'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            <GitCompare size={20} />
            Compare Stocks
          </button>
          <button
            onClick={() => setActiveTab('sectors')}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'sectors'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            <Compass size={20} />
            Sector Insights
          </button>
          <button
            onClick={() => {
              setActiveTab('analyst');
              if (!analystData) fetchAnalystInsights(analystSymbol);
            }}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'analyst'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            <TrendingUp size={20} />
            Analyst Insights 📊
          </button>
          <button
            onClick={() => {
              setActiveTab('news');
              if (!companyNews && !marketNews) fetchCompanyNews(newsSymbol);
            }}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'news'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            <Sparkles size={20} />
            News Hub 📰
          </button>
          <button
            onClick={() => setActiveTab('agent')}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeTab === 'agent'
                ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
            }`}
          >
            <Bot size={20} />
            AI Agent 🌟
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* STOCKS TAB */}
        {activeTab === 'stocks' && (
          <>
            {/* Market Indices */}
            <MarketIndices />

            {/* Search & Controls */}
            <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 w-full">
              <StockSearch onSelectStock={handleSelectStock} />
            </div>
            
            <button
              onClick={toggleComparisonMode}
              className={`
                px-6 py-4 rounded-xl font-semibold
                flex items-center gap-2 whitespace-nowrap
                transition-all duration-300
                ${comparisonMode
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/50'
                  : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/10'
                }
              `}
            >
              <GitCompare size={20} />
              {comparisonMode ? 'Exit Comparison' : 'Compare Stocks'}
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>{selectedStocks.length}/6 stocks tracked</span>
            {selectedStocks.length === 6 && (
              <span className="text-yellow-400">• Maximum reached</span>
            )}
          </div>
        </div>

        {/* Comparison View or Stock Cards */}
        {comparisonMode && selectedStocks.length >= 2 ? (
          <StockComparison
            tickers={selectedStocks.map(s => s.ticker)}
            onRemove={handleRemoveStock}
          />
        ) : (
          <>
            {/* Stock Cards Grid */}
            {selectedStocks.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedStocks.map((stock) => (
                  <StockCard
                    key={stock.ticker}
                    ticker={stock.ticker}
                    name={stock.name}
                    onRemove={() => handleRemoveStock(stock.ticker)}
                    autoRefresh={true}
                    useFinnhub={true}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg rounded-xl p-12 border border-white/10 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Plus className="text-white" size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Start Tracking Stocks</h3>
                  <p className="text-gray-400 mb-6">
                    Search for stocks above and add them to your dashboard. Track real-time prices, 
                    view charts, and compare performance.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {['TCS.NS', 'RELIANCE.NS', 'INFY.NS', 'HDFCBANK.NS'].map((ticker) => (
                      <button
                        key={ticker}
                        onClick={() => handleSelectStock(ticker, ticker.replace('.NS', ''))}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-gray-300 border border-white/10 transition-colors"
                      >
                        + {ticker.replace('.NS', '')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

            {/* Tips Section */}
            <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4">💡 Pro Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-blue-400 font-semibold mb-2">📊 Live Updates</div>
              <p className="text-sm text-gray-400">
                Stock prices automatically refresh every 15 seconds for real-time tracking
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-green-400 font-semibold mb-2">📈 Interactive Charts</div>
              <p className="text-sm text-gray-400">
                Click "View Chart" on any stock card to see historical price movements
              </p>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-purple-400 font-semibold mb-2">⚖️ Compare</div>
              <p className="text-sm text-gray-400">
                Add 2+ stocks and use Compare mode to analyze them side-by-side
              </p>
            </div>
          </div>
            </div>
          </>
        )}

        {/* MARKET SENTIMENT TAB */}
        {activeTab === 'sentiment' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg rounded-xl p-8 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <BarChart3 className="text-blue-400" />
                  Market Sentiment Analysis
                </h2>
                {/* Data Source Badge */}
                {marketSentiment?.source && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    marketSentiment.source === 'Finnhub' 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    📊 {marketSentiment.source}
                  </span>
                )}
              </div>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-400 mt-4">Analyzing market trends with professional data...</p>
                </div>
              ) : marketSentiment?.success ? (
                <>
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-gray-300">
                      {marketSentiment.analysis}
                    </div>
                  </div>
                  
                  {/* News Sources with Links */}
                  {marketSentiment.articles && marketSentiment.articles.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <span>📰</span> News Sources ({marketSentiment.articles.length})
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {marketSentiment.articles.slice(0, 10).map((article: any, idx: number) => (
                          <a
                            key={idx}
                            href={article.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 transition-all group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-white group-hover:text-blue-400 line-clamp-2 mb-1">
                                  {article.headline}
                                </h4>
                                <p className="text-xs text-gray-400">
                                  {article.source} • {new Date(article.datetime * 1000).toLocaleDateString()}
                                </p>
                              </div>
                              <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {marketSentiment.news_count && (
                    <div className="mt-4 text-sm text-gray-500">
                      Analyzed {marketSentiment.news_count} articles • {marketSentiment.source || 'Multiple sources'}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-400">Click to fetch latest market sentiment analysis</p>
                  <button
                    onClick={fetchMarketSentiment}
                    className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                  >
                    Analyze Market
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* COMPARE STOCKS TAB */}
        {activeTab === 'compare' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg rounded-xl p-8 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <GitCompare className="text-purple-400" />
                  Compare Stocks
                </h2>
                {stockComparisonData?.source && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    stockComparisonData.source === 'Finnhub' 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    📊 {stockComparisonData.source}
                  </span>
                )}
              </div>
              
              <div className="mb-6">
                <input
                  type="text"
                  value={compareInput}
                  onChange={(e) => setCompareInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchStockComparison()}
                  placeholder="e.g., TCS vs Infosys, Reliance vs Adani"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={fetchStockComparison}
                  disabled={loading || !compareInput.trim()}
                  className="mt-3 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Comparing...' : 'Compare'}
                </button>
              </div>

              {stockComparisonData?.success && (
                <>
                  {/* Stock Info Cards with Analyst Ratings */}
                  {stockComparisonData.stock1 && stockComparisonData.stock2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {[stockComparisonData.stock1, stockComparisonData.stock2].map((stock, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-4 border border-white/10">
                          <h3 className="text-lg font-bold text-white mb-2">{stock.name}</h3>
                          <p className="text-sm text-gray-400 mb-3">{stock.ticker}</p>
                          {stock.recommendation && (
                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                stock.recommendation === 'Strong Buy' ? 'bg-green-500/20 text-green-400' :
                                stock.recommendation === 'Buy' ? 'bg-emerald-500/20 text-emerald-400' :
                                stock.recommendation === 'Hold' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-orange-500/20 text-orange-400'
                              }`}>
                                📊 {stock.recommendation}
                              </span>
                              {stock.total_analysts && (
                                <span className="text-xs text-gray-500">
                                  {stock.total_analysts} analysts
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-gray-300">
                      {stockComparisonData.comparison}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Enhanced Finnhub Comparison */}
            <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-lg rounded-xl p-8 border border-purple-500/30">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <GitCompare className="text-purple-400" />
                Detailed Finnhub Comparison
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stock 1</label>
                  <input
                    type="text"
                    value={compareSymbol1}
                    onChange={(e) => setCompareSymbol1(e.target.value.toUpperCase())}
                    placeholder="e.g., AAPL"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stock 2</label>
                  <input
                    type="text"
                    value={compareSymbol2}
                    onChange={(e) => setCompareSymbol2(e.target.value.toUpperCase())}
                    placeholder="e.g., MSFT"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <button
                onClick={fetchFinnhubComparison}
                disabled={compareLoading || !compareSymbol1 || !compareSymbol2}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
              >
                {compareLoading ? 'Comparing...' : 'Compare Stocks'}
              </button>

              {compareLoading && (
                <div className="text-center py-12 mt-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Fetching comparison data...</p>
                </div>
              )}

              {finnhubCompareData && !compareLoading && finnhubCompareData.success && (
                <div className="mt-6 space-y-6">
                  {/* Price Comparison */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[finnhubCompareData.stock1, finnhubCompareData.stock2].map((stock, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h4 className="text-lg font-bold text-white mb-4">
                          {stock.symbol} - {stock.profile?.name || 'N/A'}
                        </h4>
                        {stock.quote && (
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Price:</span>
                              <span className="text-white font-semibold">${stock.quote.current_price}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Change:</span>
                              <span className={stock.quote.change >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {stock.quote.change_percent?.toFixed(2)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">High:</span>
                              <span className="text-white">${stock.quote.high}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Low:</span>
                              <span className="text-white">${stock.quote.low}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Analyst Recommendations Comparison */}
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-white mb-4">Analyst Recommendations</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[finnhubCompareData.stock1, finnhubCompareData.stock2].map((stock, idx) => (
                        <div key={idx}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-semibold text-white">{stock.symbol}</span>
                            {stock.recommendations && (
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                stock.recommendations.recommendation === 'Strong Buy' ? 'bg-green-500/20 text-green-400' :
                                stock.recommendations.recommendation === 'Buy' ? 'bg-blue-500/20 text-blue-400' :
                                stock.recommendations.recommendation === 'Hold' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {stock.recommendations.recommendation}
                              </span>
                            )}
                          </div>
                          {stock.recommendations ? (
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between text-gray-300">
                                <span>Strong Buy:</span>
                                <span className="text-green-400">{stock.recommendations.strong_buy}</span>
                              </div>
                              <div className="flex justify-between text-gray-300">
                                <span>Buy:</span>
                                <span className="text-blue-400">{stock.recommendations.buy}</span>
                              </div>
                              <div className="flex justify-between text-gray-300">
                                <span>Hold:</span>
                                <span className="text-yellow-400">{stock.recommendations.hold}</span>
                              </div>
                              <div className="flex justify-between text-gray-300">
                                <span>Sell:</span>
                                <span className="text-orange-400">{stock.recommendations.sell}</span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No recommendation data</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financials Comparison */}
                  <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
                    <h4 className="text-lg font-bold text-white mb-4">Financial Metrics</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-3 text-gray-400">Metric</th>
                            <th className="text-center py-3 text-white">{finnhubCompareData.stock1.symbol}</th>
                            <th className="text-center py-3 text-white">{finnhubCompareData.stock2.symbol}</th>
                          </tr>
                        </thead>
                        <tbody className="text-gray-300">
                          <tr className="border-b border-white/5">
                            <td className="py-3">P/E Ratio</td>
                            <td className="text-center">{finnhubCompareData.stock1.financials?.pe_ratio?.toFixed(2) || 'N/A'}</td>
                            <td className="text-center">{finnhubCompareData.stock2.financials?.pe_ratio?.toFixed(2) || 'N/A'}</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-3">P/B Ratio</td>
                            <td className="text-center">{finnhubCompareData.stock1.financials?.pb_ratio?.toFixed(2) || 'N/A'}</td>
                            <td className="text-center">{finnhubCompareData.stock2.financials?.pb_ratio?.toFixed(2) || 'N/A'}</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-3">ROE (%)</td>
                            <td className="text-center">{finnhubCompareData.stock1.financials?.roe?.toFixed(2) || 'N/A'}</td>
                            <td className="text-center">{finnhubCompareData.stock2.financials?.roe?.toFixed(2) || 'N/A'}</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-3">Profit Margin (%)</td>
                            <td className="text-center">{finnhubCompareData.stock1.financials?.profit_margin?.toFixed(2) || 'N/A'}</td>
                            <td className="text-center">{finnhubCompareData.stock2.financials?.profit_margin?.toFixed(2) || 'N/A'}</td>
                          </tr>
                          <tr className="border-b border-white/5">
                            <td className="py-3">52W High</td>
                            <td className="text-center">${finnhubCompareData.stock1.financials?.['52_week_high'] || 'N/A'}</td>
                            <td className="text-center">${finnhubCompareData.stock2.financials?.['52_week_high'] || 'N/A'}</td>
                          </tr>
                          <tr>
                            <td className="py-3">52W Low</td>
                            <td className="text-center">${finnhubCompareData.stock1.financials?.['52_week_low'] || 'N/A'}</td>
                            <td className="text-center">${finnhubCompareData.stock2.financials?.['52_week_low'] || 'N/A'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Company Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[finnhubCompareData.stock1, finnhubCompareData.stock2].map((stock, idx) => (
                      <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h5 className="font-semibold text-white mb-3">{stock.profile?.name || stock.symbol}</h5>
                        {stock.profile && (
                          <div className="space-y-2 text-sm text-gray-300">
                            <p><span className="text-gray-400">Industry:</span> {stock.profile.industry || 'N/A'}</p>
                            <p><span className="text-gray-400">Country:</span> {stock.profile.country || 'N/A'}</p>
                            <p><span className="text-gray-400">Market Cap:</span> ${stock.profile.market_cap}B</p>
                            <p><span className="text-gray-400">Exchange:</span> {stock.profile.exchange || 'N/A'}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SECTOR INSIGHTS TAB */}
        {activeTab === 'sectors' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg rounded-xl p-8 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <Compass className="text-green-400" />
                  Sector Opportunities
                </h2>
                {sectorInsights?.source && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    sectorInsights.source === 'Finnhub' 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    📊 {sectorInsights.source}
                  </span>
                )}
              </div>
              
              <div className="mb-6">
                <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-gray-300">
                    🚀 <span className="font-semibold text-white">NO BOUNDARIES!</span> Enter ANY sector or industry - AI will automatically find and analyze the top companies!
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Examples: EV Companies, AI Stocks, Indian Banking, Renewable Energy, Crypto Exchanges, Space Tech
                  </p>
                </div>
                <input
                  type="text"
                  value={sectorInput}
                  onChange={(e) => setSectorInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchSectorInsights()}
                  placeholder="Enter ANY sector or industry (e.g., AI Stocks, EV, Indian Banking, Crypto)"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={fetchSectorInsights}
                  disabled={loading || !sectorInput.trim()}
                  className="mt-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Finding & Analyzing Companies...' : 'Analyze ANY Sector'}
                </button>
              </div>

              {sectorInsights?.success && (
                <>
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-gray-300">
                      {sectorInsights.analysis}
                    </div>
                  </div>
                  {sectorInsights.stocks_analyzed && (
                    <div className="mt-4 text-sm text-gray-500">
                      Analyzed {sectorInsights.stocks_analyzed} stocks • {sectorInsights.source || 'Multiple sources'}
                    </div>
                  )}
                </>
              )}
              
              {/* Custom Stock Selection for Sector Analysis */}
              <div className="mt-6 pt-6 border-t border-white/10">
                <h3 className="text-lg font-semibold text-white mb-3">Or Analyze Your Own Stock Selection:</h3>
                <input
                  type="text"
                  value={customSectorTickers}
                  onChange={(e) => setCustomSectorTickers(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && analyzeCustomStocks()}
                  placeholder="e.g., AAPL,MSFT,GOOGL (comma-separated)"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={analyzeCustomStocks}
                  disabled={loading || !customSectorTickers.trim()}
                  className="mt-3 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Analyzing...' : 'Analyze Selected Stocks'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ANALYST INSIGHTS TAB (FINNHUB) */}
        {activeTab === 'analyst' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg rounded-xl p-8 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <TrendingUp className="text-green-400" />
                    Professional Analyst Recommendations
                  </h2>
                  <p className="text-sm text-gray-400 mt-2">
                    Get real-time analyst ratings from Wall Street professionals via Finnhub
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                  📊 Finnhub Pro Data
                </span>
              </div>

              {/* Stock Symbol Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Enter Stock Symbol (e.g., AAPL, MSFT, GOOGL, TSLA)
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={analystSymbol}
                    onChange={(e) => setAnalystSymbol(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && fetchAnalystInsights(analystSymbol)}
                    placeholder="e.g., AAPL"
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => fetchAnalystInsights(analystSymbol)}
                    disabled={analystLoading || !analystSymbol}
                    className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {analystLoading ? 'Loading...' : 'Get Insights'}
                  </button>
                </div>
              </div>

              {/* Quick Stock Buttons */}
              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-3">Popular Stocks:</p>
                <div className="flex flex-wrap gap-2">
                  {['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA', 'META'].map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => {
                        setAnalystSymbol(symbol);
                        fetchAnalystInsights(symbol);
                      }}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors"
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results */}
              {analystLoading && (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Fetching analyst recommendations...</p>
                </div>
              )}

              {analystData && !analystLoading && (
                <div className="space-y-6">
                  {analystData.error ? (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                      <p className="text-red-400">{analystData.error}</p>
                    </div>
                  ) : (
                    <>
                      {/* Summary Card */}
                      <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-xl font-bold text-white">
                            Overall Recommendation: <span className="text-green-400">{analystData.recommendation}</span>
                          </h3>
                          <div className="text-right">
                            <p className="text-sm text-gray-400">Period</p>
                            <p className="text-white font-semibold">{analystData.period}</p>
                          </div>
                        </div>
                        <p className="text-gray-300 text-sm">
                          Based on ratings from <span className="text-blue-400 font-semibold">{analystData.total_analysts} analysts</span>
                        </p>
                      </div>

                      {/* Recommendation Breakdown */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-gradient-to-br from-green-500/20 to-green-600/20 border border-green-500/30 rounded-xl p-4 text-center">
                          <p className="text-3xl font-bold text-green-400">{analystData.strong_buy}</p>
                          <p className="text-sm text-gray-300 mt-1">Strong Buy</p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/30 rounded-xl p-4 text-center">
                          <p className="text-3xl font-bold text-blue-400">{analystData.buy}</p>
                          <p className="text-sm text-gray-300 mt-1">Buy</p>
                        </div>
                        <div className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border border-yellow-500/30 rounded-xl p-4 text-center">
                          <p className="text-3xl font-bold text-yellow-400">{analystData.hold}</p>
                          <p className="text-sm text-gray-300 mt-1">Hold</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-500/20 to-orange-600/20 border border-orange-500/30 rounded-xl p-4 text-center">
                          <p className="text-3xl font-bold text-orange-400">{analystData.sell}</p>
                          <p className="text-sm text-gray-300 mt-1">Sell</p>
                        </div>
                        <div className="bg-gradient-to-br from-red-500/20 to-red-600/20 border border-red-500/30 rounded-xl p-4 text-center">
                          <p className="text-3xl font-bold text-red-400">{analystData.strong_sell}</p>
                          <p className="text-sm text-gray-300 mt-1">Strong Sell</p>
                        </div>
                      </div>

                      {/* Visual Bar Chart */}
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h4 className="text-lg font-semibold text-white mb-4">Recommendation Distribution</h4>
                        <div className="space-y-3">
                          {[
                            { label: 'Strong Buy', value: analystData.strong_buy, color: 'bg-green-500' },
                            { label: 'Buy', value: analystData.buy, color: 'bg-blue-500' },
                            { label: 'Hold', value: analystData.hold, color: 'bg-yellow-500' },
                            { label: 'Sell', value: analystData.sell, color: 'bg-orange-500' },
                            { label: 'Strong Sell', value: analystData.strong_sell, color: 'bg-red-500' },
                          ].map((item) => {
                            const percentage = analystData.total_analysts > 0 
                              ? (item.value / analystData.total_analysts) * 100 
                              : 0;
                            return (
                              <div key={item.label}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm text-gray-300">{item.label}</span>
                                  <span className="text-sm text-gray-400">{item.value} ({percentage.toFixed(1)}%)</span>
                                </div>
                                <div className="w-full bg-white/5 rounded-full h-3">
                                  <div
                                    className={`${item.color} h-3 rounded-full transition-all duration-500`}
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Info Box */}
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                        <p className="text-sm text-gray-300">
                          💡 <span className="font-semibold">Note:</span> Analyst recommendations are opinions from professional financial analysts. 
                          Always do your own research and consider your investment goals before making decisions.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {!analystData && !analystLoading && (
                <div className="text-center py-12 text-gray-400">
                  <TrendingUp size={48} className="mx-auto mb-4 opacity-50" />
                  <p>Enter a stock symbol above to see analyst recommendations</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* NEWS HUB TAB (FINNHUB) */}
        {activeTab === 'news' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg rounded-xl p-8 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Sparkles className="text-blue-400" />
                    Financial News Hub
                  </h2>
                  <p className="text-sm text-gray-400 mt-2">
                    Real-time company news and market updates from Finnhub
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  📰 Live News Feed
                </span>
              </div>

              {/* News Type Toggle */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => {
                    setNewsType('company');
                    if (!companyNews) fetchCompanyNews(newsSymbol);
                  }}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                    newsType === 'company'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  Company News
                </button>
                <button
                  onClick={() => {
                    setNewsType('market');
                    if (!marketNews) fetchMarketNews();
                  }}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
                    newsType === 'market'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10'
                  }`}
                >
                  Market News
                </button>
              </div>

              {/* Company News Section */}
              {newsType === 'company' && (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Enter Stock Symbol for News
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newsSymbol}
                        onChange={(e) => setNewsSymbol(e.target.value.toUpperCase())}
                        onKeyPress={(e) => e.key === 'Enter' && fetchCompanyNews(newsSymbol)}
                        placeholder="e.g., AAPL"
                        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => fetchCompanyNews(newsSymbol)}
                        disabled={newsLoading || !newsSymbol}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {newsLoading ? 'Loading...' : 'Get News'}
                      </button>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-3">Quick Access:</p>
                    <div className="flex flex-wrap gap-2">
                      {['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN', 'NVDA'].map((symbol) => (
                        <button
                          key={symbol}
                          onClick={() => {
                            setNewsSymbol(symbol);
                            fetchCompanyNews(symbol);
                          }}
                          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors"
                        >
                          {symbol}
                        </button>
                      ))}
                    </div>
                  </div>

                  {newsLoading && (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                      <p className="text-gray-400">Fetching latest news...</p>
                    </div>
                  )}

                  {companyNews && !newsLoading && (
                    <div className="space-y-4">
                      {companyNews.error ? (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                          <p className="text-red-400">{companyNews.error}</p>
                        </div>
                      ) : companyNews.articles && companyNews.articles.length > 0 ? (
                        <>
                          <p className="text-sm text-gray-400 mb-4">Found {companyNews.count} articles</p>
                          <div className="grid gap-4">
                            {companyNews.articles.map((article: any, idx: number) => (
                              <a
                                key={idx}
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-5 transition-all group"
                              >
                                <div className="flex gap-4">
                                  {article.image && (
                                    <img
                                      src={article.image}
                                      alt=""
                                      className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
                                      onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-semibold mb-2 group-hover:text-blue-400 transition-colors line-clamp-2">
                                      {article.headline}
                                    </h3>
                                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                                      {article.summary}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                                        {article.source}
                                      </span>
                                      <span>{new Date(article.datetime).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </a>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12 text-gray-400">
                          <p>No news articles found for this symbol</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Market News Section */}
              {newsType === 'market' && (
                <>
                  <button
                    onClick={fetchMarketNews}
                    disabled={newsLoading}
                    className="w-full mb-6 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {newsLoading ? 'Loading...' : 'Refresh Market News'}
                  </button>

                  {newsLoading && (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                      <p className="text-gray-400">Fetching latest market news...</p>
                    </div>
                  )}

                  {marketNews && !newsLoading && (
                    <div className="space-y-4">
                      {marketNews.error ? (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                          <p className="text-red-400">{marketNews.error}</p>
                        </div>
                      ) : marketNews.articles && marketNews.articles.length > 0 ? (
                        <>
                          <p className="text-sm text-gray-400 mb-4">Latest {marketNews.count} market updates</p>
                          <div className="grid gap-4">
                            {marketNews.articles.map((article: any, idx: number) => (
                              <a
                                key={idx}
                                href={article.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 hover:from-green-500/10 hover:to-emerald-500/10 border border-green-500/20 rounded-xl p-5 transition-all group"
                              >
                                <div className="flex gap-4">
                                  {article.image && (
                                    <img
                                      src={article.image}
                                      alt=""
                                      className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
                                      onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="text-white font-semibold mb-2 group-hover:text-green-400 transition-colors line-clamp-2">
                                      {article.headline}
                                    </h3>
                                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                                      {article.summary}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-gray-500">
                                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
                                        {article.source}
                                      </span>
                                      <span>{new Date(article.datetime).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                </div>
                              </a>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12 text-gray-400">
                          <p>No market news available</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* AI AGENT TAB */}
        {activeTab === 'agent' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg rounded-xl p-8 border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
                    <Bot className="text-blue-400" />
                    AI Stock Advisor
                  </h2>
                  <p className="text-sm text-gray-400">
                    Ask me anything about stocks, get recommendations, analyze trends
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  🤖 Powered by Finnhub + Gemini AI
                </span>
              </div>

              {/* Quick Questions */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 mb-3">Quick Questions:</h3>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Should I buy Apple stock?",
                    "What's trending in tech?",
                    "Compare my tracked stocks",
                    "Best stocks for long-term?",
                    "Is it a good time to invest?",
                    "Tell me about Tesla earnings"
                  ].map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setAgentQuery(question);
                        setTimeout(() => fetchAgentResponse(), 100);
                      }}
                      className="px-3 py-2 text-xs bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg border border-white/10 hover:border-blue-500/30 transition-all"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>

              {/* Query Input */}
              <div className="relative mb-6">
                <input
                  type="text"
                  value={agentQuery}
                  onChange={(e) => setAgentQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchAgentResponse()}
                  placeholder="Ask me anything about stocks... (e.g., 'Should I invest in NVIDIA?')"
                  className="w-full px-4 py-4 pr-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={fetchAgentResponse}
                  disabled={loading || !agentQuery.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={20} />
                </button>
              </div>

              {/* Tracked Stocks Context */}
              {selectedStocks.length > 0 && (
                <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <p className="text-sm text-gray-300">
                    📊 I can see you're tracking: <span className="font-semibold text-white">
                      {selectedStocks.map(s => s.name).join(', ')}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Ask me about these stocks or get personalized recommendations!
                  </p>
                </div>
              )}

              {/* Response */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-400 mt-4">AI is analyzing with real-time data...</p>
                </div>
              ) : agentResponse?.success ? (
                <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 backdrop-blur-xl border border-blue-500/30 rounded-xl p-8 shadow-2xl">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-6 pb-6 border-b border-white/10">
                    <div className="p-3 bg-gradient-to-br from-blue-500/30 to-purple-500/30 rounded-xl">
                      <Bot className="text-blue-400" size={28} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        AI Stock Advisor
                        <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                          Live Data
                        </span>
                      </h3>
                      <p className="text-sm text-gray-400">
                        Powered by Finnhub API • Real-time market data • Gemini AI Analysis
                      </p>
                    </div>
                  </div>

                  {/* Enhanced Response with Markdown */}
                  <div className="bg-black/20 rounded-xl p-6 border border-white/5">
                    <MarkdownResponse content={agentResponse.response} />
                  </div>

                  {/* Footer Metadata */}
                  <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4 text-gray-500">
                      <span className="flex items-center gap-1">
                        ✅ Real-time Finnhub data
                      </span>
                      <span className="flex items-center gap-1">
                        🤖 AI-powered analysis
                      </span>
                      {agentResponse.timestamp && (
                        <span>
                          🕐 {new Date(agentResponse.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
                  <Bot className="text-gray-600 mx-auto mb-4" size={56} />
                  <h4 className="text-xl font-semibold text-white mb-2">Ask Me Anything!</h4>
                  <p className="text-gray-400">I'll analyze stocks using real-time Finnhub data and provide comprehensive insights.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
