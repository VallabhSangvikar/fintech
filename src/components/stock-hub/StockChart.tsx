'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TimePeriod, HistoricalData } from '@/types/stock';

interface StockChartProps {
  ticker: string;
  companyName: string;
}

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: '1d', label: '1D' },
  { value: '5d', label: '5D' },
  { value: '1mo', label: '1M' },
  { value: '3mo', label: '3M' },
  { value: '6mo', label: '6M' },
  { value: '1y', label: '1Y' },
  { value: '5y', label: '5Y' },
];

export default function StockChart({ ticker, companyName }: StockChartProps) {
  const [period, setPeriod] = useState<TimePeriod>('1mo');
  const [historicalData, setHistoricalData] = useState<HistoricalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistoricalData();
  }, [ticker, period]);

  const fetchHistoricalData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stocks/historical?ticker=${ticker}&period=${period}`);
      const result = await response.json();
      
      if (result.success) {
        setHistoricalData(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 animate-pulse">
        <div className="h-64 bg-white/10 rounded"></div>
      </div>
    );
  }

  if (!historicalData) {
    return (
      <div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 text-center text-gray-400">
        Failed to load chart data
      </div>
    );
  }

  const isPositive = historicalData.period_return_pct >= 0;
  const chartColor = isPositive ? '#10b981' : '#ef4444';

  return (
    <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg rounded-xl p-6 border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">{companyName}</h3>
          <p className="text-sm text-gray-400">{ticker}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">
            ₹{historicalData.latest_price.toFixed(2)}
          </div>
          <div className={`text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{historicalData.period_return_pct.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {TIME_PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`
              px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap
              transition-all duration-300
              ${period === p.value
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
              }
            `}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={historicalData.data}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value);
                return period === '1d' || period === '5d' 
                  ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              }}
            />
            <YAxis 
              stroke="#6b7280"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              domain={['auto', 'auto']}
              tickFormatter={(value) => `₹${value.toFixed(0)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white'
              }}
              formatter={(value: any) => [`₹${value.toFixed(2)}`, 'Price']}
              labelFormatter={(label) => new Date(label).toLocaleString()}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={chartColor}
              strokeWidth={2}
              fill="url(#colorPrice)"
              animationDuration={1000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10">
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">Period High</div>
          <div className="text-sm font-semibold text-green-400">
            ₹{historicalData.period_high.toFixed(2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">Period Low</div>
          <div className="text-sm font-semibold text-red-400">
            ₹{historicalData.period_low.toFixed(2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-400 mb-1">Data Points</div>
          <div className="text-sm font-semibold text-blue-400">
            {historicalData.data_points}
          </div>
        </div>
      </div>
    </div>
  );
}
