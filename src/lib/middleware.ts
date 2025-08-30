import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT, extractTokenFromHeader, getUserJWTData } from '@/lib/auth';
import { JWTPayload } from '@/types/database';

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload & {
    full_name: string;
    avatar_url?: string;
  };
}

export async function requireAuth(request: NextRequest): Promise<{
  success: boolean;
  user?: JWTPayload & { full_name: string; avatar_url?: string };
  response?: NextResponse;
}> {
  const authHeader = request.headers.get('authorization');
  const token = extractTokenFromHeader(authHeader || undefined);

  if (!token) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'No authorization token provided' },
        { status: 401 }
      ),
    };
  }

  const decoded = verifyJWT(token);
  if (!decoded) {
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      ),
    };
  }

  // Verify user still exists and token version is valid
  const { mysqlPool } = await import('@/lib/database');
  
  try {
    const [userRows] = await mysqlPool.execute(
      'SELECT id, full_name, email, avatar_url, jwt_version, is_active FROM users WHERE id = ?',
      [decoded.userId]
    ) as any;

    if (userRows.length === 0 || !userRows[0].is_active || userRows[0].jwt_version !== decoded.jwtVersion) {
      return {
        success: false,
        response: NextResponse.json(
          { success: false, error: 'Token is no longer valid' },
          { status: 401 }
        ),
      };
    }

    const user = userRows[0];
    return {
      success: true,
      user: {
        ...decoded,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
      },
    };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return {
      success: false,
      response: NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 500 }
      ),
    };
  }
}

export function requireRole(allowedRoles: string[]) {
  return (user: JWTPayload) => {
    if (!user.role || !allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }
    return null; // No error
  };
}

export function requireOrganization(user: JWTPayload) {
  if (!user.organizationId) {
    return NextResponse.json(
      { success: false, error: 'Organization access required' },
      { status: 403 }
    );
  }
  return null; // No error
}
