import { NextResponse } from 'next/server';
import { getActiveProductsAsync } from '@/lib/products-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await getActiveProductsAsync();
    return NextResponse.json(
      { products },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur' }, { status: 500 });
  }
}
