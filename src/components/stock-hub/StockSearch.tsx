'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp } from 'lucide-react';
import { StockSearchResult } from '@/types/stock';

interface StockSearchProps {
  onSelectStock: (ticker: string, name: string) => void;
}

export default function StockSearch({ onSelectStock }: StockSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StockSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchStocks(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const searchStocks = async (searchQuery: string) => {
    setIsSearching(true);
    try {
      const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.success) {
        setResults(data.results);
        setShowResults(true);
      }
    } catch (error) {
      console.error('Stock search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (stock: StockSearchResult) => {
    onSelectStock(stock.ticker, stock.name);
    setQuery('');
    setShowResults(false);
    setResults([]);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Search stocks by name, ticker, or sector... (e.g., TCS, Reliance, Banking)"
          className="
            w-full pl-12 pr-12 py-4 
            bg-white/5 backdrop-blur-lg 
            border border-white/10 rounded-xl
            text-white placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
            transition-all duration-300
          "
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && results.length > 0 && (
        <div className="
          absolute top-full left-0 right-0 mt-2 
          bg-gray-900/95 backdrop-blur-xl 
          border border-white/10 rounded-xl
          shadow-2xl overflow-hidden z-50
          max-h-96 overflow-y-auto
        ">
          <div className="p-2 text-xs text-gray-400 border-b border-white/10">
            {results.length} result{results.length !== 1 ? 's' : ''} found
          </div>
          
          {results.map((stock) => (
            <button
              key={stock.ticker}
              onClick={() => handleSelect(stock)}
              className="
                w-full px-4 py-3 text-left
                hover:bg-white/10 transition-colors
                border-b border-white/5 last:border-b-0
                group
              "
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" size={16} />
                    <span className="font-semibold text-white">{stock.name}</span>
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {stock.ticker} • {stock.sector}
                  </div>
                </div>
                <div className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded">
                  {stock.exchange}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showResults && query.length > 0 && results.length === 0 && !isSearching && (
        <div className="
          absolute top-full left-0 right-0 mt-2 
          bg-gray-900/95 backdrop-blur-xl 
          border border-white/10 rounded-xl
          shadow-2xl p-6 text-center z-50
        ">
          <p className="text-gray-400">No stocks found for "{query}"</p>
          <p className="text-sm text-gray-500 mt-2">Try searching by company name, ticker, or sector</p>
        </div>
      )}
    </div>
  );
}
