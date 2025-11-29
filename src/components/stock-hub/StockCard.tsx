'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, DollarSign, X, Activity, Star, Award, TrendingUpIcon, GitCompare } from 'lucide-react';
import { StockPrice } from '@/types/stock';
import StockChart from './StockChart';

interface StockCardProps {
  ticker: string;
  name: string;
  onRemove?: () => void;
  autoRefresh?: boolean;
  useFinnhub?: boolean; // NEW: Toggle Finnhub enhanced data
}

interface FinnhubData {
  quote?: {
    c: number; // current price
    d: number; // change
    dp: number; // percent change
    h: number; // high
    l: number; // low
    o: number; // open
    pc: number; // previous close
  };
  profile?: {
    name: string;
    ticker: string;
    marketCapitalization: number;
    shareOutstanding: number;
    country: string;
    currency: string;
    exchange: string;
    ipo: string;
    logo: string;
    phone: string;
    weburl: string;
  };
  recommendation?: {
    recommendation: string;
    strong_buy: number;
    buy: number;
    hold: number;
    sell: number;
    strong_sell: number;
    total_analysts: number;
  };
  financials?: {
    metric: {
      peNormalizedAnnual?: number;
      pbAnnual?: number;
      roaRfy?: number;
      roeRfy?: number;
      revenuePerShareAnnual?: number;
      dividendYieldIndicatedAnnual?: number;
      epsExclExtraItemsTTM?: number;
      grossMarginTTM?: number;
      netProfitMarginTTM?: number;
    };
  };
  earnings?: Array<{
    actual: number;
    estimate: number;
    period: string;
    surprise: number;
  }>;
  insider_trades?: Array<{
    name: string;
    share: number;
    change: number;
    filingDate: string;
    transactionDate: string;
    transactionCode: string;
  }>;
  peers?: string[];
  market_status?: {
    exchange: string;
    isOpen: boolean;
  };
}

export default function StockCard({ ticker, name, onRemove, autoRefresh = true, useFinnhub = true }: StockCardProps) {
  const [stockData, setStockData] = useState<StockPrice | null>(null);
  const [finnhubData, setFinnhubData] = useState<FinnhubData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    fetchStockData();
    if (useFinnhub) {
      fetchFinnhubData();
    }
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchStockData();
        if (useFinnhub) fetchFinnhubData();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]); // Only re-run when ticker changes

  const fetchStockData = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/stock/price?ticker=${ticker}`);
      const result = await response.json();
      
      if (result.success) {
        setStockData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch stock data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFinnhubData = async () => {
    // Skip Finnhub for Indian stocks - Finnhub only supports US stocks
    if (ticker.includes('.NS') || ticker.includes('.BO')) {
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:8000/api/stock/finnhub/comprehensive?ticker=${ticker}`, {
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });
      
      if (!response.ok) {
        return; // Silently skip if not available
      }
      
      const result = await response.json();
      
      if (result.success) {
        setFinnhubData(result);
      }
    } catch (error) {
      // Silently fail - not all stocks may be on Finnhub
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 animate-pulse">
        <div className="h-32 bg-white/10 rounded"></div>
      </div>
    );
  }

  if (!stockData) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 text-center text-gray-400">
        Failed to load stock data
      </div>
    );
  }

  const isPositive = stockData.day_change >= 0;

  return (
    <div className="space-y-4">
      {/* Main Stock Card */}
      <div className={`
        relative overflow-hidden rounded-xl p-6
        bg-gradient-to-br ${isPositive 
          ? 'from-green-500/10 to-emerald-500/10 border-green-500/20' 
          : 'from-red-500/10 to-rose-500/10 border-red-500/20'
        }
        backdrop-blur-lg border
        hover:scale-[1.01] transition-all duration-300
        shadow-xl
      `}>
        {/* Background decoration */}
        <div className={`
          absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2
          ${isPositive ? 'bg-green-500/20' : 'bg-red-500/20'}
        `}></div>

        {/* Close button */}
        {onRemove && (
          <button
            onClick={onRemove}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X size={16} className="text-gray-400" />
          </button>
        )}

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">{stockData.company_name}</h3>
              <p className="text-sm text-gray-400">{ticker}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {stockData.sector && (
                  <span className="inline-block text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300">
                    {stockData.sector}
                  </span>
                )}
                {/* Analyst Recommendation Badge - NEW */}
                {finnhubData?.recommendation && (
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold ${
                    finnhubData.recommendation.recommendation === 'Strong Buy' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    finnhubData.recommendation.recommendation === 'Buy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    finnhubData.recommendation.recommendation === 'Hold' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    finnhubData.recommendation.recommendation === 'Sell' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    <Award size={12} />
                    {finnhubData.recommendation.recommendation}
                    <span className="ml-1 text-[10px] opacity-70">
                      ({finnhubData.recommendation.total_analysts} analysts)
                    </span>
                  </span>
                )}
              </div>
            </div>
            {isPositive ? (
              <TrendingUp className="text-green-400" size={32} />
            ) : (
              <TrendingDown className="text-red-400" size={32} />
            )}
          </div>

          {/* Price */}
          <div className="mb-4">
            <div className="text-4xl font-bold text-white mb-2">
              ₹{stockData.current_price.toLocaleString('en-IN', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
            <div className="flex items-center gap-3">
              <span className={`
                text-lg font-semibold px-4 py-1 rounded-full
                ${isPositive 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
                }
              `}>
                {isPositive ? '+' : ''}₹{stockData.day_change.toFixed(2)}
              </span>
              <span className={`
                text-lg font-semibold
                ${isPositive ? 'text-green-400' : 'text-red-400'}
              `}>
                {isPositive ? '+' : ''}{stockData.day_change_percent.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Day High</div>
              <div className="text-lg font-semibold text-white">
                ₹{stockData.day_high.toFixed(2)}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Day Low</div>
              <div className="text-lg font-semibold text-white">
                ₹{stockData.day_low.toFixed(2)}
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Volume</div>
              <div className="text-sm font-semibold text-white">
                {(stockData.volume / 1000000).toFixed(2)}M
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Market Cap</div>
              <div className="text-sm font-semibold text-white">
                ₹{(stockData.market_cap / 10000000).toFixed(0)}Cr
              </div>
            </div>
          </div>

          {/* Financial Metrics - NEW (Finnhub) */}
          {finnhubData?.financials?.metric && (
            <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Star className="text-purple-400" size={16} />
                <h4 className="text-sm font-semibold text-white">Financial Metrics</h4>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {finnhubData.financials.metric.peNormalizedAnnual && (
                  <div>
                    <div className="text-xs text-gray-400">P/E Ratio</div>
                    <div className="text-sm font-semibold text-white">
                      {finnhubData.financials.metric.peNormalizedAnnual.toFixed(2)}
                    </div>
                  </div>
                )}
                {finnhubData.financials.metric.roeRfy && (
                  <div>
                    <div className="text-xs text-gray-400">ROE</div>
                    <div className="text-sm font-semibold text-green-400">
                      {(finnhubData.financials.metric.roeRfy * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
                {finnhubData.financials.metric.netProfitMarginTTM && (
                  <div>
                    <div className="text-xs text-gray-400">Profit Margin</div>
                    <div className="text-sm font-semibold text-blue-400">
                      {(finnhubData.financials.metric.netProfitMarginTTM * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
                {finnhubData.financials.metric.dividendYieldIndicatedAnnual !== undefined && (
                  <div>
                    <div className="text-xs text-gray-400">Dividend Yield</div>
                    <div className="text-sm font-semibold text-purple-400">
                      {(finnhubData.financials.metric.dividendYieldIndicatedAnnual * 100).toFixed(2)}%
                    </div>
                  </div>
                )}
                {finnhubData.financials.metric.epsExclExtraItemsTTM && (
                  <div>
                    <div className="text-xs text-gray-400">EPS (TTM)</div>
                    <div className="text-sm font-semibold text-white">
                      ${finnhubData.financials.metric.epsExclExtraItemsTTM.toFixed(2)}
                    </div>
                  </div>
                )}
                {finnhubData.financials.metric.roaRfy && (
                  <div>
                    <div className="text-xs text-gray-400">ROA</div>
                    <div className="text-sm font-semibold text-emerald-400">
                      {(finnhubData.financials.metric.roaRfy * 100).toFixed(1)}%
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recent Earnings - NEW (Finnhub) */}
          {finnhubData?.earnings && finnhubData.earnings.length > 0 && (
            <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUpIcon className="text-green-400" size={16} />
                <h4 className="text-sm font-semibold text-white">Recent Earnings</h4>
              </div>
              <div className="space-y-2">
                {finnhubData.earnings.slice(0, 2).map((earning, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{earning.period}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white">
                        Actual: ${earning.actual.toFixed(2)}
                      </span>
                      <span className="text-gray-500">vs</span>
                      <span className="text-gray-400">
                        Est: ${earning.estimate.toFixed(2)}
                      </span>
                      <span className={`font-semibold ${earning.surprise > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ({earning.surprise > 0 ? '+' : ''}{earning.surprise.toFixed(2)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insider Transactions - NEW (Finnhub) */}
          {finnhubData?.insider_trades && finnhubData.insider_trades.length > 0 && (
            <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="text-orange-400" size={16} />
                <h4 className="text-sm font-semibold text-white">Recent Insider Activity</h4>
              </div>
              <div className="space-y-2">
                {finnhubData.insider_trades.slice(0, 3).map((trade, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-300 font-medium">{trade.name}</span>
                      <span className={`font-semibold ${trade.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {trade.change > 0 ? 'Bought' : 'Sold'} {Math.abs(trade.share).toLocaleString()} shares
                      </span>
                    </div>
                    <span className="text-gray-500">
                      {new Date(trade.transactionDate).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Peer Companies - NEW (Finnhub) */}
          {finnhubData?.peers && finnhubData.peers.length > 0 && (
            <div className="mb-4 p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20">
              <div className="flex items-center gap-2 mb-3">
                <GitCompare className="text-cyan-400" size={16} />
                <h4 className="text-sm font-semibold text-white">Similar Companies</h4>
              </div>
              <div className="flex flex-wrap gap-2">
                {finnhubData.peers.filter(p => p !== ticker).slice(0, 5).map((peer, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs bg-white/5 text-cyan-300 rounded border border-cyan-500/20 hover:bg-white/10 cursor-pointer transition-colors"
                    title={`Click to view ${peer}`}
                  >
                    {peer}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Market Status - NEW (Finnhub) */}
          {finnhubData?.market_status && (
            <div className="mb-4 flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-xs text-gray-400">Market Status:</span>
              <span className={`text-xs font-semibold px-2 py-1 rounded ${
                finnhubData.market_status.isOpen 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {finnhubData.market_status.isOpen ? '🟢 OPEN' : '🔴 CLOSED'}
              </span>
            </div>
          )}

          {/* Actions */}
          <button
            onClick={() => setShowChart(!showChart)}
            className="
              w-full py-3 px-4 rounded-lg
              bg-blue-500/20 hover:bg-blue-500/30
              text-blue-400 font-semibold
              border border-blue-500/30
              transition-all duration-300
              flex items-center justify-center gap-2
            "
          >
            <BarChart3 size={20} />
            {showChart ? 'Hide Chart' : 'View Chart'}
          </button>
        </div>
      </div>

      {/* Expandable Chart */}
      {showChart && (
        <div className="animate-in slide-in-from-top duration-300">
          <StockChart ticker={ticker} companyName={stockData.company_name} />
        </div>
      )}
    </div>
  );
}
