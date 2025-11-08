import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const ticker = searchParams.get('ticker');
    const period = searchParams.get('period') || '1mo'; // 1d, 5d, 1mo, 3mo, 6mo, 1y, 5y
    
    if (!ticker) {
      return NextResponse.json(
        { success: false, error: 'Ticker symbol is required' },
        { status: 400 }
      );
    }

    // Try to fetch from Python backend
    try {
      const response = await fetch(
        `${PYTHON_BACKEND_URL}/api/stock/historical?ticker=${ticker}&period=${period}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          cache: 'no-store'
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
      console.log('Python backend not available, generating mock historical data');
    }

    // Generate mock historical data
    const mockData = generateMockHistoricalData(ticker, period);
    return NextResponse.json({
      success: true,
      data: mockData,
      cached: true,
      note: 'Using generated historical data. Start Python backend for real data.'
    });

  } catch (error) {
    console.error('Historical data fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}

function generateMockHistoricalData(ticker: string, period: string) {
  const periodMap: any = {
    '1d': 1,
    '5d': 5,
    '1mo': 30,
    '3mo': 90,
    '6mo': 180,
    '1y': 365,
    '5y': 365 * 5
  };

  const days = periodMap[period] || 30;
  const dataPoints = Math.min(days, 100); // Limit data points
  const basePrice = Math.random() * 2000 + 500;
  
  const historicalData = [];
  let currentPrice = basePrice;
  const today = new Date();

  for (let i = dataPoints - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Random walk
    const change = (Math.random() - 0.48) * basePrice * 0.03; // Slight upward bias
    currentPrice += change;
    currentPrice = Math.max(currentPrice, basePrice * 0.5); // Don't go below 50%
    
    const high = currentPrice + Math.random() * basePrice * 0.02;
    const low = currentPrice - Math.random() * basePrice * 0.02;
    const volume = Math.floor(Math.random() * 5000000) + 500000;

    historicalData.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat((currentPrice - (Math.random() - 0.5) * 10).toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(currentPrice.toFixed(2)),
      volume
    });
  }

  const latestPrice = historicalData[historicalData.length - 1].close;
  const startPrice = historicalData[0].close;
  const periodReturn = ((latestPrice - startPrice) / startPrice) * 100;

  return {
    ticker,
    period,
    data: historicalData,
    latest_price: latestPrice,
    period_start_price: startPrice,
    period_return_pct: parseFloat(periodReturn.toFixed(2)),
    period_high: Math.max(...historicalData.map(d => d.high)),
    period_low: Math.min(...historicalData.map(d => d.low)),
    data_points: historicalData.length
  };
}
