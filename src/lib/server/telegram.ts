export interface TelegramConfig {
  botToken?: string;
  chatId?: string;
}

export interface TelegramNotificationParams {
  accountLabel: string;
  success: boolean;
  statusText?: string;
  message?: string;
  triggerSource?: string;
  date?: Date;
}

export function formatWIBTime(date = new Date()): string {
  const d = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);
  return `${d.replace(/:/g, '.')} WIB`;
}

export async function sendTelegramClaimNotification(
  config: TelegramConfig,
  params: TelegramNotificationParams
): Promise<boolean> {
  const { botToken, chatId } = config;
  if (!botToken || !chatId) {
    return false;
  }

  const icon = params.success ? '✅' : '❌';
  const trigger = params.triggerSource || 'Cron';
  const time = formatWIBTime(params.date || new Date());
  const status = params.statusText || (params.success ? 'Success' : 'Failed');
  const detail = params.message || params.accountLabel;

  const text = `${icon} Kageheroes Claim
Account: ${params.accountLabel}
Status: ${status} (${trigger}) · ${detail}
Time: ${time}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text
      })
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Telegram notification error:', res.status, err);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to send Telegram notification:', err);
    return false;
  }
}
