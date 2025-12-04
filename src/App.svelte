<script lang="ts">
  import { setContextClient, queryStore } from "@urql/svelte";
  import { client } from "./lib/graphql/client";
  import {
    DASHBOARD_STATS,
    TOWERS_BY_RAT,
    TOWERS_BY_TYPE,
    RECENT_TOWERS,
    PROVIDERS_WITH_STATS,
    BAND_DISTRIBUTION,
  } from "./lib/graphql/queries";
  import StatCard from "./lib/components/StatCard.svelte";
  import BarChart from "./lib/components/BarChart.svelte";
  import ProvidersTable from "./lib/components/ProvidersTable.svelte";
  import RecentTowers from "./lib/components/RecentTowers.svelte";

  setContextClient(client);

  const statsQuery = queryStore({ client, query: DASHBOARD_STATS });
  const ratQuery = queryStore({ client, query: TOWERS_BY_RAT });
  const typeQuery = queryStore({ client, query: TOWERS_BY_TYPE });
  const recentQuery = queryStore({
    client,
    query: RECENT_TOWERS,
    variables: { limit: 8 },
  });
  const providersQuery = queryStore({ client, query: PROVIDERS_WITH_STATS });
  const bandQuery = queryStore({ client, query: BAND_DISTRIBUTION });

  let ratData = $derived(
    $ratQuery.data
      ? [
          { name: "LTE", count: $ratQuery.data.lte?.aggregate?.count || 0, color: "#3b82f6" },
          { name: "5G NR", count: $ratQuery.data.nr?.aggregate?.count || 0, color: "#8b5cf6" },
          { name: "UMTS", count: $ratQuery.data.umts?.aggregate?.count || 0, color: "#ec4899" },
          { name: "CDMA", count: $ratQuery.data.cdma?.aggregate?.count || 0, color: "#f59e0b" },
          { name: "GSM", count: $ratQuery.data.gsm?.aggregate?.count || 0, color: "#22c55e" },
        ]
      : []
  );

  let typeData = $derived(
    $typeQuery.data
      ? [
          { name: "Macro", count: $typeQuery.data.macro?.aggregate?.count || 0, color: "#3b82f6" },
          { name: "Micro", count: $typeQuery.data.micro?.aggregate?.count || 0, color: "#8b5cf6" },
          { name: "Pico", count: $typeQuery.data.pico?.aggregate?.count || 0, color: "#22c55e" },
          { name: "DAS", count: $typeQuery.data.das?.aggregate?.count || 0, color: "#f59e0b" },
          { name: "COW", count: $typeQuery.data.cow?.aggregate?.count || 0, color: "#ef4444" },
          {
            name: "Decommissioned",
            count: $typeQuery.data.decommissioned?.aggregate?.count || 0,
            color: "#71717a",
          },
        ]
      : []
  );

  let bandData = $derived(
    $bandQuery.data
      ? [
          { name: "B2 (PCS)", count: $bandQuery.data.b2?.aggregate?.count || 0, color: "#3b82f6" },
          { name: "B4 (AWS)", count: $bandQuery.data.b4?.aggregate?.count || 0, color: "#8b5cf6" },
          { name: "B5 (CLR)", count: $bandQuery.data.b5?.aggregate?.count || 0, color: "#22c55e" },
          { name: "B12 (SMH)", count: $bandQuery.data.b12?.aggregate?.count || 0, color: "#f59e0b" },
          { name: "B13 (Verizon)", count: $bandQuery.data.b13?.aggregate?.count || 0, color: "#cd040b" },
          { name: "B14 (FirstNet)", count: $bandQuery.data.b14?.aggregate?.count || 0, color: "#00a8e0" },
          { name: "B30 (WCS)", count: $bandQuery.data.b30?.aggregate?.count || 0, color: "#ec4899" },
        ]
      : []
  );
</script>

<main>
  <header>
    <div class="header-content">
      <h1>ACD Dashboard</h1>
      <p class="subtitle">Aerocell Data - Cell Tower Analytics</p>
    </div>
    <div class="header-meta">
      {#if $statsQuery.data}
        <span class="last-updated">
          {new Date().toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      {/if}
    </div>
  </header>

  {#if $statsQuery.fetching}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading dashboard data...</p>
    </div>
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
        title="Carriers"
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
      <StatCard
        title="EN-DC Capable"
        value={$statsQuery.data.endc_towers?.aggregate?.count || 0}
        icon="⚡"
        color="#ec4899"
      />
    </section>

    <section class="charts-grid">
      {#if !$ratQuery.fetching && ratData.length > 0}
        <BarChart title="Towers by Technology (RAT)" data={ratData} />
      {/if}

      {#if !$typeQuery.fetching && typeData.length > 0}
        <BarChart title="Towers by Type" data={typeData} />
      {/if}

      {#if !$bandQuery.fetching && bandData.length > 0}
        <BarChart title="LTE Band Distribution" data={bandData} />
      {/if}
    </section>

    <section class="main-content">
      <div class="left-column">
        {#if !$providersQuery.fetching && $providersQuery.data?.providers}
          <ProvidersTable providers={$providersQuery.data.providers} />
        {/if}
      </div>

      <div class="right-column">
        {#if !$recentQuery.fetching && $recentQuery.data?.towers}
          <RecentTowers towers={$recentQuery.data.towers} title="Newest Towers Discovered" />
        {/if}
      </div>
    </section>
  {/if}
</main>

<style>
  :global(*) {
    box-sizing: border-box;
  }

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
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  main {
    max-width: 1600px;
    margin: 0 auto;
    padding: 2rem;
    min-height: 100vh;
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
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

  .header-meta {
    text-align: right;
  }

  .last-updated {
    font-size: 0.875rem;
    color: #52525b;
  }

  .loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 6rem;
    color: #a1a1aa;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #27273a;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
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
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.25rem;
    margin-bottom: 2rem;
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .main-content {
    display: grid;
    grid-template-columns: 1.2fr 1fr;
    gap: 1.5rem;
  }

  .left-column,
  .right-column {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  @media (max-width: 1200px) {
    .main-content {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    main {
      padding: 1rem;
    }

    header {
      flex-direction: column;
      gap: 0.5rem;
    }

    h1 {
      font-size: 1.5rem;
    }

    .stats-grid {
      grid-template-columns: repeat(2, 1fr);
    }

    .charts-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
