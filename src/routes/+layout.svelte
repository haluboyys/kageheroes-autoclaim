<script lang="ts">
  import '../app.css';
  let { data, children } = $props();
</script>

<div class="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased">
  <header class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
      <a href="/" class="flex items-center gap-2 font-bold text-sm tracking-tight text-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" class="h-4 w-4 fill-current">
          <rect width="256" height="256" fill="none"></rect>
          <line x1="208" y1="128" x2="128" y2="208" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"></line>
          <line x1="192" y1="40" x2="40" y2="192" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="24"></line>
        </svg>
        <span>Ninja Heroes AutoClaim</span>
      </a>

      {#if data.authenticated}
        <form method="POST" action="?/logout">
          <button
            type="submit"
            class="inline-flex items-center justify-center rounded-md text-xs font-medium h-8 px-3 bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
          >
            Lock Session
          </button>
        </form>
      {/if}
    </div>
  </header>

  <main class="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
    {@render children()}
  </main>

  <footer class="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
    Ninja Heroes New Era Daily Auto-Claimer • Cloudflare Pages & D1
  </footer>
</div>
