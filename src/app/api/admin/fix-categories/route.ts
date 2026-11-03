import { NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/supabase';
import { DEMO_CATEGORIES } from '@/lib/demo-data';

/**
 * GET /api/admin/fix-categories
 * One-shot: met à jour les noms de catégories en DB avec les vrais noms (casse normale).
 * Protégé par ADMIN_SECRET.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const client = getServiceRoleClient();
  if (!client) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
  }

  const results: { id: string; name: string; ok: boolean; error?: string }[] = [];

  for (const cat of DEMO_CATEGORIES) {
    const { error } = await client
      .from('categories')
      .update({
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        sort_order: cat.sort_order,
      })
      .eq('id', cat.id);

    results.push({ id: cat.id, name: cat.name, ok: !error, error: error?.message });
  }

  return NextResponse.json({ fixed: results });
}
