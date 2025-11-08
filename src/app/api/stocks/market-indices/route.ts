import { NextRequest, NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://localhost:8000';

// Major Indian and Global indices
const INDICES = [
  { ticker: '^NSEI', name: 'NIFTY 50', market: 'India' },
  { ticker: '^BSESN', name: 'SENSEX', market: 'India' },
  { ticker: '^NSEBANK', name: 'NIFTY BANK', market: 'India' },
  { ticker: '^DJI', name: 'DOW JONES', market: 'US' },
  { ticker: '^GSPC', name: 'S&P 500', market: 'US' },
  { ticker: '^IXIC', name: 'NASDAQ', market: 'US' },
];

export async function GET(request: NextRequest) {
  try {
    const indicesData = [];

    // Try to fetch from Python backend
    for (const index of INDICES) {
      try {
        const response = await fetch(
          `${PYTHON_BACKEND_URL}/api/stock/price?ticker=${index.ticker}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            cache: 'no-store'
          }
        );

        if (response.ok) {
          const data = await response.json();
          indicesData.push({
            ...index,
            ...data.data,
            success: true
          });
          continue;
        }
      } catch (error) {
        console.log(`Failed to fetch ${index.name}, using mock data`);
      }

      // Use mock data as fallback
      indicesData.push({
        ...index,
        ...generateMockIndexData(index),
        success: true,
        cached: true
      });
    }

    return NextResponse.json({
      success: true,
      indices: indicesData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Market indices fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch market indices' },
      { status: 500 }
    );
  }
}

function generateMockIndexData(index: any) {
  const basePrices: any = {
    '^NSEI': 19500,
    '^BSESN': 65000,
    '^NSEBANK': 43000,
    '^DJI': 38000,
    '^GSPC': 5000,
    '^IXIC': 15500
  };

  const basePrice = basePrices[index.ticker] || 20000;
  const change = (Math.random() - 0.5) * basePrice * 0.02; // ±2% change
  const changePercent = (change / basePrice) * 100;

  return {
    current_price: parseFloat(basePrice.toFixed(2)),
    previous_close: parseFloat((basePrice - change).toFixed(2)),
    day_change: parseFloat(change.toFixed(2)),
    day_change_percent: parseFloat(changePercent.toFixed(2)),
    day_high: parseFloat((basePrice + Math.abs(change) * 0.5).toFixed(2)),
    day_low: parseFloat((basePrice - Math.abs(change) * 0.5).toFixed(2)),
  };
}
