import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ── Admin credentials (server-side only, never sent to client) ──
const ADMIN_EMAIL = 'admin@elevenshop.fr';
const ADMIN_PASSWORD = 'eleven42300';

// ── Session token management ──
// Use global store so sessions persist across hot module reloads in Next.js development
const globalForSessions = globalThis as unknown as {
  __elevenAdminSessions?: Set<string>;
};
const validSessions =
  globalForSessions.__elevenAdminSessions ?? new Set<string>();
if (process.env.NODE_ENV !== 'production') {
  globalForSessions.__elevenAdminSessions = validSessions;
}

function generateSessionToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

// Constant-time comparison using fixed-length SHA-256 hashes
// Guarantees both buffers are always exactly 32 bytes regardless of input lengths
function secureCompare(a: string, b: string): boolean {
  if (!a || !b) return false;
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

// POST - Login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email et mot de passe requis.' },
        { status: 400 }
      );
    }

    const emailClean = String(email).trim().toLowerCase();
    const passwordRaw = String(password);
    const passwordClean = passwordRaw.trim();

    const emailMatch = secureCompare(emailClean, ADMIN_EMAIL);
    const passwordMatch =
      secureCompare(passwordClean, ADMIN_PASSWORD) ||
      secureCompare(passwordRaw, ADMIN_PASSWORD);

    if (emailMatch && passwordMatch) {
      const token = generateSessionToken();
      validSessions.add(token);

      return NextResponse.json({
        success: true,
        token,
      });
    }

    // Generic error message - don't reveal which field is wrong
    return NextResponse.json(
      { success: false, message: 'Identifiants invalides.' },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: 'Erreur serveur.' },
      { status: 500 }
    );
  }
}

// DELETE - Logout
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      validSessions.delete(token);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}

// GET - Verify session
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token && validSessions.has(token)) {
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
