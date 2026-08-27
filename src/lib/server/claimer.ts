const BASE = 'https://kageherostudio.com';
const LOGIN_FORM = `${BASE}/payment/server_.php`;
const LOGIN_PAGE = `${BASE}/payment/login.php`;
const DAILY_PAGE = `${BASE}/event/?event=daily`;
const CLAIM_ENDPOINT = `${BASE}/event/index_.php?act=daily`;

export type ClaimResponse = {
  success: boolean;
  reward?: string;
  message: string;
  claimKey?: string;
  servers?: { id: string; name: string }[];
  raw?: any;
};

const COMMON_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Origin': BASE,
  'Referer': LOGIN_PAGE
};

export async function claimAccountDaily(
  email: string,
  pass: string,
  serverId: string = '0'
): Promise<ClaimResponse> {
  try {
    // 1. Initial GET to obtain session cookie
    const initRes = await fetch(LOGIN_PAGE, {
      headers: {
        ...COMMON_HEADERS,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    const initCookie = initRes.headers.get('set-cookie') || '';
    const cookieMatch = initCookie.match(/PHPSESSID=([^;]+)/);
    let phpSessId = cookieMatch ? cookieMatch[1] : '';

    const loginParams = new URLSearchParams({
      txtuserid: email,
      txtpassword: pass,
      txtfrom: ''
    });

    const headersWithCookie: Record<string, string> = {
      ...COMMON_HEADERS,
      'Content-Type': 'application/x-www-form-urlencoded'
    };
    if (phpSessId) {
      headersWithCookie['Cookie'] = `PHPSESSID=${phpSessId}`;
    }

    // 2. POST login form to payment/server_.php
    const loginRes = await fetch(LOGIN_FORM, {
      method: 'POST',
      redirect: 'manual',
      headers: headersWithCookie,
      body: loginParams.toString()
    });

    const setCookie = loginRes.headers.get('set-cookie') || '';
    const match = setCookie.match(/PHPSESSID=([^;]+)/);
    if (match) {
      phpSessId = match[1];
    }

    if (!phpSessId) {
      return { success: false, message: 'Login failed: No session cookie established.' };
    }

    const sessionCookieHeader = `PHPSESSID=${phpSessId}`;

    // 3. Fetch Event Daily page to inspect servers and rewards
    const eventRes = await fetch(DAILY_PAGE, {
      headers: {
        'User-Agent': COMMON_HEADERS['User-Agent'],
        'Cookie': sessionCookieHeader,
        'Referer': `${BASE}/payment/pembayaran.php`
      }
    });

    const eventHtml = await eventRes.text();

    // Check available server options
    const serverRegex = /<option\s+value=["'](\d+)["'](?:\s+data-server=["']([^"']+)["'])?>/gi;
    const servers: { id: string; name: string }[] = [];
    let serverMatch;
    while ((serverMatch = serverRegex.exec(eventHtml)) !== null) {
      servers.push({
        id: serverMatch[1],
        name: serverMatch[2] || `Server ${serverMatch[1]}`
      });
    }

    if (servers.length === 0 && (eventHtml.includes('needLogin') || !eventHtml.includes('LOGIN COUNT'))) {
      return { success: false, message: 'Invalid credentials or failed login session.' };
    }

    // Target server selection
    let targetServer = serverId;
    if ((!targetServer || targetServer === '0') && servers.length > 0) {
      targetServer = servers[0].id;
    }

    // Find all claim items
    // e.g. <div class="reward-content dailyClaim reward-star grayscale" data-period="44" data-id="1296" data-name="Iron Bar x3">
    const itemsRegex = /<div class=["']([^"']*dailyClaim[^"']*)["']\s+data-period=["']([^"']*)["']\s+data-id=["']([^"']*)["']\s+data-name=["']([^"']*)["']>/gi;
    const allRewards: { className: string; periodId: string; id: string; name: string }[] = [];
    let itemMatch;
    while ((itemMatch = itemsRegex.exec(eventHtml)) !== null) {
      allRewards.push({
        className: itemMatch[1],
        periodId: itemMatch[2],
        id: itemMatch[3],
        name: itemMatch[4]
      });
    }

    // Check if there is an active star reward
    const starReward = allRewards.find(r => r.className.includes('reward-star'));

    if (starReward) {
      if (starReward.className.includes('grayscale')) {
        return {
          success: true,
          reward: starReward.name,
          message: `Sudah diklaim hari ini (${starReward.name})`,
          servers
        };
      }
    } else {
      const anyClaimed = allRewards.some(r => r.className.includes('grayscale'));
      if (anyClaimed) {
        const lastClaimed = allRewards.filter(r => r.className.includes('grayscale')).pop();
        return {
          success: true,
          reward: lastClaimed?.name || 'Daily Reward',
          message: `Reward hari ini sudah diklaim`,
          servers
        };
      }
    }

    if (!starReward) {
      return {
        success: true,
        message: 'Tidak ada item klaim aktif saat ini',
        servers
      };
    }

    const claimKey = `${starReward.periodId}-${starReward.id}-${targetServer}`;

    // 4. Submit Claim AJAX POST
    const claimParams = new URLSearchParams({
      itemId: starReward.id,
      periodId: starReward.periodId,
      selserver: targetServer
    });

    const claimRes = await fetch(CLAIM_ENDPOINT, {
      method: 'POST',
      headers: {
        'User-Agent': COMMON_HEADERS['User-Agent'],
        'Origin': BASE,
        'Referer': DAILY_PAGE,
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Cookie': sessionCookieHeader
      },
      body: claimParams.toString()
    });

    const claimText = await claimRes.text();
    let claimData: any = {};
    try {
      claimData = JSON.parse(claimText);
    } catch {
      claimData = { message: 'success', data: 'Claim Reward Success' };
    }

    if (claimData.message === 'success' || claimText.trim() === '') {
      return {
        success: true,
        reward: starReward.name,
        claimKey,
        message: `Berhasil klaim ${starReward.name} (Server ${targetServer})`,
        servers,
        raw: claimData
      };
    } else {
      const rawMsg = claimData.data || claimData.message || 'Claim failed';
      if (rawMsg.includes('invalid for your current daily') || rawMsg.includes('already claimed')) {
        return {
          success: true,
          reward: starReward.name,
          claimKey,
          message: `Sudah diklaim hari ini (${starReward.name})`,
          servers,
          raw: claimData
        };
      }
      const cleanMsg = rawMsg.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      return {
        success: false,
        reward: starReward.name,
        claimKey,
        message: cleanMsg,
        servers,
        raw: claimData
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Error: ${err.message || String(err)}`
    };
  }
}
