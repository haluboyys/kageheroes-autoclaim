<script lang="ts">
  import { enhance } from '$app/forms';
  let { data, form } = $props();

  let isSubmitting = $state(false);
  let showAddModal = $state(false);
  let activeTab = $state<'accounts' | 'history'>('accounts');
  let claimingId = $state<string | null>(null);
  let isClaimingAll = $state(false);
</script>

{#if !data.authenticated}
  <div class="max-w-[380px] mx-auto mt-20">
    <div class="rounded-xl border border-border bg-card text-card-foreground shadow">
      <div class="flex flex-col space-y-1.5 p-6">
        <h3 class="font-semibold tracking-tight text-xl">Sign In</h3>
        <p class="text-xs text-muted-foreground">Enter your dashboard access code below.</p>
      </div>

      <div class="p-6 pt-0">
        {#if form?.error}
          <div class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            {form.error}
          </div>
        {/if}

        <form method="POST" action="?/unlock" use:enhance={() => {
          isSubmitting = true;
          return async ({ update }) => {
            isSubmitting = false;
            await update();
          };
        }}>
          <div class="grid gap-4">
            <div class="grid gap-2">
              <label for="access_code" class="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Access Code</label>
              <input
                id="access_code"
                name="access_code"
                type="password"
                placeholder="••••••••••••"
                required
                class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              class="inline-flex items-center justify-center rounded-md text-xs font-medium shadow transition-colors bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 disabled:opacity-50 cursor-pointer gap-2"
            >
              {#if isSubmitting}
                <svg class="animate-spin h-3.5 w-3.5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                <span>Verifying</span>
              {:else}
                <span>Continue</span>
              {/if}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{:else}
  <div class="space-y-6">
    <!-- Page Title & Actions -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 class="text-2xl font-bold tracking-tight">Overview</h2>
        <p class="text-xs text-muted-foreground mt-0.5">Manage accounts and review daily automation status.</p>
      </div>

      <div class="flex items-center gap-2">
        <button
          onclick={() => showAddModal = true}
          class="inline-flex items-center justify-center rounded-md text-xs font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3 transition-colors cursor-pointer"
        >
          Add Account
        </button>

        <form method="POST" action="?/claimAll" use:enhance={() => {
          isClaimingAll = true;
          return async ({ update }) => {
            isClaimingAll = false;
            await update();
          };
        }}>
          <button
            type="submit"
            disabled={isClaimingAll || claimingId !== null}
            class="inline-flex items-center justify-center rounded-md text-xs font-medium shadow bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 transition-colors gap-2 disabled:opacity-50 cursor-pointer"
          >
            {#if isClaimingAll}
              <svg class="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
              </svg>
              <span>Running...</span>
            {:else}
              <span>Claim All Active</span>
            {/if}
          </button>
        </form>
      </div>
    </div>

    {#if form?.message}
      <div class="rounded-lg border {form?.success ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-destructive/40 bg-destructive/10 text-destructive'} p-3 text-xs font-medium">
        {form.message}
      </div>
    {/if}

    <!-- Shadcn Tabs bar -->
    <div class="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground text-xs">
      <button
        onclick={() => activeTab = 'accounts'}
        class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 font-medium ring-offset-background transition-all cursor-pointer {activeTab === 'accounts' ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground'}"
      >
        Accounts ({data.accounts?.length || 0})
      </button>
      <button
        onclick={() => activeTab = 'history'}
        class="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 font-medium ring-offset-background transition-all cursor-pointer {activeTab === 'history' ? 'bg-background text-foreground shadow-sm' : 'hover:text-foreground'}"
      >
        History ({data.history?.length || 0})
      </button>
    </div>

    <!-- Accounts Tab -->
    {#if activeTab === 'accounts'}
      {#if !data.accounts || data.accounts.length === 0}
        <div class="flex min-h-[300px] flex-col items-center justify-center rounded-md border border-dashed border-border p-8 text-center animate-in fade-in-50">
          <div class="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <h3 class="mt-4 text-sm font-semibold">No accounts added</h3>
            <p class="mb-4 mt-2 text-xs text-muted-foreground">You have not registered any Ninja Heroes accounts yet.</p>
            <button
              onclick={() => showAddModal = true}
              class="inline-flex items-center justify-center rounded-md text-xs font-medium shadow bg-primary text-primary-foreground hover:bg-primary/90 h-8 px-3 cursor-pointer"
            >
              Add Account
            </button>
          </div>
        </div>
      {:else}
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {#each data.accounts as acc}
            <div class="rounded-xl border border-border bg-card text-card-foreground shadow-sm flex flex-col justify-between p-5 space-y-4">
              <div class="space-y-3">
                <div class="flex items-start justify-between gap-2">
                  <div class="space-y-0.5 min-w-0">
                    <h4 class="font-semibold text-sm leading-none truncate" title={acc.label}>{acc.label}</h4>
                    <p class="text-xs text-muted-foreground font-mono truncate" title={acc.game_email}>{acc.game_email}</p>
                  </div>
                  <span class="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold transition-colors {acc.enabled ? 'border-transparent bg-secondary text-secondary-foreground' : 'border-border text-muted-foreground'}">
                    {acc.enabled ? 'Active' : 'Paused'}
                  </span>
                </div>

                <div class="rounded-md border border-border bg-muted/40 p-3 space-y-1 text-xs font-mono">
                  <div class="flex justify-between text-muted-foreground">
                    <span>Server</span>
                    <span class="text-foreground font-medium">Server {acc.server_id}</span>
                  </div>
                  <div class="flex justify-between text-muted-foreground">
                    <span>Last Status</span>
                    <span class="{acc.last_status === 'success' ? 'text-emerald-400 font-medium' : acc.last_status === 'failed' ? 'text-destructive font-medium' : 'text-muted-foreground'}">
                      {acc.last_status || 'Idle'}
                    </span>
                  </div>
                  {#if acc.last_message}
                    <div class="pt-1.5 border-t border-border text-[11px] text-muted-foreground truncate" title={acc.last_message}>
                      {acc.last_message}
                    </div>
                  {/if}
                </div>
              </div>

              <div class="flex items-center justify-between pt-1">
                <form method="POST" action="?/claimNow" use:enhance={() => {
                  claimingId = acc.id;
                  return async ({ update }) => {
                    claimingId = null;
                    await update();
                  };
                }}>
                  <input type="hidden" name="id" value={acc.id} />
                  <button
                    type="submit"
                    disabled={claimingId === acc.id || isClaimingAll}
                    class="inline-flex items-center justify-center rounded-md text-xs font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-8 px-3 transition-colors gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {#if claimingId === acc.id}
                      <svg class="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      <span>Claiming...</span>
                    {:else}
                      <span>Claim Now</span>
                    {/if}
                  </button>
                </form>

                <div class="flex items-center gap-1.5">
                  <form method="POST" action="?/toggleAccount" use:enhance>
                    <input type="hidden" name="id" value={acc.id} />
                    <input type="hidden" name="enabled" value={acc.enabled} />
                    <button
                      type="submit"
                      class="inline-flex items-center justify-center rounded-md text-xs font-medium hover:bg-accent hover:text-accent-foreground h-8 px-2.5 text-muted-foreground transition-colors cursor-pointer"
                    >
                      {acc.enabled ? 'Pause' : 'Resume'}
                    </button>
                  </form>

                  <form method="POST" action="?/deleteAccount" use:enhance onsubmit={(e) => !confirm('Delete this account?') && e.preventDefault()}>
                    <input type="hidden" name="id" value={acc.id} />
                    <button
                      type="submit"
                      class="inline-flex items-center justify-center rounded-md text-xs font-medium hover:bg-destructive/15 text-muted-foreground hover:text-destructive h-8 px-2.5 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}

    <!-- History Tab -->
    {#if activeTab === 'history'}
      {#if !data.history || data.history.length === 0}
        <div class="flex min-h-[300px] flex-col items-center justify-center rounded-md border border-dashed border-border p-8 text-center">
          <h3 class="text-sm font-semibold">No claim history</h3>
          <p class="mt-1 text-xs text-muted-foreground">Executed claim attempts will be logged here.</p>
        </div>
      {:else}
        <div class="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div class="relative w-full overflow-auto">
            <table class="w-full caption-bottom text-xs">
              <thead class="[&_tr]:border-b border-border bg-muted/50">
                <tr class="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th class="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Account</th>
                  <th class="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Reward</th>
                  <th class="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                  <th class="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Message</th>
                  <th class="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody class="[&_tr:last-child]:border-0">
                {#each data.history as item}
                  <tr class="border-b border-border transition-colors hover:bg-muted/50">
                    <td class="p-4 align-middle">
                      <div class="font-medium">{item.label || 'Unknown'}</div>
                      <div class="text-[11px] text-muted-foreground font-mono">{item.game_email}</div>
                    </td>
                    <td class="p-4 align-middle font-medium">{item.reward_name || 'Daily Event'}</td>
                    <td class="p-4 align-middle">
                      <span class="inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold font-mono {item.status === 'success' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-destructive/30 bg-destructive/10 text-destructive'}">
                        {item.status}
                      </span>
                    </td>
                    <td class="p-4 align-middle text-muted-foreground max-w-xs truncate" title={item.message}>
                      {item.message || '-'}
                    </td>
                    <td class="p-4 align-middle text-right font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                      {new Date(item.attempted_at).toLocaleString('id-ID')}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Add Account Modal (shadcn Dialog) -->
  {#if showAddModal}
    <div class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="relative w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg space-y-4">
        <div class="flex flex-col space-y-1.5 text-center sm:text-left">
          <h3 class="text-base font-semibold leading-none tracking-tight">Add Game Account</h3>
          <p class="text-xs text-muted-foreground">Credentials are securely encrypted using AES-GCM prior to storage.</p>
        </div>

        <form method="POST" action="?/addAccount" use:enhance={() => {
          return async ({ update }) => {
            showAddModal = false;
            await update();
          };
        }} class="grid gap-3.5">
          <div class="grid gap-1.5">
            <label for="acc_label" class="text-xs font-medium leading-none">Account Label</label>
            <input
              id="acc_label"
              name="label"
              placeholder="e.g. Main Character"
              required
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div class="grid gap-1.5">
            <label for="acc_email" class="text-xs font-medium leading-none">Game Email</label>
            <input
              id="acc_email"
              name="game_email"
              type="email"
              placeholder="user@example.com"
              required
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
            />
          </div>

          <div class="grid gap-1.5">
            <label for="acc_pass" class="text-xs font-medium leading-none">Game Password</label>
            <input
              id="acc_pass"
              name="game_password"
              type="password"
              placeholder="••••••••"
              required
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
            />
          </div>

          <div class="grid gap-1.5">
            <label for="acc_server" class="text-xs font-medium leading-none">Server ID (e.g. 45 / 0 for auto-detect)</label>
            <input
              id="acc_server"
              name="server_id"
              type="text"
              value="0"
              placeholder="0"
              required
              class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
            />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onclick={() => showAddModal = false}
              class="inline-flex items-center justify-center rounded-md text-xs font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="inline-flex items-center justify-center rounded-md text-xs font-medium shadow bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 cursor-pointer"
            >
              Save Account
            </button>
          </div>
        </form>
      </div>
    </div>
  {/if}
{/if}
