import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/products';

export async function GET() {
  try {
    const categories = await getCategories();
    return NextResponse.json({ categories });
  } catch (err: any) {
    return NextResponse.json({ error: 'Erreur récupération catégories' }, { status: 500 });
  }
}
