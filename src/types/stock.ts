// Stock Hub Type Definitions

export interface StockSearchResult {
  ticker: string;
  name: string;
  sector: string;
  exchange: string;
}

export interface StockPrice {
  ticker: string;
  company_name: string;
  current_price: number;
  previous_close: number;
  day_change: number;
  day_change_percent: number;
  day_high: number;
  day_low: number;
  volume: number;
  market_cap: number;
  sector?: string;
  industry?: string;
}

export interface MarketIndex {
  ticker: string;
  name: string;
  market: string;
  current_price: number;
  previous_close: number;
  day_change: number;
  day_change_percent: number;
  day_high: number;
  day_low: number;
  success: boolean;
  cached?: boolean;
}

export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalData {
  ticker: string;
  period: string;
  data: HistoricalDataPoint[];
  latest_price: number;
  period_start_price: number;
  period_return_pct: number;
  period_high: number;
  period_low: number;
  data_points: number;
}

export interface StockComparison {
  ticker: string;
  company_name: string;
  current_price: number;
  day_change_percent: number;
  market_cap: number;
  pe_ratio: number;
  pb_ratio?: number;
  dividend_yield: number;
  eps: number;
  roe: number;
  debt_to_equity: number;
  volume: number;
  fifty_two_week_high: number;
  fifty_two_week_low: number;
  cached?: boolean;
}

export type TimePeriod = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '5y';

export interface StockHubState {
  selectedStocks: string[];
  watchlist: string[];
  comparisonMode: boolean;
  refreshInterval: number;
}
