'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { MarketIndex } from '@/types/stock';

export default function MarketIndices() {
  const [indices, setIndices] = useState<MarketIndex[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchIndices();
    const interval = setInterval(fetchIndices, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchIndices = async () => {
    try {
      const response = await fetch('/api/stocks/market-indices');
      const data = await response.json();
      
      if (data.success) {
        setIndices(data.indices);
      }
    } catch (error) {
      console.error('Failed to fetch market indices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white/5 backdrop-blur-lg rounded-xl p-4 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-1/2 mb-3"></div>
            <div className="h-8 bg-white/10 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="text-blue-400" size={20} />
        <h2 className="text-xl font-bold text-white">Market Overview</h2>
        <span className="text-xs text-gray-400 ml-auto">Live • Updates every 30s</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {indices.map((index) => {
          const isPositive = index.day_change >= 0;
          const marketColors: any = {
            'India': 'from-orange-500/20 to-green-500/20',
            'US': 'from-blue-500/20 to-purple-500/20'
          };
          
          return (
            <div
              key={index.ticker}
              className={`
                relative overflow-hidden rounded-xl p-5 
                bg-gradient-to-br ${marketColors[index.market] || 'from-gray-500/20 to-gray-700/20'}
                backdrop-blur-lg border border-white/10
                hover:border-white/30 hover:scale-[1.02]
                transition-all duration-300 cursor-pointer
                shadow-lg hover:shadow-2xl
              `}
            >
              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">{index.market}</div>
                    <h3 className="text-lg font-bold text-white">{index.name}</h3>
                  </div>
                  {isPositive ? (
                    <TrendingUp className="text-green-400" size={24} />
                  ) : (
                    <TrendingDown className="text-red-400" size={24} />
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-3xl font-bold text-white">
                    {index.current_price.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`
                      text-sm font-semibold px-3 py-1 rounded-full
                      ${isPositive 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                      }
                    `}>
                      {isPositive ? '+' : ''}{index.day_change.toFixed(2)}
                    </span>
                    <span className={`
                      text-sm font-semibold
                      ${isPositive ? 'text-green-400' : 'text-red-400'}
                    `}>
                      {isPositive ? '+' : ''}{index.day_change_percent.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-white/10">
                    <span>High: {index.day_high.toFixed(2)}</span>
                    <span>Low: {index.day_low.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
