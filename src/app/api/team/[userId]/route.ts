import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireOrganization, requireRole } from '@/lib/middleware';
import { mysqlPool } from '@/lib/database';
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

interface UpdateTeamMemberRequest {
  role?: 'ADMIN' | 'PORTFOLIO_MANAGER' | 'ANALYST' | 'LENDING_OFFICER' | 'RISK_MANAGER';
  is_active?: boolean;
}

// GET - Get individual team member details
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;
    const targetUserId = params.userId;

    // Check organization access
    const orgCheckResult = requireOrganization(user);
    if (orgCheckResult) {
      return orgCheckResult;
    }

    const [rows] = await mysqlPool.execute(`
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
      WHERE u.id = ? AND tm.organization_id = ?
    `, [targetUserId, user.organizationId]) as any;

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Team member not found' } as APIResponse<null>,
        { status: 404 }
      );
    }

    const member = rows[0];
    const teamMember: TeamMember = {
      id: member.id,
      full_name: member.full_name,
      email: member.email,
      role: member.role,
      avatar_url: member.avatar_url,
      joined_at: new Date(member.joined_at).toISOString(),
      last_login_at: member.last_login_at ? new Date(member.last_login_at).toISOString() : undefined,
      is_active: member.is_active,
    };

    return NextResponse.json(
      { success: true, data: teamMember } as APIResponse<TeamMember>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Get team member error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve team member' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

// PUT - Update team member role or status (Admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;
    const targetUserId = params.userId;

    // Check organization access and admin role
    const orgCheckResult = requireOrganization(user);
    if (orgCheckResult) {
      return orgCheckResult;
    }

    const roleCheckResult = requireRole(['ADMIN'])(user);
    if (roleCheckResult) {
      return roleCheckResult;
    }

    // Prevent self-modification of admin status
    if (targetUserId === user.userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot modify your own account' } as APIResponse<null>,
        { status: 403 }
      );
    }

    const body: UpdateTeamMemberRequest = await request.json();
    const { role, is_active } = body;

    // Check if team member exists in the organization
    const [memberRows] = await mysqlPool.execute(`
      SELECT u.id, tm.role as current_role
      FROM users u
      JOIN team_memberships tm ON u.id = tm.user_id
      WHERE u.id = ? AND tm.organization_id = ?
    `, [targetUserId, user.organizationId]) as any;

    if (memberRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Team member not found' } as APIResponse<null>,
        { status: 404 }
      );
    }

    // Validate role if provided
    if (role) {
      const allowedRoles = ['ADMIN', 'PORTFOLIO_MANAGER', 'ANALYST', 'LENDING_OFFICER', 'RISK_MANAGER'];
      if (!allowedRoles.includes(role)) {
        return NextResponse.json(
          { success: false, error: 'Invalid role specified' } as APIResponse<null>,
          { status: 400 }
        );
      }
    }

    // Build update queries
    const updatePromises = [];

    if (role !== undefined) {
      updatePromises.push(
        mysqlPool.execute(
          'UPDATE team_memberships SET role = ? WHERE user_id = ? AND organization_id = ?',
          [role, targetUserId, user.organizationId]
        )
      );
    }

    if (is_active !== undefined) {
      updatePromises.push(
        mysqlPool.execute(
          'UPDATE users SET is_active = ? WHERE id = ?',
          [is_active, targetUserId]
        )
      );
    }

    if (updatePromises.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' } as APIResponse<null>,
        { status: 400 }
      );
    }

    // Execute updates
    await Promise.all(updatePromises);

    // If user was deactivated, increment jwt_version to invalidate tokens
    if (is_active === false) {
      await mysqlPool.execute(
        'UPDATE users SET jwt_version = jwt_version + 1 WHERE id = ?',
        [targetUserId]
      );
    }

    // Fetch updated team member details
    const [updatedRows] = await mysqlPool.execute(`
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
      WHERE u.id = ? AND tm.organization_id = ?
    `, [targetUserId, user.organizationId]) as any;

    const updatedMember = updatedRows[0];
    const teamMember: TeamMember = {
      id: updatedMember.id,
      full_name: updatedMember.full_name,
      email: updatedMember.email,
      role: updatedMember.role,
      avatar_url: updatedMember.avatar_url,
      joined_at: new Date(updatedMember.joined_at).toISOString(),
      last_login_at: updatedMember.last_login_at ? new Date(updatedMember.last_login_at).toISOString() : undefined,
      is_active: updatedMember.is_active,
    };

    return NextResponse.json(
      { success: true, data: teamMember, message: 'Team member updated successfully' } as APIResponse<TeamMember>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Update team member error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update team member' } as APIResponse<null>,
      { status: 500 }
    );
  }
}

// DELETE - Remove team member from organization (Admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const authResult = await requireAuth(request);
    
    if (!authResult.success || !authResult.user) {
      return authResult.response!;
    }

    const { user } = authResult;
    const targetUserId = params.userId;

    // Check organization access and admin role
    const orgCheckResult = requireOrganization(user);
    if (orgCheckResult) {
      return orgCheckResult;
    }

    const roleCheckResult = requireRole(['ADMIN'])(user);
    if (roleCheckResult) {
      return roleCheckResult;
    }

    // Prevent self-removal
    if (targetUserId === user.userId) {
      return NextResponse.json(
        { success: false, error: 'Cannot remove yourself from the organization' } as APIResponse<null>,
        { status: 403 }
      );
    }

    // Check if team member exists in the organization
    const [memberRows] = await mysqlPool.execute(
      'SELECT tm.user_id FROM team_memberships tm WHERE tm.user_id = ? AND tm.organization_id = ?',
      [targetUserId, user.organizationId]
    ) as any;

    if (memberRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Team member not found' } as APIResponse<null>,
        { status: 404 }
      );
    }

    // Check if this is the last admin
    const [adminRows] = await mysqlPool.execute(
      'SELECT COUNT(*) as admin_count FROM team_memberships WHERE organization_id = ? AND role = "ADMIN"',
      [user.organizationId]
    ) as any;

    const [targetMemberRows] = await mysqlPool.execute(
      'SELECT role FROM team_memberships WHERE user_id = ? AND organization_id = ?',
      [targetUserId, user.organizationId]
    ) as any;

    if (adminRows[0].admin_count <= 1 && targetMemberRows[0].role === 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Cannot remove the last admin from the organization' } as APIResponse<null>,
        { status: 403 }
      );
    }

    // Remove team membership (soft delete approach - keep user but remove from org)
    await mysqlPool.execute(
      'DELETE FROM team_memberships WHERE user_id = ? AND organization_id = ?',
      [targetUserId, user.organizationId]
    );

    // Invalidate user's JWT tokens
    await mysqlPool.execute(
      'UPDATE users SET jwt_version = jwt_version + 1 WHERE id = ?',
      [targetUserId]
    );

    return NextResponse.json(
      { success: true, message: 'Team member removed from organization successfully' } as APIResponse<null>,
      { status: 200 }
    );

  } catch (error) {
    console.error('Remove team member error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove team member' } as APIResponse<null>,
      { status: 500 }
    );
  }
}
