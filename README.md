# Ninja Heroes AutoClaim

Automated daily reward claimer for **Ninja Heroes New Era** ([kageherostudio.com](https://kageherostudio.com)). Built with SvelteKit, TypeScript, Tailwind CSS, and Cloudflare Pages + D1 Database.

## Features

- **Access Code Gate**: Simple passkey protection without complex user registration tables.
- **Account Management**: Manage multiple game accounts with AES-GCM encrypted credential storage.
- **Automated Daily Claiming**: Automated session negotiation and claim submission against Kage Hero Studio endpoints.
- **Server Auto-Detection**: Automatically resolves the active character and server ID if set to `0`.
- **Claim History**: Detailed logs of previous daily claims including item name, status, and server response.
- **Cloudflare Native**: Designed to run on Cloudflare Pages and D1 with minimal cold-start overhead.
- **Scheduled Cron Support**: Cloudflare Worker script included for automated daily background execution.

## Architecture

- **Frontend**: SvelteKit 2 (Svelte 5 runes) styled with Tailwind CSS v4 and shadcn-inspired dark palette.
- **Database**: Cloudflare D1 (SQLite at the edge).
- **Backend / Adapter**: `@sveltejs/adapter-cloudflare` on Cloudflare Pages.
- **Cron Worker**: Standalone Cloudflare Worker (`worker/cron.ts`) for triggering scheduled claims.

## Getting Started

### Prerequisites

- Node.js 18+
- Cloudflare Wrangler CLI (`npm install -g wrangler`)

### Local Development

1. Clone repository and install dependencies:
   ```bash
   git clone <repo-url>
   cd kageheroes-claim
   npm install
   ```

2. Run database migrations locally:
   ```bash
   npx wrangler d1 migrations apply DB --local
   ```

3. Build and launch local development server:
   ```bash
   npm run build
   npx wrangler pages dev .svelte-kit/cloudflare --port 8799 --d1 DB=REPLACE_WITH_D1_DATABASE_ID --compatibility-flag nodejs_compat
   ```

4. Open `http://localhost:8799` in your browser.
   - Default local access code: `btnseven12` (or configured via `ACCESS_CODE` env variable).

## Deployment

### 1. Create Cloudflare D1 Database

```bash
npx wrangler d1 create kageheroes-claim
```

Copy the generated `database_id` and update `wrangler.toml` and `wrangler.cron.toml`:

```bash
cp wrangler.cron.toml.example wrangler.cron.toml
```

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

In your Cloudflare Pages project settings and Worker settings (or via Wrangler):
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
