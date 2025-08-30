import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { mysqlPool } from '@/lib/database';
import { APIResponse } from '@/types/database';

interface CreateGoalRequest {
  goal_name: string;
  target_amount: number;
  current_amount?: number;
  target_date?: string; // ISO date string
}

interface UpdateGoalRequest {
  goal_name?: string;
  target_amount?: number;
  current_amount?: number;
  target_date?: string;
}

interface FinancialGoalResponse {
  id: number;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  created_at: string;
  progress_percentage: number;
  days_remaining?: number;
}

// Helper function to calculate progress and days remaining
function calculateGoalMetrics(goal: any): FinancialGoalResponse {
  const progress_percentage = goal.target_amount > 0 
    ? Math.round((goal.current_amount / goal.target_amount) * 100)
    : 0;

  let days_remaining: number | undefined;
  if (goal.target_date) {
    const targetDate = new Date(goal.target_date);
    const today = new Date();
    const timeDiff = targetDate.getTime() - today.getTime();
    days_remaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  }

  return {
    id: goal.id,
    goal_name: goal.goal_name,
    target_amount: goal.target_amount,
    current_amount: goal.current_amount,
    target_date: goal.target_date ? new Date(goal.target_date).toISOString() : undefined,
    created_at: new Date(goal.created_at).toISOString(),
    progress_percentage,
    days_remaining,
  };
}

// POST - Create a new financial goal
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;

    // Ensure this is a customer (no organization for financial goals)
    if (user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Financial goals are only available for individual customers' } as APIResponse<null>,
        { status: 403 }
      );
    }

    const body: CreateGoalRequest = await request.json();
    const { goal_name, target_amount, current_amount = 0, target_date } = body;

    // Validation
    if (!goal_name || !target_amount) {
      return NextResponse.json(
        { success: false, error: 'Goal name and target amount are required' } as APIResponse<null>,
        { status: 400 }
      );
    }

    if (target_amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Target amount must be greater than zero' } as APIResponse<null>,
        { status: 400 }
      );
    }

    if (current_amount < 0) {
      return NextResponse.json(
        { success: false, error: 'Current amount cannot be negative' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Validate target date if provided
    if (target_date) {
      const targetDateObj = new Date(target_date);
      if (isNaN(targetDateObj.getTime()) || targetDateObj <= new Date()) {
        return NextResponse.json(
          { success: false, error: 'Target date must be a valid future date' } as APIResponse<null>,
          { status: 400 }
        );
      }
    }

    // Insert new goal
    const [result] = await mysqlPool.execute(
      `INSERT INTO financial_goals 
       (user_id, goal_name, target_amount, current_amount, target_date, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [user.userId, goal_name, target_amount, current_amount, target_date || null]
    ) as any;

    // Fetch the created goal
    const [goalRows] = await mysqlPool.execute(
      'SELECT * FROM financial_goals WHERE id = ?',
      [result.insertId]
    ) as any;

    const createdGoal = calculateGoalMetrics(goalRows[0]);

    return NextResponse.json(
      { success: true, data: createdGoal, message: 'Financial goal created successfully' } as APIResponse<FinancialGoalResponse>,
      { status: 201 }
    );

  } catch (error) {
    console.error('Create financial goal error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create financial goal' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

// GET - Retrieve all financial goals for the user
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;

    // Ensure this is a customer
    if (user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Financial goals are only available for individual customers' } as APIResponse<null>,
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Validate sort parameters
    const allowedSortFields = ['created_at', 'target_date', 'target_amount', 'current_amount', 'goal_name'];
    const allowedOrder = ['asc', 'desc'];

    if (!allowedSortFields.includes(sortBy) || !allowedOrder.includes(order)) {
      return NextResponse.json(
        { success: false, error: 'Invalid sort parameters' } as APIResponse<null>,
        { status: 400 }
      );
    }

    const [rows] = await mysqlPool.execute(
      `SELECT * FROM financial_goals 
       WHERE user_id = ? 
       ORDER BY ${sortBy} ${order.toUpperCase()}
       LIMIT ? OFFSET ?`,
      [user.userId, limit, offset]
    ) as any;

    // Get total count
    const [countRows] = await mysqlPool.execute(
      'SELECT COUNT(*) as total FROM financial_goals WHERE user_id = ?',
      [user.userId]
    ) as any;

    const goals = rows.map((goal: any) => calculateGoalMetrics(goal));
    const total = countRows[0].total;

    const response = {
      goals,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      summary: {
        totalGoals: total,
        totalTargetAmount: goals.reduce((sum: number, goal: FinancialGoalResponse) => sum + goal.target_amount, 0),
        totalCurrentAmount: goals.reduce((sum: number, goal: FinancialGoalResponse) => sum + goal.current_amount, 0),
        averageProgress: goals.length > 0 
          ? Math.round(goals.reduce((sum: number, goal: FinancialGoalResponse) => sum + goal.progress_percentage, 0) / goals.length)
          : 0,
      },
    };

    return NextResponse.json(
      { success: true, data: response } as APIResponse<typeof response>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Get financial goals error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve financial goals' } as APIResponse<null>,
      { status: 500 }
    );
  }
}
