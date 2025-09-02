import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOrganization, requireRole } from '@/lib/middleware';
import { mysqlPool } from '@/lib/database';
import { hashPassword } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { APIResponse } from '@/types/database';

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
  joined_at: string;
  last_login_at?: string;
  is_active: boolean;
}

interface CreateTeamMemberRequest {
  full_name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'PORTFOLIO_MANAGER' | 'ANALYST' | 'LENDING_OFFICER' | 'RISK_MANAGER';
}

interface UpdateTeamMemberRequest {
  role?: 'ADMIN' | 'PORTFOLIO_MANAGER' | 'ANALYST' | 'LENDING_OFFICER' | 'RISK_MANAGER';
  is_active?: boolean;
}

// GET - Fetch all team members for the organization
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;

    // Check organization access
    const orgCheckResult = requireOrganization(user);
    if (orgCheckResult) {
      return orgCheckResult;
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const isActive = searchParams.get('active');
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '50')) || 50;
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0')) || 0;

    let query = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        u.avatar_url,
        u.last_login_at,
        u.is_active,
        tm.role,
        tm.joined_at
      FROM users u
      JOIN team_memberships tm ON u.id = tm.user_id
      WHERE tm.organization_id = ?
    `;
    
    const params: any[] = [user.organizationId];

    if (role) {
      query += ' AND tm.role = ?';
      params.push(role);
    }

    if (isActive !== null && isActive !== undefined) {
      query += ' AND u.is_active = ?';
      params.push(isActive === 'true' ? 1 : 0);
    }

    query += ' ORDER BY tm.joined_at DESC LIMIT ? OFFSET ?';
    params.push(limit.toString(), offset.toString());

    const [rows] = await mysqlPool.execute(query, params) as any;

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM users u
      JOIN team_memberships tm ON u.id = tm.user_id
      WHERE tm.organization_id = ?
    `;
    const countParams: any[] = [user.organizationId];

    if (role) {
      countQuery += ' AND tm.role = ?';
      countParams.push(role);
    }

    if (isActive !== null && isActive !== undefined) {
      countQuery += ' AND u.is_active = ?';
      countParams.push(isActive === 'true' ? 1 : 0);
    }

    const [countRows] = await mysqlPool.execute(countQuery, countParams) as any;
    const total = countRows[0].total;

    const teamMembers: TeamMember[] = rows.map((row: any) => ({
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      role: row.role,
      avatar_url: row.avatar_url,
      joined_at: new Date(row.joined_at).toISOString(),
      last_login_at: row.last_login_at ? new Date(row.last_login_at).toISOString() : undefined,
      is_active: row.is_active,
    }));

    const response = {
      teamMembers,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      summary: {
        totalMembers: total,
        activeMembers: teamMembers.filter(m => m.is_active).length,
        roleDistribution: teamMembers.reduce((acc: { [key: string]: number }, member) => {
          acc[member.role] = (acc[member.role] || 0) + 1;
          return acc;
        }, {}),
      },
    };

    return NextResponse.json(
      { success: true, data: response } as APIResponse<typeof response>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Get team members error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve team members' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

// POST - Add new team member (Admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;

    // Check organization access and admin role
    const orgCheckResult = requireOrganization(user);
    if (orgCheckResult) {
      return orgCheckResult;
    }

    const roleCheckResult = requireRole(['ADMIN'])(user);
    if (roleCheckResult) {
      return roleCheckResult;
    }

    const body: CreateTeamMemberRequest = await request.json();
    const { full_name, email, password, role } = body;

    // Validation
    if (!full_name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' } as APIResponse<null>,
        { status: 400 }
      );
    }

    const allowedRoles = ['ADMIN', 'PORTFOLIO_MANAGER', 'ANALYST', 'LENDING_OFFICER', 'RISK_MANAGER'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role specified' } as APIResponse<null>,
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

    // Start transaction
    const connection = await mysqlPool.getConnection();
    await connection.beginTransaction();

    try {
      // Create user
      await connection.execute(
        'INSERT INTO users (id, full_name, email, password_hash, is_active, jwt_version, created_at) VALUES (?, ?, ?, ?, true, 1, NOW())',
        [userId, full_name, email, password_hash]
      );

      // Create team membership
      await connection.execute(
        'INSERT INTO team_memberships (organization_id, user_id, role, joined_at) VALUES (?, ?, ?, NOW())',
        [user.organizationId, userId, role]
      );

      await connection.commit();

      // Fetch created team member details
      const [newMemberRows] = await connection.execute(`
        SELECT 
          u.id,
          u.full_name,
          u.email,
          u.avatar_url,
          u.last_login_at,
          u.is_active,
          tm.role,
          tm.joined_at
        FROM users u
        JOIN team_memberships tm ON u.id = tm.user_id
        WHERE u.id = ?
      `, [userId]);

      const newMember = (newMemberRows as any)[0];
      const teamMember: TeamMember = {
        id: newMember.id,
        full_name: newMember.full_name,
        email: newMember.email,
        role: newMember.role,
        avatar_url: newMember.avatar_url,
        joined_at: new Date(newMember.joined_at).toISOString(),
        last_login_at: newMember.last_login_at ? new Date(newMember.last_login_at).toISOString() : undefined,
        is_active: newMember.is_active,
      };

      return NextResponse.json(
        { success: true, data: teamMember, message: 'Team member added successfully' } as APIResponse<TeamMember>,
        { status: 201 }
      );

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Add team member error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add team member' } as APIResponse<null>,
      { status: 500 }
    );
  }
}
