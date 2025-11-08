import { NextRequest, NextResponse } from 'next/server';

// This will call the Python backend's stock service
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticker = searchParams.get('ticker');
    
    if (!ticker) {
      return NextResponse.json(
        { success: false, error: 'Ticker symbol is required' },
        { status: 400 }
      );
    }

    // Try to fetch from Python backend
    try {
      const response = await fetch(
        `${PYTHON_BACKEND_URL}/api/stock/price?ticker=${ticker}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store' // Ensure fresh data
        }
      );

      if (response.ok) {
        const data = await response.json();
        return NextResponse.json({
          success: true,
          data: data.data || data,
          cached: false
        });
      }
    } catch (backendError) {
      console.log('Python backend not available, using mock data:', backendError);
    }

    // Fallback to mock data
    const mockData = generateMockStockPrice(ticker);
    return NextResponse.json({
      success: true,
      data: mockData,
      cached: true,
      note: 'Using cached/mock data. Start Python backend for real-time prices.'
    });

  } catch (error) {
    console.error('Stock price fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock price' },
      { status: 500 }
    );
  }
}

function generateMockStockPrice(ticker: string) {
  const basePrice = Math.random() * 2000 + 500;
  const change = (Math.random() - 0.5) * 100;
  const changePercent = (change / basePrice) * 100;
  
  return {
    ticker,
    company_name: ticker.replace('.NS', '').replace('.BO', ''),
    current_price: parseFloat(basePrice.toFixed(2)),
    previous_close: parseFloat((basePrice - change).toFixed(2)),
    day_change: parseFloat(change.toFixed(2)),
    day_change_percent: parseFloat(changePercent.toFixed(2)),
    day_high: parseFloat((basePrice + Math.random() * 50).toFixed(2)),
    day_low: parseFloat((basePrice - Math.random() * 50).toFixed(2)),
    volume: Math.floor(Math.random() * 10000000) + 1000000,
    market_cap: Math.floor(Math.random() * 500000000000) + 100000000000,
    sector: 'Technology',
    industry: 'Software'
  };
}
