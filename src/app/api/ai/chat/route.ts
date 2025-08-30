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
}

// Helper function to call FastAPI service
async function callFastAPIService(request: AIServiceRequest): Promise<AIServiceResponse> {
  const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
  
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
      throw new Error(`FastAPI service error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('FastAPI service call failed:', error);
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
    if (sessionId) {
      // Verify existing session belongs to user
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

    // Prepare AI service request
    const aiRequest: AIServiceRequest = {
      message,
      sessionId: currentSessionId,
      userId: user.userId,
      organizationId: user.organizationId,
      context,
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

    // Call AI service (this runs in parallel with database operations)
    const aiResponse = await callFastAPIService(aiRequest);

    // Save AI response to database
    const aiMessage = {
      role: 'ai' as const,
      content: aiResponse.response,
      timestamp: new Date(),
      citations: aiResponse.citations || [],
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
      response: aiResponse.response,
      sessionId: currentSessionId,
      sessionTitle: isNewSession ? sessionTitle : undefined,
      citations: aiResponse.citations,
      confidence: aiResponse.confidence,
    };

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
