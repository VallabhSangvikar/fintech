import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { mysqlPool } from '@/lib/database';
import { APIResponse } from '@/types/database';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required' } as APIResponse<null>,
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters long' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Get current user data
    const [users] = await mysqlPool.execute(
      'SELECT password_hash FROM users WHERE id = ? AND is_active = true',
      [user.userId]
    ) as any;

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' } as APIResponse<null>,
        { status: 404 }
      );
    }

    const userData = users[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, userData.password_hash);
    
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await mysqlPool.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [newPasswordHash, user.userId]
    );

    return NextResponse.json(
      { 
        success: true, 
        data: null,
        message: 'Password changed successfully' 
      } as APIResponse<null>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to change password' } as APIResponse<null>,
      { status: 500 }
    );
  }
}
