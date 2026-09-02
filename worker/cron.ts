import { claimAccountDaily } from '../src/lib/server/claimer';
import { decrypt } from '../src/lib/server/crypto';

export interface Env {
  DB: D1Database;
  APP_ENCRYPTION_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/run') {
      await this.scheduled({} as ScheduledEvent, env, ctx);
      return new Response(JSON.stringify({ success: true, message: 'Cron triggered successfully' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response('Worker running. Send GET to /run to trigger manually.', { status: 200 });
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    const encSecret = env.APP_ENCRYPTION_KEY || 'kage-secret-key-32-chars-length';

    // Fetch active accounts
    const accountsRes = await env.DB.prepare('SELECT * FROM game_accounts WHERE enabled = 1').all();
    const accounts: any[] = accountsRes.results || [];

    for (const acc of accounts) {
      try {
        const plainPass = await decrypt(acc.game_password_encrypted, encSecret);
        const result = await claimAccountDaily(acc.game_email, plainPass, acc.server_id || '0');
        const status = result.success ? 'success' : 'failed';
        const now = new Date().toISOString();

        await env.DB.prepare(
          'UPDATE game_accounts SET last_status = ?, last_message = ?, last_attempt_at = ? WHERE id = ?'
        )
          .bind(status, result.message, now, acc.id)
          .run();

        await env.DB.prepare(
          'INSERT INTO claim_attempts (id, game_account_id, claim_key, reward_name, status, message, attempted_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
          .bind(
            crypto.randomUUID(),
            acc.id,
            result.claimKey || 'cron-daily',
            result.reward || 'Daily Event',
            status,
            result.message,
            now
          )
          .run();
      } catch (err: any) {
        console.error(`Error claiming for ${acc.game_email}:`, err);
      }
    }
  }
};
