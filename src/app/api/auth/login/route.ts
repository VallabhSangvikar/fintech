import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateJWT } from '@/lib/auth';
import { mysqlPool } from '@/lib/database';
import { APIResponse, LoginResponse } from '@/types/database';

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Find user with organization and role info
    const [userRows] = await mysqlPool.execute(`
      SELECT 
        u.id, 
        u.full_name, 
        u.email, 
        u.password_hash, 
        u.avatar_url,
        u.is_active,
        u.jwt_version,
        tm.organization_id,
        tm.role
      FROM users u 
      LEFT JOIN team_memberships tm ON u.id = tm.user_id 
      WHERE u.email = ?
    `, [email]) as any;

    if (userRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' } as APIResponse<null>,
        { status: 401 }
      );
    }

    const user = userRows[0];

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { success: false, error: 'Account has been deactivated' } as APIResponse<null>,
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' } as APIResponse<null>,
        { status: 401 }
      );
    }

    // Update last login time
    await mysqlPool.execute(
      'UPDATE users SET last_login_at = NOW() WHERE id = ?',
      [user.id]
    );

    // Generate JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      organizationId: user.organization_id || undefined,
      role: user.role || undefined,
      jwtVersion: user.jwt_version,
    };

    const token = generateJWT(tokenPayload);

    const response: LoginResponse = {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        avatar_url: user.avatar_url,
        organizationId: user.organization_id || undefined,
        role: user.role || undefined,
      },
      token,
    };

    return NextResponse.json(
      { success: true, data: response, message: 'Login successful' } as APIResponse<LoginResponse>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' } as APIResponse<null>,
      { status: 500 }
    );
  }
}
