import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  generateAdminToken,
  verifyAdminToken,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} from '@/lib/admin-auth';

// Constant-time comparison using fixed-length SHA-256 hashes
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

    const emailMatch = secureCompare(emailClean, ADMIN_EMAIL.toLowerCase());
    const passwordMatch =
      secureCompare(passwordClean, ADMIN_PASSWORD) ||
      secureCompare(passwordRaw, ADMIN_PASSWORD);

    if (emailMatch && passwordMatch) {
      const token = generateAdminToken(emailClean);

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
export async function DELETE() {
  return NextResponse.json({ success: true });
}

// GET - Verify session
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization') || request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '')?.trim();

    if (token && verifyAdminToken(token)) {
      return NextResponse.json({ authenticated: true });
    }

    return NextResponse.json({ authenticated: false }, { status: 401 });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
