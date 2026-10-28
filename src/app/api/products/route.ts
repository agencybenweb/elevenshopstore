import { NextResponse } from 'next/server';
import { getActiveProducts } from '@/lib/products-store';

export async function GET() {
  try {
    const products = getActiveProducts();
    return NextResponse.json({ products });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur' }, { status: 500 });
  }
}
