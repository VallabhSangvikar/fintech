import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { connectMongoDB } from '@/lib/database';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { APIResponse, AIServiceRequest, AIServiceResponse } from '@/types/database';

interface ChatRequest {
  message: string;
  sessionId?: string;
  context?: {
    documentIds?: string[];
    analysisType?: string;
  };
}

interface ChatResponse {
  response: string;
  sessionId: string;
  sessionTitle?: string;
  citations?: Array<{
    sourceDocumentId: string;
    page: number;
    text: string;
  }>;
  confidence?: number;
  // Enhanced financial analysis data
  success?: boolean;
  query?: string;
  companies?: string[];
  final_report?: string;
  messages?: string[];
}

// Helper function to call FastAPI service
async function callFastAPIService(request: AIServiceRequest): Promise<AIServiceResponse> {
  const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
  
  console.log('🔍 Calling FastAPI service:', {
    url: `${fastApiUrl}/chat`,
    request: JSON.stringify(request, null, 2)
  });
  
  try {
    const response = await fetch(`${fastApiUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FASTAPI_API_KEY || 'default-key'}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      console.error('❌ FastAPI response not OK:', response.status, response.statusText);
      throw new Error(`FastAPI service error: ${response.status}`);
    }

    const jsonResponse = await response.json();
    console.log('✅ FastAPI response received:', JSON.stringify(jsonResponse, null, 2));
    
    return jsonResponse;
  } catch (error) {
    console.error('💥 FastAPI service call failed:', error);
    // Fallback response when AI service is unavailable
    return {
      response: "I'm currently unable to process your request. The AI service is temporarily unavailable. Please try again later.",
      sessionId: request.sessionId || uuidv4(),
      confidence: 0,
      processingTimeMs: 0,
    };
  }
}

// Helper function to generate session title from first message
function generateSessionTitle(message: string): string {
  // Take first 50 characters and clean up
  const title = message.substring(0, 50).trim();
  return title.length === 50 ? title + '...' : title;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;
    const body: ChatRequest = await request.json();
    const { message, sessionId, context } = body;

    // Validation
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Message is required' } as APIResponse<null>,
        { status: 400 }
      );
    }

    if (message.length > 4000) {
      return NextResponse.json(
        { success: false, error: 'Message is too long (max 4000 characters)' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const mongodb = await connectMongoDB();
    const aiSessionsCollection = mongodb.collection('ai_sessions');

    let currentSessionId = sessionId;
    let isNewSession = false;
    let sessionTitle = '';

    // Handle session management
    let conversationHistory: any[] = [];
    if (sessionId) {
      // Verify existing session and fetch history
      const existingSession = await aiSessionsCollection.findOne({
        sessionId: sessionId,
        userId: user.userId,
      });

      if (!existingSession) {
        return NextResponse.json(
          { success: false, error: 'Session not found or access denied' } as APIResponse<null>,
          { status: 404 }
        );
      }
      sessionTitle = existingSession.sessionTitle;
      conversationHistory = existingSession.conversationHistory || [];
    } else {
      // Create new session
      currentSessionId = uuidv4();
      isNewSession = true;
      sessionTitle = generateSessionTitle(message);
    }

    // Ensure currentSessionId is not undefined
    if (!currentSessionId) {
      return NextResponse.json(
        { success: false, error: 'Failed to create session ID' } as APIResponse<null>,
        { status: 500 }
      );
    }

    // Get recent financial news for context
    const recentNews = await getRecentFinancialNews(user.userId);

    // Prepare request for FastAPI service
    const aiRequest: AIServiceRequest = {
      message,
      sessionId: currentSessionId,
      userId: user.userId,
      organizationId: user.organizationId,
      context: {
        ...context,
        conversationHistory: conversationHistory.slice(-10), // Send last 10 messages for context
        recentFinancialNews: recentNews, // Add news context
      },
    };

    // Save user message to database first
    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date(),
      attachments: context?.documentIds?.map(docId => ({
        documentId: docId,
        fileName: `Document ${docId}`, // This would be fetched from DB in production
      })) || [],
    };

    if (isNewSession) {
      // Create new session
      await aiSessionsCollection.insertOne({
        sessionId: currentSessionId,
        userId: user.userId,
        organizationId: user.organizationId,
        sessionTitle,
        createdAt: new Date(),
        lastUpdatedAt: new Date(),
        conversationHistory: [userMessage],
      });
    } else {
      // Update existing session
      await aiSessionsCollection.updateOne(
        { sessionId: currentSessionId },
        {
          $push: { conversationHistory: userMessage } as any,
          $set: { lastUpdatedAt: new Date() },
        }
      );
    }

    // Call AI service
    const aiResponse = await callFastAPIService(aiRequest);

    // Save AI response to the same session
    const aiMessage = {
      role: 'ai' as const,
      content: aiResponse.final_report || aiResponse.response || "Unable to process request",
      timestamp: new Date(),
      citations: aiResponse.citations || [],
      financial_analysis: (aiResponse.success && aiResponse.final_report) ? {
        final_report: aiResponse.final_report,
        companies: aiResponse.companies || [],
        analysis_messages: aiResponse.messages || [],
        success: aiResponse.success,
        query: aiResponse.query
      } : undefined,
    };

    await aiSessionsCollection.updateOne(
      { sessionId: currentSessionId },
      {
        $push: { conversationHistory: aiMessage } as any,
        $set: { lastUpdatedAt: new Date() },
      }
    );

    // Prepare response
    const chatResponse: ChatResponse = {
      response: aiResponse.final_report || aiResponse.response || "Unable to process request",
      sessionId: currentSessionId,
      sessionTitle: isNewSession ? sessionTitle : undefined,
      citations: aiResponse.citations,
      confidence: aiResponse.confidence,
      // Pass through financial analysis data if available
      ...(aiResponse.success && aiResponse.final_report && {
        success: aiResponse.success,
        final_report: aiResponse.final_report,
        companies: aiResponse.companies || [],
        messages: aiResponse.messages || [],
        query: aiResponse.query
      })
    };

    console.log('📤 Sending response to frontend:', {
      hasResponse: !!chatResponse.response,
      hasFinalReport: !!chatResponse.final_report,
      hasCompanies: !!chatResponse.companies,
      hasSuccess: !!chatResponse.success,
      responseKeys: Object.keys(chatResponse),
      responsePreview: chatResponse.response.substring(0, 100) + '...'
    });

    const processingTime = Date.now() - startTime;
    
    return NextResponse.json(
      { 
        success: true, 
        data: chatResponse,
        meta: {
          processingTimeMs: processingTime,
          isNewSession,
          messageCount: isNewSession ? 2 : undefined,
        }
      } as APIResponse<ChatResponse>,
      { status: 200 }
    );

  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process chat message' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

// Helper function to get recent financial news for AI context
async function getRecentFinancialNews(userId: string): Promise<any[]> {
  try {
    // Call our financial news API internally to get personalized news
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const newsResponse = await fetch(`${baseUrl}/api/financial-news?userId=${userId}&limit=5`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (newsResponse.ok) {
      const newsData = await newsResponse.json();
      if (newsData.success && newsData.data?.articles) {
        // Transform the news articles for AI context
        return newsData.data.articles.map((article: any) => ({
          title: article.title,
          summary: article.description || article.content?.substring(0, 200) + '...',
          relevance: article.relevanceScore >= 70 ? 'high' : article.relevanceScore >= 40 ? 'medium' : 'low',
          timestamp: article.publishedAt,
          source: article.source?.name
        }));
      }
    }

    // Fallback to sample news if API fails
    return [
      {
        title: "Market Update: Mixed Performance Across Sectors",
        summary: "Financial markets show varied performance as investors assess latest economic data",
        relevance: "medium",
        timestamp: new Date().toISOString(),
        source: "Financial Times"
      },
      {
        title: "Federal Reserve Policy Update",
        summary: "Central bank maintains current monetary policy stance amid economic stability",
        relevance: "high",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: "Reuters"
      }
    ];
  } catch (error) {
    console.error('Error fetching news for AI context:', error);
    // Return empty array on error - AI can still function without news context
    return [];
  }
}
