import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { mysqlPool } from '@/lib/database';
import { APIResponse } from '@/types/database';

interface ExpenseAnalysisReport {
  id: number;
  document_name: string;
  analysis_report: string;
  total_expenses: number;
  analysis_insights: string;
  recommendations: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;

    // Fetch user's expense analysis reports
    const [reportRows] = await mysqlPool.execute(
      `SELECT 
        id,
        document_name,
        analysis_report,
        total_expenses,
        analysis_insights,
        recommendations,
        created_at
      FROM expense_analysis_reports 
      WHERE user_id = ? 
      ORDER BY created_at DESC`,
      [user.userId]
    ) as any;

    const reports: ExpenseAnalysisReport[] = reportRows.map((report: any) => ({
      id: report.id,
      document_name: report.document_name,
      analysis_report: report.analysis_report,
      total_expenses: parseFloat(report.total_expenses || 0),
      analysis_insights: report.analysis_insights,
      recommendations: report.recommendations,
      created_at: new Date(report.created_at).toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: reports
    } as APIResponse<ExpenseAnalysisReport[]>);

  } catch (error) {
    console.error('Error fetching expense analysis reports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expense analysis reports' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;

    // Parse multipart/form-data for file upload
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid file type. Please upload PDF, CSV, or Excel files.' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 10MB.' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Convert file to base64 for processing
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Get user context for analysis
    const userContext = await getUserFinancialContext(user.userId);
    
    // Call AI service for expense analysis
    const analysisResult = await callExpenseAnalysisAPI({
      userId: user.userId,
      fileName: file.name,
      fileContent: buffer.toString('base64'),
      fileType: file.type,
      userContext
    });

    if (!analysisResult.success) {
      return NextResponse.json(
        { success: false, error: analysisResult.error || 'Analysis failed' } as APIResponse<null>,
        { status: 500 }
      );
    }

    // Save analysis report to database
    const [result] = await mysqlPool.execute(
      `INSERT INTO expense_analysis_reports 
       (user_id, document_name, analysis_report, extracted_expenses, total_expenses, analysis_insights, recommendations, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        user.userId, 
        file.name,
        analysisResult.analysis_report,
        JSON.stringify(analysisResult.extracted_expenses || []),
        analysisResult.total_expenses || 0,
        analysisResult.insights || '',
        analysisResult.recommendations || ''
      ]
    ) as any;

    const reportId = result.insertId;

    // Return the created report
    return NextResponse.json({
      success: true,
      data: {
        id: reportId,
        document_name: file.name,
        analysis_report: analysisResult.analysis_report,
        total_expenses: analysisResult.total_expenses || 0,
        analysis_insights: analysisResult.insights || '',
        recommendations: analysisResult.recommendations || '',
        created_at: new Date().toISOString()
      },
      message: 'Expense analysis completed successfully'
    } as APIResponse<ExpenseAnalysisReport>);

  } catch (error) {
    console.error('Error processing expense analysis:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process expense analysis' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

// Helper function to get user financial context
async function getUserFinancialContext(userId: string) {
  try {
    // Get user's goals
    const [goalRows] = await mysqlPool.execute(
      'SELECT goal_name, target_amount, current_amount, target_date FROM financial_goals WHERE user_id = ?',
      [userId]
    ) as any;

    // Get user's investments
    const [investmentRows] = await mysqlPool.execute(
      'SELECT product_name, product_category, risk_level FROM investment_products WHERE user_id = ?',
      [userId]
    ) as any;

    return {
      goals: goalRows,
      investments: investmentRows
    };
  } catch (error) {
    console.error('Error fetching user context:', error);
    return { goals: [], investments: [] };
  }
}

// Helper function to call AI expense analysis service
async function callExpenseAnalysisAPI(data: any) {
  try {
    const fastApiUrl = process.env.FASTAPI_URL || 'http://localhost:8000';
    
    const response = await fetch(`${fastApiUrl}/analyze-expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.FASTAPI_API_KEY || 'default-key'}`,
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling AI expense analysis:', error);
    return {
      success: false,
      error: 'AI analysis service unavailable',
      analysis_report: 'Unable to analyze expenses at this time. Please try again later.',
      total_expenses: 0,
      insights: '',
      recommendations: ''
    };
  }
}