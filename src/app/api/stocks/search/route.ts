import { NextRequest, NextResponse } from 'next/server';

// Indian Stock Universe - Comprehensive list for search
const STOCK_DATABASE = [
  // Banking & Finance
  { ticker: 'HDFCBANK.NS', name: 'HDFC Bank', sector: 'Banking', exchange: 'NSE' },
  { ticker: 'ICICIBANK.NS', name: 'ICICI Bank', sector: 'Banking', exchange: 'NSE' },
  { ticker: 'KOTAKBANK.NS', name: 'Kotak Mahindra Bank', sector: 'Banking', exchange: 'NSE' },
  { ticker: 'AXISBANK.NS', name: 'Axis Bank', sector: 'Banking', exchange: 'NSE' },
  { ticker: 'SBIN.NS', name: 'State Bank of India', sector: 'Banking', exchange: 'NSE' },
  { ticker: 'INDUSINDBK.NS', name: 'IndusInd Bank', sector: 'Banking', exchange: 'NSE' },
  { ticker: 'BAJFINANCE.NS', name: 'Bajaj Finance', sector: 'Finance', exchange: 'NSE' },
  { ticker: 'BAJAJFINSV.NS', name: 'Bajaj Finserv', sector: 'Finance', exchange: 'NSE' },
  
  // IT Services
  { ticker: 'TCS.NS', name: 'Tata Consultancy Services', sector: 'IT', exchange: 'NSE' },
  { ticker: 'INFY.NS', name: 'Infosys', sector: 'IT', exchange: 'NSE' },
  { ticker: 'WIPRO.NS', name: 'Wipro', sector: 'IT', exchange: 'NSE' },
  { ticker: 'HCLTECH.NS', name: 'HCL Technologies', sector: 'IT', exchange: 'NSE' },
  { ticker: 'TECHM.NS', name: 'Tech Mahindra', sector: 'IT', exchange: 'NSE' },
  { ticker: 'LTIM.NS', name: 'LTIMindtree', sector: 'IT', exchange: 'NSE' },
  { ticker: 'PERSISTENT.NS', name: 'Persistent Systems', sector: 'IT', exchange: 'NSE' },
  { ticker: 'COFORGE.NS', name: 'Coforge', sector: 'IT', exchange: 'NSE' },
  
  // Conglomerates & Heavy Industries
  { ticker: 'RELIANCE.NS', name: 'Reliance Industries', sector: 'Conglomerate', exchange: 'NSE' },
  { ticker: 'LT.NS', name: 'Larsen & Toubro', sector: 'Engineering', exchange: 'NSE' },
  { ticker: 'ADANIENT.NS', name: 'Adani Enterprises', sector: 'Conglomerate', exchange: 'NSE' },
  { ticker: 'ADANIPORTS.NS', name: 'Adani Ports', sector: 'Infrastructure', exchange: 'NSE' },
  
  // Automobiles
  { ticker: 'TATAMOTORS.NS', name: 'Tata Motors', sector: 'Automobiles', exchange: 'NSE' },
  { ticker: 'M&M.NS', name: 'Mahindra & Mahindra', sector: 'Automobiles', exchange: 'NSE' },
  { ticker: 'MARUTI.NS', name: 'Maruti Suzuki', sector: 'Automobiles', exchange: 'NSE' },
  { ticker: 'BAJAJ-AUTO.NS', name: 'Bajaj Auto', sector: 'Automobiles', exchange: 'NSE' },
  { ticker: 'EICHERMOT.NS', name: 'Eicher Motors', sector: 'Automobiles', exchange: 'NSE' },
  
  // Telecom
  { ticker: 'BHARTIARTL.NS', name: 'Bharti Airtel', sector: 'Telecom', exchange: 'NSE' },
  
  // FMCG & Consumer
  { ticker: 'HINDUNILVR.NS', name: 'Hindustan Unilever', sector: 'FMCG', exchange: 'NSE' },
  { ticker: 'ITC.NS', name: 'ITC Limited', sector: 'FMCG', exchange: 'NSE' },
  { ticker: 'NESTLEIND.NS', name: 'Nestle India', sector: 'FMCG', exchange: 'NSE' },
  { ticker: 'BRITANNIA.NS', name: 'Britannia Industries', sector: 'FMCG', exchange: 'NSE' },
  { ticker: 'TITAN.NS', name: 'Titan Company', sector: 'Consumer Durables', exchange: 'NSE' },
  { ticker: 'DMART.NS', name: 'Avenue Supermarts', sector: 'Retail', exchange: 'NSE' },
  { ticker: 'TRENT.NS', name: 'Trent Limited', sector: 'Retail', exchange: 'NSE' },
  
  // Pharma & Healthcare
  { ticker: 'SUNPHARMA.NS', name: 'Sun Pharmaceutical', sector: 'Pharmaceuticals', exchange: 'NSE' },
  { ticker: 'DRREDDY.NS', name: 'Dr. Reddy\'s Laboratories', sector: 'Pharmaceuticals', exchange: 'NSE' },
  { ticker: 'CIPLA.NS', name: 'Cipla', sector: 'Pharmaceuticals', exchange: 'NSE' },
  { ticker: 'DIVISLAB.NS', name: 'Divi\'s Laboratories', sector: 'Pharmaceuticals', exchange: 'NSE' },
  
  // Metals & Mining
  { ticker: 'TATASTEEL.NS', name: 'Tata Steel', sector: 'Metals', exchange: 'NSE' },
  { ticker: 'JSWSTEEL.NS', name: 'JSW Steel', sector: 'Metals', exchange: 'NSE' },
  { ticker: 'HINDALCO.NS', name: 'Hindalco Industries', sector: 'Metals', exchange: 'NSE' },
  { ticker: 'VEDL.NS', name: 'Vedanta Limited', sector: 'Metals & Mining', exchange: 'NSE' },
  { ticker: 'COALINDIA.NS', name: 'Coal India', sector: 'Mining', exchange: 'NSE' },
  
  // Energy & Utilities
  { ticker: 'NTPC.NS', name: 'NTPC Limited', sector: 'Power', exchange: 'NSE' },
  { ticker: 'POWERGRID.NS', name: 'Power Grid Corporation', sector: 'Power', exchange: 'NSE' },
  { ticker: 'ONGC.NS', name: 'Oil & Natural Gas Corporation', sector: 'Oil & Gas', exchange: 'NSE' },
  { ticker: 'BPCL.NS', name: 'Bharat Petroleum', sector: 'Oil & Gas', exchange: 'NSE' },
  { ticker: 'IOC.NS', name: 'Indian Oil Corporation', sector: 'Oil & Gas', exchange: 'NSE' },
  
  // Cement & Construction
  { ticker: 'ULTRACEMCO.NS', name: 'UltraTech Cement', sector: 'Cement', exchange: 'NSE' },
  { ticker: 'ASIANPAINT.NS', name: 'Asian Paints', sector: 'Paints', exchange: 'NSE' },
  
  // New Age & Tech
  { ticker: 'ZOMATO.NS', name: 'Zomato', sector: 'Food Tech', exchange: 'NSE' },
  { ticker: 'NYKAA.NS', name: 'Nykaa', sector: 'E-Commerce', exchange: 'NSE' },
  { ticker: 'PAYTM.NS', name: 'Paytm', sector: 'FinTech', exchange: 'NSE' },
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q')?.toLowerCase() || '';
    
    if (!query || query.length < 1) {
      return NextResponse.json({
        success: true,
        results: STOCK_DATABASE.slice(0, 20), // Return top 20 stocks
        total: STOCK_DATABASE.length
      });
    }

    // Search by name, ticker, or sector
    const results = STOCK_DATABASE.filter(stock => 
      stock.name.toLowerCase().includes(query) ||
      stock.ticker.toLowerCase().includes(query) ||
      stock.sector.toLowerCase().includes(query)
    );

    return NextResponse.json({
      success: true,
      results: results.slice(0, 15), // Limit to 15 results
      total: results.length,
      query
    });

  } catch (error) {
    console.error('Stock search error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to search stocks',
        results: []
      },
      { status: 500 }
    );
  }
}
