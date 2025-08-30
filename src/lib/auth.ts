import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JWTPayload } from '@/types/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d'; // Token valid for 7 days

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

export function generateJWT(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7); // Remove "Bearer " prefix
}

// Utility to get user data for JWT payload
export async function getUserJWTData(userId: string) {
  const { mysqlPool } = await import('./database');
  
  try {
    const [userRows] = await mysqlPool.execute(
      'SELECT u.*, tm.organization_id, tm.role FROM users u LEFT JOIN team_memberships tm ON u.id = tm.user_id WHERE u.id = ? AND u.is_active = true',
      [userId]
    ) as any;

    if (userRows.length === 0) {
      return null;
    }

    const user = userRows[0];
    return {
      userId: user.id,
      email: user.email,
      organizationId: user.organization_id || undefined,
      role: user.role || undefined,
      jwtVersion: user.jwt_version,
    };
  } catch (error) {
    console.error('Error fetching user JWT data:', error);
    return null;
  }
}
