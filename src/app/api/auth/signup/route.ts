import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword, generateJWT } from '@/lib/auth';
import { mysqlPool } from '@/lib/database';
import { APIResponse, LoginResponse } from '@/types/database';

interface SignupRequest {
  full_name: string;
  email: string;
  password: string;
  role: 'Customer' | 'Investment' | 'Bank';
  organization_name?: string; // Required for Investment/Bank roles
}

export async function POST(request: NextRequest) {
  try {
    const body: SignupRequest = await request.json();
    const { full_name, email, password, role, organization_name } = body;

    // Validation
    if (!full_name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' } as APIResponse<null>,
        { status: 400 }
      );
    }

    if ((role === 'Investment' || role === 'Bank') && !organization_name) {
      return NextResponse.json(
        { success: false, error: 'Organization name is required for Investment/Bank roles' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Check if email already exists
    const [existingUsers] = await mysqlPool.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    ) as any;

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Email already registered' } as APIResponse<null>,
        { status: 409 }
      );
    }

    // Hash password
    const password_hash = await hashPassword(password);
    const userId = uuidv4();
    let organizationId: string | null = null;

    // Start transaction
    const connection = await mysqlPool.getConnection();
    await connection.beginTransaction();

    try {
      // Create user
      await connection.execute(
        'INSERT INTO users (id, full_name, email, password_hash, is_active, jwt_version, created_at) VALUES (?, ?, ?, ?, true, 1, NOW())',
        [userId, full_name, email, password_hash]
      );

      // Handle organization creation for Investment/Bank roles
      if (role === 'Investment' || role === 'Bank') {
        organizationId = uuidv4();
        
        // Create organization
        await connection.execute(
          'INSERT INTO organizations (id, name, type, created_at) VALUES (?, ?, ?, NOW())',
          [organizationId, organization_name, role.toUpperCase()]
        );

        // Create team membership with ADMIN role
        await connection.execute(
          'INSERT INTO team_memberships (organization_id, user_id, role, joined_at) VALUES (?, ?, ?, NOW())',
          [organizationId, userId, 'ADMIN']
        );
      }

      await connection.commit();

      // Generate JWT token
      const tokenPayload = {
        userId,
        email,
        organizationId: organizationId || undefined,
        role: role === 'Customer' ? undefined : 'ADMIN',
        jwtVersion: 1,
      };

      const token = generateJWT(tokenPayload);

      const response: LoginResponse = {
        user: {
          id: userId,
          full_name,
          email,
          organizationId: organizationId || undefined,
          role: role === 'Customer' ? undefined : 'ADMIN',
        },
        token,
      };

      return NextResponse.json(
        { success: true, data: response, message: 'Account created successfully' } as APIResponse<LoginResponse>,
        { status: 201 }
      );

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create account' } as APIResponse<null>,
      { status: 500 }
    );
  }
}
