# Kageheroes Auto Claim

<p align="left">
  <img src="https://img.shields.io/badge/version-0.1.0-blue.svg?style=flat-square" alt="Version 0.1.0" />
  <img src="https://img.shields.io/badge/SvelteKit-2-FF3E00?style=flat-square&logo=svelte&logoColor=white" alt="SvelteKit 2" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Cloudflare-Pages%20%26%20D1-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare" />
  <img src="https://img.shields.io/badge/Telegram-Notification-2CA5E0?style=flat-square&logo=telegram&logoColor=white" alt="Telegram Notification" />
  <img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat-square" alt="MIT License" />
</p>

Automated daily reward claimer and management dashboard for **Ninja Heroes New Era** ([kageherostudio.com](https://kageherostudio.com)). Built on SvelteKit 2, TypeScript, Tailwind CSS v4, and Cloudflare Pages + D1 Database.

## Features

- **Access Code Gate**: Secure access code prompt on every page session and browser reload.
- **Account Management**: Manage multiple game accounts with AES-GCM encrypted credential storage.
- **Automated Daily Claiming**: Automated session negotiation and claim submission against Kage Hero Studio endpoints.
- **Server Auto-Detection**: Automatically resolves the active character and server ID if set to `0`.
- **Claim History**: Detailed logs of previous daily claims including item name, status, and server response.
- **Telegram Notification**: Instant status alerts with timestamp and execution source sent to Telegram.
- **Cloudflare Native**: Serverless edge execution on Cloudflare Pages and D1 with zero server management.
- **Scheduled Cron Support**: Cloudflare Worker (`worker/cron.ts`) for daily background automation (default: 05:00 WIB).

## Architecture

- **Frontend**: SvelteKit 2 (Svelte 5 runes) styled with Tailwind CSS v4 and dark palette.
- **Database**: Cloudflare D1 (SQLite at the edge).
- **Backend / Adapter**: `@sveltejs/adapter-cloudflare` on Cloudflare Pages.
- **Cron Worker**: Standalone Cloudflare Worker (`worker/cron.ts`) for scheduled triggers.

## Getting Started

### Prerequisites

- Node.js 18+
- Cloudflare Wrangler CLI (`npm install -g wrangler`)

### Local Development

1. Clone repository and install dependencies:
   ```bash
   git clone git@github.com:andrraa/kageheroes-autoclaim.git
   cd kageheroes-autoclaim
   npm install
   ```

2. Copy config examples:
   ```bash
   cp wrangler.toml.example wrangler.toml
   cp wrangler.cron.toml.example wrangler.cron.toml
   cp .env.example .env
   ```

3. Run database migrations locally:
   ```bash
   npx wrangler d1 migrations apply DB --local
   ```

4. Build and launch local development server:
   ```bash
   npm run build
   npx wrangler pages dev .svelte-kit/cloudflare --port 8799 --d1 DB=REPLACE_WITH_D1_DATABASE_ID --compatibility-flag nodejs_compat
   ```

5. Open `http://localhost:8799` in your browser.
   - Default local access code: `btnseven12` (or configured via `ACCESS_CODE` env variable).

## Deployment

### 1. Create Cloudflare D1 Database

```bash
npx wrangler d1 create kageheroes-claim
```

Copy the generated `database_id` into your local `wrangler.toml` and `wrangler.cron.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "kageheroes-claim"
database_id = "<YOUR_D1_DATABASE_ID>"
```

### 2. Apply Migrations to Remote D1

```bash
npx wrangler d1 migrations apply DB --remote
```

### 3. Set Environment Secrets

In your Cloudflare Pages and Worker settings (or via Wrangler CLI):

```bash
# Dashboard (Pages)
npx wrangler pages secret put ACCESS_CODE --project-name kageheroes-claim
npx wrangler pages secret put APP_ENCRYPTION_KEY --project-name kageheroes-claim
npx wrangler pages secret put TELEGRAM_BOT_TOKEN --project-name kageheroes-claim
npx wrangler pages secret put TELEGRAM_CHAT_ID --project-name kageheroes-claim

# Cron Worker
npx wrangler secret put APP_ENCRYPTION_KEY -c wrangler.cron.toml
npx wrangler secret put TELEGRAM_BOT_TOKEN -c wrangler.cron.toml
npx wrangler secret put TELEGRAM_CHAT_ID -c wrangler.cron.toml
```

- `ACCESS_CODE`: Secret passkey used to unlock the dashboard.
- `APP_ENCRYPTION_KEY`: 32-character key used for AES-GCM password encryption.
- `TELEGRAM_BOT_TOKEN`: (Optional) Telegram bot token for claim notification.
- `TELEGRAM_CHAT_ID`: (Optional) Telegram chat ID to receive notification.

### 4. Deploy Dashboard (Cloudflare Pages)

```bash
npm run build
npx wrangler pages deploy .svelte-kit/cloudflare --project-name kageheroes-claim
```

### 5. Deploy Cron Worker (Scheduled Daily Trigger)

```bash
npx wrangler deploy -c wrangler.cron.toml
```

## Security

- Game account passwords are encrypted using AES-GCM before being persisted in Cloudflare D1.
- All session authentication is handled through HTTP-only, secure cookies.
- CSRF protection and origin verification are enforced on all action endpoints.

## License

MIT License.

