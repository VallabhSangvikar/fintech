import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { mysqlPool } from '@/lib/database';
import { APIResponse } from '@/types/database';

interface PortfolioItem {
  id: number;
  product_name: string;
  product_category: string;
  risk_level: string;
  expected_return?: string;
  description?: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;

    // Fetch user's investment products from the database
    const [portfolioRows] = await mysqlPool.execute(
      `SELECT 
        id,
        product_name,
        product_category,
        risk_level,
        expected_return,
        description,
        created_at
      FROM investment_products 
      WHERE user_id = ? 
      ORDER BY created_at DESC`,
      [user.userId]
    ) as any;

    const portfolioData: PortfolioItem[] = portfolioRows.map((item: any) => ({
      id: item.id,
      product_name: item.product_name,
      product_category: item.product_category,
      risk_level: item.risk_level,
      expected_return: item.expected_return,
      description: item.description,
      created_at: new Date(item.created_at).toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: portfolioData,
      message: 'Portfolio retrieved successfully'
    } as APIResponse<PortfolioItem[]>);

  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch portfolio' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

interface CreatePortfolioRequest {
  product_name: string;
  product_category: string;
  risk_level: string;
  expected_return?: string;
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;
    const body: CreatePortfolioRequest = await request.json();

    const {
      product_name,
      product_category,
      risk_level,
      expected_return,
      description
    } = body;

    // Validate required fields
    if (!product_name || !product_category || !risk_level) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: product_name, product_category, and risk_level are required' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Validate enums
    const validCategories = ['INDEX_FUND', 'REAL_ESTATE', 'SIP', 'GOVERNMENT_BOND', 'STOCKS', 'GOLD'];
    const validRiskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'];

    if (!validCategories.includes(product_category)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product category. Valid options: INDEX_FUND, REAL_ESTATE, SIP, GOVERNMENT_BOND, STOCKS, GOLD' } as APIResponse<null>,
        { status: 400 }
      );
    }

    if (!validRiskLevels.includes(risk_level)) {
      return NextResponse.json(
        { success: false, error: 'Invalid risk level. Valid options: LOW, MEDIUM, HIGH, CONSERVATIVE, MODERATE, AGGRESSIVE' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Insert new investment product
    const [result] = await mysqlPool.execute(
      `INSERT INTO investment_products 
       (product_name, user_id, product_category, risk_level, expected_return, description, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        product_name,
        user.userId,
        product_category,
        risk_level,
        expected_return || null,
        description || null
      ]
    ) as any;

    // Fetch the created portfolio item
    const [portfolioRows] = await mysqlPool.execute(
      'SELECT * FROM investment_products WHERE id = ?',
      [result.insertId]
    ) as any;

    const createdItem: PortfolioItem = {
      id: portfolioRows[0].id,
      product_name: portfolioRows[0].product_name,
      product_category: portfolioRows[0].product_category,
      risk_level: portfolioRows[0].risk_level,
      expected_return: portfolioRows[0].expected_return,
      description: portfolioRows[0].description,
      created_at: new Date(portfolioRows[0].created_at).toISOString()
    };

    return NextResponse.json({
      success: true,
      data: createdItem,
      message: 'Investment added to portfolio successfully'
    } as APIResponse<PortfolioItem>, { status: 201 });

  } catch (error) {
    console.error('Error adding to portfolio:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add investment to portfolio' } as APIResponse<null>,
      { status: 500 }
    );
  }
}