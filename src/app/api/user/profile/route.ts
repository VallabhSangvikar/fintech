import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { mysqlPool } from '@/lib/database';
import { APIResponse } from '@/types/database';

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;
    const body = await request.json();
    const { name, email } = body; // Remove phone since it's not in database schema

    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Check if email is already taken by another user
    const [existingUsers] = await mysqlPool.execute(
      'SELECT id FROM users WHERE email = ? AND id != ? AND is_active = true',
      [email, user.userId]
    ) as any;

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Email is already taken' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Update user profile
    await mysqlPool.execute(
      'UPDATE users SET full_name = ?, email = ? WHERE id = ?',
      [name, email, user.userId]
    );

    // Get updated user data
    const [updatedUsers] = await mysqlPool.execute(
      'SELECT id, full_name, email FROM users WHERE id = ?',
      [user.userId]
    ) as any;

    const updatedUser = updatedUsers[0];

    return NextResponse.json(
      { 
        success: true, 
        data: updatedUser,
        message: 'Profile updated successfully' 
      } as APIResponse<any>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' } as APIResponse<null>,
      { status: 500 }
    );
  }
}
