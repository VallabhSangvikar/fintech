'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, BarChart3, DollarSign, X, Activity } from 'lucide-react';
import { StockPrice } from '@/types/stock';
import StockChart from './StockChart';

interface StockCardProps {
  ticker: string;
  name: string;
  onRemove?: () => void;
  autoRefresh?: boolean;
}

export default function StockCard({ ticker, name, onRemove, autoRefresh = true }: StockCardProps) {
  const [stockData, setStockData] = useState<StockPrice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    fetchStockData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchStockData, 15000); // Refresh every 15 seconds
      return () => clearInterval(interval);
    }
  }, [ticker]);

  const fetchStockData = async () => {
    try {
      const response = await fetch(`/api/stocks/price?ticker=${ticker}`);
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
              {stockData.sector && (
                <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-white/10 text-gray-300">
                  {stockData.sector}
                </span>
              )}
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
