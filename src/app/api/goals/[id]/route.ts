import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { mysqlPool } from '@/lib/database';
import { APIResponse } from '@/types/database';

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

// GET - Get individual financial goal
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;
    const goalId = parseInt(params.id);

    if (isNaN(goalId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid goal ID' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Ensure this is a customer
    if (user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Financial goals are only available for individual customers' } as APIResponse<null>,
        { status: 403 }
      );
    }

    const [rows] = await mysqlPool.execute(
      'SELECT * FROM financial_goals WHERE id = ? AND user_id = ?',
      [goalId, user.userId]
    ) as any;

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Financial goal not found' } as APIResponse<null>,
        { status: 404 }
      );
    }

    const goal = calculateGoalMetrics(rows[0]);

    return NextResponse.json(
      { success: true, data: goal } as APIResponse<FinancialGoalResponse>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Get financial goal error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve financial goal' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

// PUT - Update a financial goal
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;
    const goalId = parseInt(params.id);

    if (isNaN(goalId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid goal ID' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Ensure this is a customer
    if (user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Financial goals are only available for individual customers' } as APIResponse<null>,
        { status: 403 }
      );
    }

    const body: UpdateGoalRequest = await request.json();
    const { goal_name, target_amount, current_amount, target_date } = body;

    // Check if goal exists and belongs to user
    const [existingRows] = await mysqlPool.execute(
      'SELECT * FROM financial_goals WHERE id = ? AND user_id = ?',
      [goalId, user.userId]
    ) as any;

    if (existingRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Financial goal not found' } as APIResponse<null>,
        { status: 404 }
      );
    }

    // Validation
    if (target_amount !== undefined && target_amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Target amount must be greater than zero' } as APIResponse<null>,
        { status: 400 }
      );
    }

    if (current_amount !== undefined && current_amount < 0) {
      return NextResponse.json(
        { success: false, error: 'Current amount cannot be negative' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Validate target date if provided
    if (target_date !== undefined) {
      if (target_date === null || target_date === '') {
        // Allow clearing the target date
      } else {
        const targetDateObj = new Date(target_date);
        if (isNaN(targetDateObj.getTime()) || targetDateObj <= new Date()) {
          return NextResponse.json(
            { success: false, error: 'Target date must be a valid future date' } as APIResponse<null>,
            { status: 400 }
          );
        }
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];

    if (goal_name !== undefined) {
      updateFields.push('goal_name = ?');
      updateValues.push(goal_name);
    }

    if (target_amount !== undefined) {
      updateFields.push('target_amount = ?');
      updateValues.push(target_amount);
    }

    if (current_amount !== undefined) {
      updateFields.push('current_amount = ?');
      updateValues.push(current_amount);
    }

    if (target_date !== undefined) {
      updateFields.push('target_date = ?');
      updateValues.push(target_date === '' || target_date === null ? null : target_date);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Update the goal
    updateValues.push(goalId);
    await mysqlPool.execute(
      `UPDATE financial_goals SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Fetch updated goal
    const [updatedRows] = await mysqlPool.execute(
      'SELECT * FROM financial_goals WHERE id = ?',
      [goalId]
    ) as any;

    const updatedGoal = calculateGoalMetrics(updatedRows[0]);

    return NextResponse.json(
      { success: true, data: updatedGoal, message: 'Financial goal updated successfully' } as APIResponse<FinancialGoalResponse>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Update financial goal error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update financial goal' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

// DELETE - Delete a financial goal
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;
    const goalId = parseInt(params.id);

    if (isNaN(goalId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid goal ID' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Ensure this is a customer
    if (user.organizationId) {
      return NextResponse.json(
        { success: false, error: 'Financial goals are only available for individual customers' } as APIResponse<null>,
        { status: 403 }
      );
    }

    // Check if goal exists and belongs to user
    const [existingRows] = await mysqlPool.execute(
      'SELECT id FROM financial_goals WHERE id = ? AND user_id = ?',
      [goalId, user.userId]
    ) as any;

    if (existingRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Financial goal not found' } as APIResponse<null>,
        { status: 404 }
      );
    }

    // Delete the goal
    await mysqlPool.execute(
      'DELETE FROM financial_goals WHERE id = ?',
      [goalId]
    );

    return NextResponse.json(
      { success: true, message: 'Financial goal deleted successfully' } as APIResponse<null>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Delete financial goal error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete financial goal' } as APIResponse<null>,
      { status: 500 }
    );
  }
}
