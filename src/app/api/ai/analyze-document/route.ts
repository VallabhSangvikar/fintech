import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOrganization } from '@/lib/middleware';
import { mysqlPool, connectMongoDB } from '@/lib/database';
import { APIResponse, DocumentAnalysisRequest } from '@/types/database';

interface AnalysisStatusResponse {
  documentId: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  progress?: number;
  estimatedTimeRemaining?: number;
  analysisResult?: {
    analysisType: string;
    aiSummary: string;
    keyFindings: string[];
    riskIndicators: {
      level: 'LOW' | 'MEDIUM' | 'HIGH';
      factors: string[];
    };
    recommendations: string[];
    confidenceScore: number;
    processedAt: string;
  };
}

// Helper function to call FastAPI document analysis service
async function callDocumentAnalysisService(documentId: string, analysisType: string, organizationId: string) {
  const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
  
  try {
    const response = await fetch(`${fastApiUrl}/analyze-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FASTAPI_API_KEY || 'default-key'}`,
      },
      body: JSON.stringify({
        documentId,
        analysisType,
        organizationId,
      }),
    });

    if (!response.ok) {
      throw new Error(`FastAPI analysis service error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Document analysis service call failed:', error);
    // Set document status to ERROR in database
    await mysqlPool.execute(
      'UPDATE documents SET status = ? WHERE id = ?',
      ['ERROR', documentId]
    );
    throw error;
  }
}

// POST - Trigger document analysis
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;

    // Check organization access
    const orgCheckResult = requireOrganization(user);
    if (orgCheckResult) {
      return orgCheckResult;
    }

    const body = await request.json();
    const { documentId, analysisType } = body;

    if (!documentId || !analysisType) {
      return NextResponse.json(
        { success: false, error: 'Document ID and analysis type are required' } as APIResponse<null>,
        { status: 400 }
      );
    }

    const validAnalysisTypes = ['INVESTMENT_ANALYSIS', 'LOAN_RISK_ASSESSMENT', 'COMPLIANCE_CHECK'];
    if (!validAnalysisTypes.includes(analysisType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid analysis type' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Verify document exists and belongs to user's organization
    const [documentRows] = await mysqlPool.execute(
      'SELECT id, file_name, storage_url, status FROM documents WHERE id = ? AND organization_id = ?',
      [documentId, user.organizationId]
    ) as any;

    if (documentRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Document not found or access denied' } as APIResponse<null>,
        { status: 404 }
      );
    }

    const document = documentRows[0];

    // Check if document is already being analyzed or completed
    if (document.status === 'ANALYZED') {
      return NextResponse.json(
        { success: false, error: 'Document has already been analyzed' } as APIResponse<null>,
        { status: 409 }
      );
    }

    // Update document status to PENDING (will be updated by background process)
    await mysqlPool.execute(
      'UPDATE documents SET status = ? WHERE id = ?',
      ['PENDING', documentId]
    );

    // Start background analysis (don't wait for completion)
    // This runs asynchronously
    if (user.organizationId) {
      const analysisPromise = callDocumentAnalysisService(documentId, analysisType, user.organizationId);
      
      // Don't await the analysis - let it run in background
      analysisPromise.catch(error => {
        console.error(`Background document analysis failed for ${documentId}:`, error);
      });
    }

    const response = {
      documentId,
      status: 'PROCESSING' as const,
      message: 'Document analysis started. Check status using the status endpoint.',
      estimatedTimeMinutes: 2, // Estimated processing time
    };

    return NextResponse.json(
      { success: true, data: response } as APIResponse<typeof response>,
      { status: 202 } // 202 Accepted - processing started
    );

  } catch (error) {
    console.error('Start document analysis error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start document analysis' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

// GET - Get analysis status and results
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Check organization access
    const orgCheckResult = requireOrganization(user);
    if (orgCheckResult) {
      return orgCheckResult;
    }

    // Get document status from MySQL
    const [documentRows] = await mysqlPool.execute(
      'SELECT id, file_name, status FROM documents WHERE id = ? AND organization_id = ?',
      [documentId, user.organizationId]
    ) as any;

    if (documentRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Document not found or access denied' } as APIResponse<null>,
        { status: 404 }
      );
    }

    const document = documentRows[0];
    const response: AnalysisStatusResponse = {
      documentId,
      status: document.status === 'ANALYZED' ? 'COMPLETED' : 
              document.status === 'PENDING' ? 'PROCESSING' : 
              document.status === 'ERROR' ? 'ERROR' : 'PENDING',
    };

    // If analysis is completed, get results from MongoDB
    if (document.status === 'ANALYZED') {
      const mongodb = await connectMongoDB();
      const analysisCollection = mongodb.collection('document_analysis_results');
      
      const analysisResult = await analysisCollection.findOne({ documentId });
      
      if (analysisResult) {
        response.analysisResult = {
          analysisType: analysisResult.analysisType,
          aiSummary: analysisResult.aiSummary,
          keyFindings: analysisResult.keyFindings,
          riskIndicators: analysisResult.riskIndicators,
          recommendations: analysisResult.recommendations,
          confidenceScore: analysisResult.confidenceScore,
          processedAt: new Date(analysisResult.processedAt).toISOString(),
        };
      }
    } else if (response.status === 'PROCESSING') {
      // Provide estimated progress for processing status
      response.progress = 50; // Mock progress
      response.estimatedTimeRemaining = 60; // 60 seconds remaining
    }

    return NextResponse.json(
      { success: true, data: response } as APIResponse<AnalysisStatusResponse>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Get analysis status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get analysis status' } as APIResponse<null>,
      { status: 500 }
    );
  }
}
