import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { connectMongoDB } from '@/lib/database';
import { APIResponse } from '@/types/database';

interface AISessionSummary {
  sessionId: string;
  sessionTitle: string;
  createdAt: string;
  lastUpdatedAt: string;
  messageCount: number;
  lastMessage?: string;
}

interface SessionDetailResponse {
  sessionId: string;
  sessionTitle: string;
  createdAt: string;
  lastUpdatedAt: string;
  conversationHistory: Array<{
    role: 'user' | 'ai';
    content: string;
    timestamp: string;
    attachments?: Array<{
      documentId: string;
      fileName: string;
    }>;
    citations?: Array<{
      sourceDocumentId: string;
      page: number;
      text: string;
    }>;
    financial_analysis?: {
      final_report: string;
      companies: string[];
      analysis_messages: string[];
      success: boolean;
      query: string;
    };
  }>;
}

// GET - Retrieve AI sessions list or specific session
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Connect to MongoDB
    const mongodb = await connectMongoDB();
    const aiSessionsCollection = mongodb.collection('ai_sessions');

    // If sessionId is provided, return specific session details
    if (sessionId) {
      const session = await aiSessionsCollection.findOne({
        sessionId: sessionId,
        userId: user.userId,
      });

      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Session not found' } as APIResponse<null>,
          { status: 404 }
        );
      }

      const sessionDetail: SessionDetailResponse = {
        sessionId: session.sessionId,
        sessionTitle: session.sessionTitle,
        createdAt: new Date(session.createdAt).toISOString(),
        lastUpdatedAt: new Date(session.lastUpdatedAt).toISOString(),
        conversationHistory: session.conversationHistory.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp).toISOString(),
          attachments: msg.attachments,
          citations: msg.citations,
          // Include financial analysis data if available
          financial_analysis: msg.financial_analysis,
        })),
      };

      return NextResponse.json(
        { success: true, data: sessionDetail } as APIResponse<SessionDetailResponse>,
        { status: 200 }
      );
    }

    // Otherwise, return sessions list
    const query = user.organizationId 
      ? { $or: [{ userId: user.userId }, { organizationId: user.organizationId }] }
      : { userId: user.userId };

    const sessions = await aiSessionsCollection
      .find(query)
      .sort({ lastUpdatedAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    // Get total count
    const totalSessions = await aiSessionsCollection.countDocuments(query);

    const sessionSummaries: AISessionSummary[] = sessions.map((session: any) => {
      const conversationHistory = session.conversationHistory || [];
      const lastMessage = conversationHistory.length > 0 
        ? conversationHistory[conversationHistory.length - 1]?.content?.substring(0, 100)
        : undefined;

      return {
        sessionId: session.sessionId,
        sessionTitle: session.sessionTitle,
        createdAt: new Date(session.createdAt).toISOString(),
        lastUpdatedAt: new Date(session.lastUpdatedAt).toISOString(),
        messageCount: conversationHistory.length,
        lastMessage,
      };
    });

    const response = {
      sessions: sessionSummaries,
      pagination: {
        total: totalSessions,
        limit,
        offset,
        hasMore: offset + limit < totalSessions,
      },
      summary: {
        totalSessions,
        totalMessages: sessionSummaries.reduce((sum, session) => sum + session.messageCount, 0),
      },
    };

    return NextResponse.json(
      { success: true, data: response } as APIResponse<typeof response>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Get AI sessions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve AI sessions' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

// DELETE - Delete an AI session
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'Session ID is required' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const mongodb = await connectMongoDB();
    const aiSessionsCollection = mongodb.collection('ai_sessions');

    // Check if session exists and belongs to user
    const session = await aiSessionsCollection.findOne({
      sessionId: sessionId,
      userId: user.userId,
    });

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found or access denied' } as APIResponse<null>,
        { status: 404 }
      );
    }

    // Delete the session
    await aiSessionsCollection.deleteOne({ sessionId: sessionId });

    return NextResponse.json(
      { success: true, message: 'AI session deleted successfully' } as APIResponse<null>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Delete AI session error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete AI session' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

// PUT - Update session title
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;
    const body = await request.json();
    const { sessionId, sessionTitle } = body;

    if (!sessionId || !sessionTitle) {
      return NextResponse.json(
        { success: false, error: 'Session ID and title are required' } as APIResponse<null>,
        { status: 400 }
      );
    }

    if (sessionTitle.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Session title is too long (max 100 characters)' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Connect to MongoDB
    const mongodb = await connectMongoDB();
    const aiSessionsCollection = mongodb.collection('ai_sessions');

    // Update session title
    const result = await aiSessionsCollection.updateOne(
      { sessionId: sessionId, userId: user.userId },
      { 
        $set: { 
          sessionTitle: sessionTitle.trim(),
          lastUpdatedAt: new Date()
        } 
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Session not found or access denied' } as APIResponse<null>,
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: 'Session title updated successfully' } as APIResponse<null>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Update AI session error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update AI session' } as APIResponse<null>,
      { status: 500 }
    );
  }
}
