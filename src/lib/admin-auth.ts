import { NextRequest } from 'next/server';
import crypto from 'crypto';

/**
 * ══════════════════════════════════════════════
 *  ADMIN AUTHENTICATION & SESSION VERIFICATION
 *  Stateless, cryptographic HMAC token validation
 *  Works across all serverless invocations on Vercel
 * ══════════════════════════════════════════════
 */

// Secret used for HMAC token signing (falls back to deterministic secret based on ADMIN_PASSWORD)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'eleven42300';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@elevenshop.fr';
const SIGNING_SECRET =
  process.env.ADMIN_JWT_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  crypto.createHash('sha256').update(`elevenshop_auth_secret_${ADMIN_PASSWORD}`).digest('hex');

const TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export interface AdminSessionPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

/**
 * Generates a tamper-proof cryptographically signed token
 */
export function generateAdminToken(email: string = ADMIN_EMAIL): string {
  const payload: AdminSessionPayload = {
    sub: 'admin',
    email,
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY_MS,
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(payloadB64)
    .digest('base64url');

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies if an admin token is valid, unexpired, and untampered
 */
export function verifyAdminToken(token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false;

  const parts = token.trim().split('.');
  if (parts.length !== 2) return false;

  const [payloadB64, signature] = parts;

  // 1. Verify HMAC signature in constant time
  const expectedSignature = crypto
    .createHmac('sha256', SIGNING_SECRET)
    .update(payloadB64)
    .digest('base64url');

  try {
    const sigA = Buffer.from(signature);
    const sigB = Buffer.from(expectedSignature);
    if (sigA.length !== sigB.length || !crypto.timingSafeEqual(sigA, sigB)) {
      return false;
    }

    // 2. Decode payload & check expiration
    const payload: AdminSessionPayload = JSON.parse(
      Buffer.from(payloadB64, 'base64url').toString('utf-8')
    );

    if (!payload || payload.sub !== 'admin') return false;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts and verifies admin authorization from a NextRequest
 * Checks Authorization header: 'Bearer <token>'
 */
export function validateAdminRequest(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (verifyAdminToken(token)) return true;
  }

  // Also check query param fallback if used for specific links (e.g. ?token=...)
  const tokenParam = req.nextUrl?.searchParams?.get('token');
  if (tokenParam && verifyAdminToken(tokenParam)) return true;

  return false;
}

export { ADMIN_EMAIL, ADMIN_PASSWORD };

