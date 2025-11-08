'use client';

import { useState, useEffect } from 'react';
import { GitCompare, TrendingUp, TrendingDown, X } from 'lucide-react';
import { StockComparison as StockComparisonType } from '@/types/stock';

interface StockComparisonProps {
  tickers: string[];
  onRemove?: (ticker: string) => void;
}

export default function StockComparison({ tickers, onRemove }: StockComparisonProps) {
  const [comparisonData, setComparisonData] = useState<StockComparisonType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tickers.length >= 2) {
      fetchComparison();
    }
  }, [tickers]);

  const fetchComparison = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stocks/compare?tickers=${tickers.join(',')}`);
      const result = await response.json();
      
      if (result.success) {
        setComparisonData(result.comparison);
      }
    } catch (error) {
      console.error('Failed to fetch comparison data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (tickers.length < 2) {
    return (
      <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg rounded-xl p-8 border border-white/10 text-center">
        <GitCompare className="mx-auto mb-4 text-gray-400" size={48} />
        <h3 className="text-xl font-bold text-white mb-2">Compare Stocks</h3>
        <p className="text-gray-400">Add at least 2 stocks to start comparing</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 animate-pulse">
        <div className="h-64 bg-white/10 rounded"></div>
      </div>
    );
  }

  const metrics = [
    { key: 'current_price', label: 'Current Price', format: (v: number) => `₹${v.toFixed(2)}` },
    { key: 'day_change_percent', label: 'Day Change %', format: (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, colored: true },
    { key: 'market_cap', label: 'Market Cap', format: (v: number) => `₹${(v / 10000000).toFixed(0)}Cr` },
    { key: 'pe_ratio', label: 'P/E Ratio', format: (v: number) => v.toFixed(2) },
    { key: 'eps', label: 'EPS', format: (v: number) => `₹${v.toFixed(2)}` },
    { key: 'dividend_yield', label: 'Dividend Yield', format: (v: number) => `${v.toFixed(2)}%` },
    { key: 'roe', label: 'ROE', format: (v: number) => `${v.toFixed(2)}%` },
    { key: 'debt_to_equity', label: 'Debt/Equity', format: (v: number) => v.toFixed(2) },
    { key: 'volume', label: 'Volume', format: (v: number) => `${(v / 1000000).toFixed(2)}M` },
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg rounded-xl p-6 border border-white/10">
      <div className="flex items-center gap-2 mb-6">
        <GitCompare className="text-blue-400" size={24} />
        <h3 className="text-xl font-bold text-white">Stock Comparison</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-4 px-4 text-sm font-semibold text-gray-400 sticky left-0 bg-gray-900/90">
                Metric
              </th>
              {comparisonData.map((stock) => (
                <th key={stock.ticker} className="py-4 px-4 min-w-[200px]">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <span className="font-bold text-white">{stock.company_name}</span>
                      {onRemove && (
                        <button
                          onClick={() => onRemove(stock.ticker)}
                          className="p-1 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          <X size={14} className="text-gray-400" />
                        </button>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">{stock.ticker}</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, idx) => (
              <tr key={metric.key} className={`
                border-b border-white/5
                ${idx % 2 === 0 ? 'bg-white/5' : 'bg-transparent'}
                hover:bg-white/10 transition-colors
              `}>
                <td className="py-4 px-4 text-sm font-medium text-gray-300 sticky left-0 bg-inherit">
                  {metric.label}
                </td>
                {comparisonData.map((stock) => {
                  const value = (stock as any)[metric.key];
                  const formatted = metric.format(value);
                  const isPositive = metric.colored && value >= 0;
                  
                  return (
                    <td key={stock.ticker} className="py-4 px-4 text-center">
                      <span className={`
                        font-semibold
                        ${metric.colored 
                          ? isPositive ? 'text-green-400' : 'text-red-400'
                          : 'text-white'
                        }
                      `}>
                        {formatted}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Best/Worst Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-green-400" size={20} />
            <div className="text-sm text-gray-400">Best Day Change</div>
          </div>
          <div className="font-bold text-white">
            {comparisonData.reduce((best, stock) => 
              stock.day_change_percent > best.day_change_percent ? stock : best
            ).company_name}
          </div>
          <div className="text-sm text-green-400">
            +{comparisonData.reduce((best, stock) => 
              stock.day_change_percent > best.day_change_percent ? stock : best
            ).day_change_percent.toFixed(2)}%
          </div>
        </div>

        <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <GitCompare className="text-blue-400" size={20} />
            <div className="text-sm text-gray-400">Highest Market Cap</div>
          </div>
          <div className="font-bold text-white">
            {comparisonData.reduce((best, stock) => 
              stock.market_cap > best.market_cap ? stock : best
            ).company_name}
          </div>
          <div className="text-sm text-blue-400">
            ₹{(comparisonData.reduce((best, stock) => 
              stock.market_cap > best.market_cap ? stock : best
            ).market_cap / 10000000).toFixed(0)}Cr
          </div>
        </div>

        <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-purple-400" size={20} />
            <div className="text-sm text-gray-400">Best ROE</div>
          </div>
          <div className="font-bold text-white">
            {comparisonData.reduce((best, stock) => 
              stock.roe > best.roe ? stock : best
            ).company_name}
          </div>
          <div className="text-sm text-purple-400">
            {comparisonData.reduce((best, stock) => 
              stock.roe > best.roe ? stock : best
            ).roe.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
}
