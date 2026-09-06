import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { claimAccountDaily } from '$lib/server/claimer';
import { encrypt, decrypt } from '$lib/server/crypto';
import { sendTelegramClaimNotification } from '$lib/server/telegram';

export const load: PageServerLoad = async ({ locals, platform }) => {
  if (!locals.authenticated) {
    return { authenticated: false };
  }

  const db = platform?.env?.DB;
  if (!db) {
    return {
      authenticated: true,
      accounts: [],
      history: [],
      error: 'D1 Database not connected. Running in preview mode.'
    };
  }

  try {
    const accountsRes = await db
      .prepare('SELECT id, label, game_email, server_id, enabled, last_status, last_message, last_attempt_at, created_at FROM game_accounts ORDER BY created_at DESC')
      .all();

    const historyRes = await db
      .prepare(`
        SELECT c.id, c.game_account_id, c.claim_key, c.reward_name, c.status, c.message, c.attempted_at, a.label, a.game_email
        FROM claim_attempts c
        LEFT JOIN game_accounts a ON c.game_account_id = a.id
        ORDER BY c.attempted_at DESC
        LIMIT 50
      `)
      .all();

    return {
      authenticated: true,
      accounts: accountsRes.results || [],
      history: historyRes.results || []
    };
  } catch (err: any) {
    return {
      authenticated: true,
      accounts: [],
      history: [],
      error: err.message
    };
  }
};

export const actions: Actions = {
  unlock: async ({ request, cookies, platform }) => {
    const data = await request.formData();
    const code = String(data.get('access_code') || '').trim();
    const expected = platform?.env?.ACCESS_CODE || 'btnseven12';

    if (code === expected) {
      cookies.set('access_session', code, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
      return { success: true };
    }

    return fail(400, { error: 'Invalid access code' });
  },

  logout: async ({ cookies }) => {
    cookies.delete('access_session', { path: '/' });
    throw redirect(303, '/');
  },

  addAccount: async ({ request, locals, platform }) => {
    if (!locals.authenticated) return fail(401, { error: 'Unauthorized' });

    const data = await request.formData();
    const label = String(data.get('label') || '').trim();
    const email = String(data.get('game_email') || '').trim();
    const password = String(data.get('game_password') || '').trim();
    const serverId = String(data.get('server_id') || '0').trim();

    if (!label || !email || !password) {
      return fail(400, { error: 'All fields (label, email, password) are required.' });
    }

    const db = platform?.env?.DB;
    if (!db) return fail(500, { error: 'Database unavailable' });

    const encSecret = platform?.env?.APP_ENCRYPTION_KEY || 'kage-secret-key-32-chars-length';
    const encryptedPass = await encrypt(password, encSecret);
    const id = crypto.randomUUID();

    await db
      .prepare('INSERT INTO game_accounts (id, label, game_email, game_password_encrypted, server_id, enabled) VALUES (?, ?, ?, ?, ?, 1)')
      .bind(id, label, email, encryptedPass, serverId)
      .run();

    return { success: true, message: 'Account added successfully' };
  },

  deleteAccount: async ({ request, locals, platform }) => {
    if (!locals.authenticated) return fail(401, { error: 'Unauthorized' });

    const data = await request.formData();
    const id = String(data.get('id') || '');
    const db = platform?.env?.DB;
    if (!db) return fail(500, { error: 'Database unavailable' });

    await db.prepare('DELETE FROM game_accounts WHERE id = ?').bind(id).run();
    return { success: true };
  },

  toggleAccount: async ({ request, locals, platform }) => {
    if (!locals.authenticated) return fail(401, { error: 'Unauthorized' });

    const data = await request.formData();
    const id = String(data.get('id') || '');
    const enabled = data.get('enabled') === '1' ? 0 : 1;
    const db = platform?.env?.DB;
    if (!db) return fail(500, { error: 'Database unavailable' });

    await db.prepare('UPDATE game_accounts SET enabled = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').bind(enabled, id).run();
    return { success: true };
  },

  claimNow: async ({ request, locals, platform }) => {
    if (!locals.authenticated) return fail(401, { error: 'Unauthorized' });

    const data = await request.formData();
    const id = String(data.get('id') || '');
    const db = platform?.env?.DB;
    if (!db) return fail(500, { error: 'Database unavailable' });

    const account: any = await db.prepare('SELECT * FROM game_accounts WHERE id = ?').bind(id).first();
    if (!account) return fail(404, { error: 'Account not found' });

    const encSecret = platform?.env?.APP_ENCRYPTION_KEY || 'kage-secret-key-32-chars-length';
    const plainPass = await decrypt(account.game_password_encrypted, encSecret);

    const result = await claimAccountDaily(account.game_email, plainPass, account.server_id);
    const status = result.success ? 'success' : 'failed';
    const now = new Date().toISOString();

    await db
      .prepare('UPDATE game_accounts SET last_status = ?, last_message = ?, last_attempt_at = ? WHERE id = ?')
      .bind(status, result.message, now, id)
      .run();

    await db
      .prepare('INSERT INTO claim_attempts (id, game_account_id, claim_key, reward_name, status, message, attempted_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(
        crypto.randomUUID(),
        id,
        result.claimKey || 'manual-attempt',
        result.reward || 'Daily Event',
        status,
        result.message,
        now
      )
      .run();

    await sendTelegramClaimNotification(
      {
        botToken: platform?.env?.TELEGRAM_BOT_TOKEN,
        chatId: platform?.env?.TELEGRAM_CHAT_ID
      },
      {
        accountLabel: account.label,
        success: result.success,
        statusText: result.success ? 'Success' : 'Failed',
        message: result.message,
        triggerSource: 'Manual'
      }
    );

    return {
      success: result.success,
      message: `${account.label}: ${result.message}`
    };
  },

  claimAll: async ({ locals, platform }) => {
    if (!locals.authenticated) return fail(401, { error: 'Unauthorized' });

    const db = platform?.env?.DB;
    if (!db) return fail(500, { error: 'Database unavailable' });

    const accountsRes = await db.prepare('SELECT * FROM game_accounts WHERE enabled = 1').all();
    const accounts: any[] = accountsRes.results || [];
    const encSecret = platform?.env?.APP_ENCRYPTION_KEY || 'kage-secret-key-32-chars-length';

    let countSuccess = 0;
    for (const acc of accounts) {
      const pass = await decrypt(acc.game_password_encrypted, encSecret);
      const res = await claimAccountDaily(acc.game_email, pass, acc.server_id);
      const status = res.success ? 'success' : 'failed';
      if (res.success) countSuccess++;
      const now = new Date().toISOString();

      await db
        .prepare('UPDATE game_accounts SET last_status = ?, last_message = ?, last_attempt_at = ? WHERE id = ?')
        .bind(status, res.message, now, acc.id)
        .run();

      await db
        .prepare('INSERT INTO claim_attempts (id, game_account_id, claim_key, reward_name, status, message, attempted_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .bind(
          crypto.randomUUID(),
          acc.id,
          res.claimKey || 'manual-batch',
          res.reward || 'Daily Event',
          status,
          res.message,
          now
        )
        .run();

      await sendTelegramClaimNotification(
        {
          botToken: platform?.env?.TELEGRAM_BOT_TOKEN,
          chatId: platform?.env?.TELEGRAM_CHAT_ID
        },
        {
          accountLabel: acc.label,
          success: res.success,
          statusText: res.success ? 'Success' : 'Failed',
          message: res.message,
          triggerSource: 'Manual'
        }
      );
    }

    return { success: true, message: `Finished claiming for ${accounts.length} accounts (${countSuccess} succeeded)` };
  }
};
