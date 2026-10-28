import { NextRequest, NextResponse } from 'next/server';
import { getActiveSettings, updateActiveSettings } from '@/lib/settings-store';
import { getServiceRoleClient, isSupabaseConfigured } from '@/lib/supabase';
import { StoreSettings } from '@/types/database';


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

export async function POST(req: NextRequest) {
  try {
    const newSettings = (await req.json()) as Partial<StoreSettings>;

    if (isSupabaseConfigured) {
      const client = getServiceRoleClient();
      if (client) {
        const { data, error } = await client
          .from('settings')
          .upsert({ id: 'store-settings', ...newSettings })
          .select('*')
          .single();

        if (!error && data) {
          updateActiveSettings(data);
          return NextResponse.json({ success: true, settings: data });
        }
      }
    }

    // Update active in-memory and disk settings
    const updated = updateActiveSettings(newSettings);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur mise à jour réglages' }, { status: 500 });
  }
}
