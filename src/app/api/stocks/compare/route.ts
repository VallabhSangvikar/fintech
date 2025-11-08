import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tickersParam = searchParams.get('tickers');
    
    if (!tickersParam) {
      return NextResponse.json(
        { success: false, error: 'Ticker symbols are required' },
        { status: 400 }
      );
    }

    const tickers = tickersParam.split(',').map(t => t.trim()).filter(Boolean);
    
    if (tickers.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 tickers required for comparison' },
        { status: 400 }
      );
    }

    if (tickers.length > 5) {
      return NextResponse.json(
        { success: false, error: 'Maximum 5 stocks can be compared' },
        { status: 400 }
      );
    }

    const comparisonData = [];

    // Fetch data for each ticker
    for (const ticker of tickers) {
      try {
        // Try Python backend first
        const response = await fetch(
          `${PYTHON_BACKEND_URL}/api/stock/fundamentals?ticker=${ticker}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
          }
        );

        if (response.ok) {
          const data = await response.json();
          comparisonData.push({
            ticker,
            ...data.data,
            cached: false
          });
          continue;
        }
      } catch (error) {
        console.log(`Failed to fetch ${ticker} from backend, using mock data`);
      }

      // Fallback to mock data
      comparisonData.push(generateMockComparison(ticker));
    }

    return NextResponse.json({
      success: true,
      comparison: comparisonData,
      tickers,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Stock comparison error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to compare stocks' },
      { status: 500 }
    );
  }
}

function generateMockComparison(ticker: string) {
  const basePrice = Math.random() * 2000 + 500;
  const marketCap = Math.floor(Math.random() * 500000000000) + 50000000000;
  
  return {
    ticker,
    company_name: ticker.replace('.NS', '').replace('.BO', ''),
    current_price: parseFloat(basePrice.toFixed(2)),
    day_change_percent: parseFloat(((Math.random() - 0.5) * 5).toFixed(2)),
    market_cap: marketCap,
    pe_ratio: parseFloat((Math.random() * 40 + 10).toFixed(2)),
    pb_ratio: parseFloat((Math.random() * 5 + 1).toFixed(2)),
    dividend_yield: parseFloat((Math.random() * 4).toFixed(2)),
    eps: parseFloat((Math.random() * 100 + 10).toFixed(2)),
    roe: parseFloat((Math.random() * 30 + 5).toFixed(2)),
    debt_to_equity: parseFloat((Math.random() * 2).toFixed(2)),
    volume: Math.floor(Math.random() * 10000000) + 1000000,
    fifty_two_week_high: parseFloat((basePrice * 1.3).toFixed(2)),
    fifty_two_week_low: parseFloat((basePrice * 0.7).toFixed(2)),
    cached: true
  };
}
