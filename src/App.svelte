<script lang="ts">
  import { setContextClient, queryStore } from "@urql/svelte";
  import { client } from "./lib/graphql/client";
  import {
    DASHBOARD_STATS,
    TOWERS_BY_RAT,
    RECENT_TOWERS,
    PROVIDERS_LIST,
  } from "./lib/graphql/queries";
  import StatCard from "./lib/components/StatCard.svelte";
  import RATChart from "./lib/components/RATChart.svelte";
  import ProvidersTable from "./lib/components/ProvidersTable.svelte";
  import RecentTowers from "./lib/components/RecentTowers.svelte";

  setContextClient(client);

  const statsQuery = queryStore({ client, query: DASHBOARD_STATS });
  const ratQuery = queryStore({ client, query: TOWERS_BY_RAT });
  const recentQuery = queryStore({ client, query: RECENT_TOWERS, variables: { limit: 10 } });
  const providersQuery = queryStore({ client, query: PROVIDERS_LIST });

  let ratData = $derived(
    $ratQuery.data
      ? [
          { name: "LTE", count: $ratQuery.data.lte?.aggregate?.count || 0, color: "#3b82f6" },
          { name: "NR", count: $ratQuery.data.nr?.aggregate?.count || 0, color: "#8b5cf6" },
          { name: "GSM", count: $ratQuery.data.gsm?.aggregate?.count || 0, color: "#22c55e" },
          { name: "CDMA", count: $ratQuery.data.cdma?.aggregate?.count || 0, color: "#f59e0b" },
          { name: "UMTS", count: $ratQuery.data.umts?.aggregate?.count || 0, color: "#ec4899" },
        ]
      : []
  );
</script>

<main>
  <header>
    <h1>ACD Dashboard</h1>
    <p class="subtitle">Aerocell Data - Cell Tower Analytics</p>
  </header>

  {#if $statsQuery.fetching}
    <div class="loading">Loading dashboard data...</div>
  {:else if $statsQuery.error}
    <div class="error">
      <h2>Connection Error</h2>
      <p>Could not connect to Hasura GraphQL endpoint.</p>
      <code>{$statsQuery.error.message}</code>
    </div>
  {:else if $statsQuery.data}
    <section class="stats-grid">
      <StatCard
        title="Total Towers"
        value={$statsQuery.data.towers_aggregate?.aggregate?.count || 0}
        icon="📡"
        color="#3b82f6"
      />
      <StatCard
        title="Total Cells"
        value={$statsQuery.data.cells_aggregate?.aggregate?.count || 0}
        icon="📶"
        color="#8b5cf6"
      />
      <StatCard
        title="Providers"
        value={$statsQuery.data.providers_aggregate?.aggregate?.count || 0}
        icon="🏢"
        color="#22c55e"
      />
      <StatCard
        title="Band Records"
        value={$statsQuery.data.tower_bands_aggregate?.aggregate?.count || 0}
        icon="📊"
        color="#f59e0b"
      />
    </section>

    <section class="main-content">
      <div class="left-column">
        {#if !$ratQuery.fetching && ratData.length > 0}
          <RATChart data={ratData} />
        {/if}

        {#if !$providersQuery.fetching && $providersQuery.data?.providers}
          <ProvidersTable providers={$providersQuery.data.providers} />
        {/if}
      </div>

      <div class="right-column">
        {#if !$recentQuery.fetching && $recentQuery.data?.towers}
          <RecentTowers towers={$recentQuery.data.towers} />
        {/if}
      </div>
    </section>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: #0f0f1a;
    color: #f4f4f5;
    font-family:
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      Roboto,
      sans-serif;
  }

  main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }

  header {
    margin-bottom: 2rem;
  }

  h1 {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
    color: #f4f4f5;
  }

  .subtitle {
    margin: 0.5rem 0 0;
    color: #71717a;
    font-size: 1rem;
  }

  .loading {
    text-align: center;
    padding: 4rem;
    color: #a1a1aa;
    font-size: 1.125rem;
  }

  .error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
  }

  .error h2 {
    margin: 0 0 0.5rem;
    color: #ef4444;
  }

  .error p {
    margin: 0 0 1rem;
    color: #a1a1aa;
  }

  .error code {
    display: block;
    padding: 1rem;
    background: #1e1e2e;
    border-radius: 8px;
    color: #ef4444;
    font-size: 0.875rem;
    overflow-x: auto;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .main-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }

  .left-column,
  .right-column {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  @media (max-width: 1024px) {
    .main-content {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 640px) {
    main {
      padding: 1rem;
    }

    h1 {
      font-size: 1.5rem;
    }
  }
</style>
