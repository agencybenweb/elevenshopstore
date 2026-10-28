import { NextRequest, NextResponse } from 'next/server';
import { handleTelegramCallbackQuery } from '@/lib/telegram-handler';

const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Secret token if configured
    if (WEBHOOK_SECRET) {
      const headerSecret = req.headers.get('x-telegram-bot-api-secret-token');
      const urlSecret = req.nextUrl.searchParams.get('secret');
      if (headerSecret !== WEBHOOK_SECRET && urlSecret !== WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const update = await req.json();

    // Check for callback_query (button clicks)
    if (update.callback_query) {
      await handleTelegramCallbackQuery(update.callback_query);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[Telegram Webhook] Error:', err);
    return NextResponse.json({ ok: true }); // Always return 200 OK to Telegram
  }
}
