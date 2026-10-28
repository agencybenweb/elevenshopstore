import { handleTelegramCallbackQuery } from '@/lib/telegram-handler';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

declare global {
  // eslint-disable-next-line no-var
  var __TELEGRAM_LAST_OFFSET__: number | undefined;
  // eslint-disable-next-line no-var
  var __TELEGRAM_POLLER_INTERVAL__: NodeJS.Timeout | undefined;
  // eslint-disable-next-line no-var
  var __TELEGRAM_IS_POLLING__: boolean | undefined;
}

export async function checkTelegramUpdates(): Promise<boolean> {
  if (!BOT_TOKEN) return false;
  if (global.__TELEGRAM_IS_POLLING__) return false;

  global.__TELEGRAM_IS_POLLING__ = true;
  let hasProcessed = false;

  try {
    const offset = global.__TELEGRAM_LAST_OFFSET__ || 0;
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&limit=20&timeout=0`;

    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!res.ok) {
      return false;
    }

    const data = await res.json();
    if (!data.ok || !Array.isArray(data.result) || data.result.length === 0) {
      return false;
    }

    for (const update of data.result) {
      if (typeof update.update_id === 'number') {
        global.__TELEGRAM_LAST_OFFSET__ = update.update_id + 1;
      }

      if (update.callback_query) {
        try {
          const handled = await handleTelegramCallbackQuery(update.callback_query);
          if (handled) hasProcessed = true;
        } catch (cbErr) {
          console.error('[Telegram Poller] Callback handling error:', cbErr);
        }
      }
    }

    // Acknowledge processed updates with Telegram
    if (global.__TELEGRAM_LAST_OFFSET__) {
      fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${global.__TELEGRAM_LAST_OFFSET__}&limit=1&timeout=0`,
        { cache: 'no-store' }
      ).catch(() => {});
    }
  } catch (err) {
    // Network errors or timeout
    console.error('[Telegram Poller] Error checking updates:', err);
  } finally {
    global.__TELEGRAM_IS_POLLING__ = false;
  }

  return hasProcessed;
}

export function ensureTelegramPollerStarted(): void {
  if (typeof window !== 'undefined') return;
  if (!BOT_TOKEN) return;
  if (global.__TELEGRAM_POLLER_INTERVAL__) return;

  // Run initial check immediately
  checkTelegramUpdates().catch(() => {});

  // Polling every 2 seconds
  global.__TELEGRAM_POLLER_INTERVAL__ = setInterval(() => {
    checkTelegramUpdates().catch(() => {});
  }, 2000);

  console.log('[Telegram Poller] Polling background worker started (interval: 2s)');
}
