'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, GitCompare, Sparkles, Info, Plus } from 'lucide-react';
import MarketIndices from './MarketIndices';
import StockSearch from './StockSearch';
import StockCard from './StockCard';
import StockComparison from './StockComparison';

interface SelectedStock {
  ticker: string;
  name: string;
}

export default function StockHubDashboard() {
  const [selectedStocks, setSelectedStocks] = useState<SelectedStock[]>([]);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [showInfo, setShowInfo] = useState(true);

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
                <h3 className="text-white font-semibold mb-1">Welcome to Stock Hub!</h3>
                <p className="text-sm text-gray-300">
                  Track real-time stock prices, compare companies, view interactive charts, and stay updated with market indices. 
                  Search for any Indian stock and add up to 6 to your dashboard.
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
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
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
      </div>
    </div>
  );
}
