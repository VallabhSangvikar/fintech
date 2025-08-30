import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { mysqlPool } from '@/lib/database';
import { APIResponse } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;

    // Invalidate JWT by incrementing jwt_version
    await mysqlPool.execute(
      'UPDATE users SET jwt_version = jwt_version + 1 WHERE id = ?',
      [user.userId]
    );

    return NextResponse.json(
      { success: true, message: 'Logged out successfully' } as APIResponse<null>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Logout failed' } as APIResponse<null>,
      { status: 500 }
    );
  }
}
