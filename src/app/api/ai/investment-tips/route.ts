import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { connectMongoDB } from '@/lib/database';
import { APIResponse } from '@/types/database';
import { ObjectId } from 'mongodb';

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

// Helper function to fetch financial news from an external API
async function getFinancialNews(keywords?: string) {
  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    console.warn('NEWS_API_KEY is not set. Skipping news fetch.');
    return [];
  }

  // Prioritize keywords if available, otherwise get top business headlines
  const query = keywords ? encodeURIComponent(keywords) : 'finance OR investment OR economy';
  const url = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=relevancy&apiKey=${apiKey}&pageSize=10`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Failed to fetch news:', response.status, errorData.message);
      return [];
    }
    const data = await response.json();
    // Return a concise summary of each article
    return data.articles.map((article: any) => ({
      title: article.title,
      summary: article.description,
      source: article.source.name,
      url: article.url,
    }));
  } catch (error) {
    console.error('Error fetching financial news:', error);
    return [];
  }
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
  
  // Fetch relevant financial news
  const newsKeywords = preferences?.categories?.join(' OR ') || preferences?.marketConditions;
  const financialNews = await getFinancialNews(newsKeywords);

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
        news: financialNews, // Pass news to the AI service
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
    let tips = await tipsCollection
      .find(query)
      .sort({ publishedAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // If personalized tips requested or no tips found, generate more
    if (personalized || tips.length === 0) {
      try {
        // Get user's risk appetite from customer profile if available
        const customerProfilesCollection = mongodb.collection('customer_profiles');
        const profile = await customerProfilesCollection.findOne({ userId: user.userId });
        
        const preferences = {
          riskAppetite: profile?.riskAppetite || riskLevel,
          categories: category ? [category] : undefined,
        };

        const generatedTipsData = await generatePersonalizedTips(user.userId, user.organizationId, preferences);
        
        // Store generated tips in database and add to current response
        if (generatedTipsData.tips && generatedTipsData.tips.length > 0) {
          const tipsToInsert = generatedTipsData.tips.map((tip: any) => ({
            ...tip, // Spread the original tip properties
            isActive: true,
            publishedAt: new Date(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            sourcesUsed: ['AI Generated'],
            isPersonalized: true,
            _id: new ObjectId(), // Generate a new ObjectId
          }));

          await tipsCollection.insertMany(tipsToInsert);
          
          // If the initial fetch was empty, use the newly generated tips for the response
          if (tips.length === 0) {
            tips = tipsToInsert;
          }
        }
      } catch (error) {
        console.error('Failed to generate personalized tips:', error);
        // Continue with existing tips, even if generation fails
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
