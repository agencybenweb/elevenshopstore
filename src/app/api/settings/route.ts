import { NextResponse } from 'next/server';
import { getActiveSettings } from '@/lib/settings-store';
import { getServiceRoleClient, isSupabaseConfigured } from '@/lib/supabase';

export async function GET() {
  try {
    if (isSupabaseConfigured) {
      const client = getServiceRoleClient();
      if (client) {
        const { data, error } = await client.from('settings').select('*').limit(1).single();
        if (!error && data) {
          return NextResponse.json({ settings: data });
        }
      }
    }
    const settings = getActiveSettings();
    return NextResponse.json({ settings });
  } catch (err) {
    return NextResponse.json({ error: 'Erreur récupération réglages' }, { status: 500 });
  }
}
