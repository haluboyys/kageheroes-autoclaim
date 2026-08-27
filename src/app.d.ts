/// <reference types="@sveltejs/kit" />
/// <reference types="@cloudflare/workers-types" />

declare global {
  namespace App {
    interface Locals {
      authenticated: boolean;
    }
    interface Platform {
      env: {
        DB: D1Database;
        ACCESS_CODE?: string;
        APP_ENCRYPTION_KEY?: string;
      };
      context: ExecutionContext;
      caches: CacheStorage & { default: Cache };
    }
  }
}

export {};
