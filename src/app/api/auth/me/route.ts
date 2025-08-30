import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/middleware';
import { mysqlPool } from '@/lib/database';
import { APIResponse } from '@/types/database';

interface CurrentUserResponse {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
  organizationId?: string;
  organizationName?: string;
  organizationType?: string;
  role?: string;
  last_login_at?: string;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;

    // Get detailed user info with organization details
    const [userRows] = await mysqlPool.execute(`
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.avatar_url,
        u.last_login_at,
        tm.organization_id,
        tm.role,
        o.name as organization_name,
        o.type as organization_type
      FROM users u
      LEFT JOIN team_memberships tm ON u.id = tm.user_id
      LEFT JOIN organizations o ON tm.organization_id = o.id
      WHERE u.id = ? AND u.is_active = true
    `, [user.userId]) as any;

    if (userRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'User not found' } as APIResponse<null>,
        { status: 404 }
      );
    }

    const userData = userRows[0];

    const response: CurrentUserResponse = {
      id: userData.id,
      full_name: userData.full_name,
      email: userData.email,
      avatar_url: userData.avatar_url,
      organizationId: userData.organization_id,
      organizationName: userData.organization_name,
      organizationType: userData.organization_type,
      role: userData.role,
      last_login_at: userData.last_login_at,
    };

    return NextResponse.json(
      { success: true, data: response } as APIResponse<CurrentUserResponse>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user information' } as APIResponse<null>,
      { status: 500 }
    );
  }
}
