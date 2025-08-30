import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { connectMongoDB } from '@/lib/database';
import { APIResponse } from '@/types/database';

interface InvestmentTipResponse {
  id: string;
  title: string;
  category: 'MARKET_ANALYSIS' | 'RISK_MANAGEMENT' | 'PORTFOLIO_OPTIMIZATION' | 'SECTOR_INSIGHTS';
  content: string;
  aiConfidenceScore: number;
  marketImpact: 'LOW' | 'MEDIUM' | 'HIGH';
  applicableRiskLevel: ('LOW' | 'MEDIUM' | 'HIGH')[];
  tags: string[];
  publishedAt: string;
  expiresAt?: string;
  isPersonalized: boolean;
}

interface GenerateTipsRequest {
  riskAppetite?: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  categories?: string[];
  marketConditions?: string;
}

// Helper function to generate personalized investment tips
async function generatePersonalizedTips(
  userId: string,
  organizationId?: string,
  preferences?: {
    riskAppetite?: string;
    categories?: string[];
    marketConditions?: string;
  }
) {
  const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${fastApiUrl}/generate-investment-tips`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FASTAPI_API_KEY || 'default-key'}`,
      },
      body: JSON.stringify({
        userId,
        organizationId,
        preferences,
      }),
    });

    if (!response.ok) {
      throw new Error(`FastAPI tips service error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Investment tips generation failed:', error);
    // Return fallback tips
    return {
      tips: [
        {
          title: 'Market Diversification Strategy',
          category: 'PORTFOLIO_OPTIMIZATION',
          content: 'Consider diversifying your portfolio across different sectors and asset classes to reduce risk while maintaining growth potential.',
          aiConfidenceScore: 75,
          marketImpact: 'MEDIUM',
          applicableRiskLevel: ['LOW', 'MEDIUM', 'HIGH'],
          tags: ['diversification', 'risk-management', 'portfolio'],
        }
      ]
    };
  }
}

// GET - Retrieve investment tips
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    
    const category = searchParams.get('category');
    const riskLevel = searchParams.get('riskLevel');
    const marketImpact = searchParams.get('marketImpact');
    const personalized = searchParams.get('personalized') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Connect to MongoDB
    const mongodb = await connectMongoDB();
    const tipsCollection = mongodb.collection('investment_tips');

    // Build query
    const query: any = {
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    };

    if (category) {
      query.category = category;
    }

    if (riskLevel) {
      query.applicableRiskLevel = riskLevel;
    }

    if (marketImpact) {
      query.marketImpact = marketImpact;
    }

    // Get tips from database
    const tips = await tipsCollection
      .find(query)
      .sort({ publishedAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // If personalized tips requested and we have few tips, generate more
    if (personalized && tips.length < 5) {
      try {
        // Get user's risk appetite from customer profile if available
        const customerProfilesCollection = mongodb.collection('customer_profiles');
        const profile = await customerProfilesCollection.findOne({ userId: user.userId });
        
        const preferences = {
          riskAppetite: profile?.riskAppetite || riskLevel,
          categories: category ? [category] : undefined,
        };

        const generatedTips = await generatePersonalizedTips(user.userId, user.organizationId, preferences);
        
        // Store generated tips in database for future use
        if (generatedTips.tips && generatedTips.tips.length > 0) {
          const tipsToInsert = generatedTips.tips.map((tip: any) => ({
            title: tip.title,
            category: tip.category,
            content: tip.content,
            aiConfidenceScore: tip.aiConfidenceScore,
            marketImpact: tip.marketImpact,
            applicableRiskLevel: tip.applicableRiskLevel,
            tags: tip.tags,
            isActive: true,
            publishedAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            sourcesUsed: ['AI Generated'],
            isPersonalized: true,
          }));

          await tipsCollection.insertMany(tipsToInsert);
        }
      } catch (error) {
        console.error('Failed to generate personalized tips:', error);
        // Continue with existing tips
      }
    }

    // Get total count
    const total = await tipsCollection.countDocuments(query);

    const investmentTips: InvestmentTipResponse[] = tips.map((tip: any) => ({
      id: tip._id.toString(),
      title: tip.title,
      category: tip.category,
      content: tip.content,
      aiConfidenceScore: tip.aiConfidenceScore,
      marketImpact: tip.marketImpact,
      applicableRiskLevel: tip.applicableRiskLevel,
      tags: tip.tags,
      publishedAt: new Date(tip.publishedAt).toISOString(),
      expiresAt: tip.expiresAt ? new Date(tip.expiresAt).toISOString() : undefined,
      isPersonalized: tip.isPersonalized || false,
    }));

    const response = {
      tips: investmentTips,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      summary: {
        totalActiveTips: total,
        personalizedTips: investmentTips.filter(tip => tip.isPersonalized).length,
        categories: [...new Set(investmentTips.map(tip => tip.category))],
        averageConfidence: investmentTips.length > 0 
          ? Math.round(investmentTips.reduce((sum, tip) => sum + tip.aiConfidenceScore, 0) / investmentTips.length)
          : 0,
      },
    };

    return NextResponse.json(
      { success: true, data: response } as APIResponse<typeof response>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Get investment tips error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve investment tips' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

// POST - Generate new personalized investment tips
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;
    const body: GenerateTipsRequest = await request.json();

    // Generate personalized tips
    const generatedTips = await generatePersonalizedTips(user.userId, user.organizationId, body);

    if (!generatedTips.tips || generatedTips.tips.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No tips could be generated at this time' } as APIResponse<null>,
        { status: 503 }
      );
    }

    // Connect to MongoDB
    const mongodb = await connectMongoDB();
    const tipsCollection = mongodb.collection('investment_tips');

    // Store generated tips
    const tipsToInsert = generatedTips.tips.map((tip: any) => ({
      title: tip.title,
      category: tip.category,
      content: tip.content,
      aiConfidenceScore: tip.aiConfidenceScore,
      marketImpact: tip.marketImpact,
      applicableRiskLevel: tip.applicableRiskLevel,
      tags: tip.tags,
      isActive: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      sourcesUsed: ['AI Generated'],
      isPersonalized: true,
    }));

    const result = await tipsCollection.insertMany(tipsToInsert);

    const response = {
      tipsGenerated: result.insertedCount,
      message: `${result.insertedCount} personalized investment tips generated successfully`,
    };

    return NextResponse.json(
      { success: true, data: response } as APIResponse<typeof response>,
      { status: 201 }
    );

  } catch (error) {
    console.error('Generate investment tips error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate investment tips' } as APIResponse<null>,
      { status: 500 }
    );
  }
}
