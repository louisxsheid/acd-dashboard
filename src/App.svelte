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
    TOWERS_IN_BOUNDS,
    TOWER_GROWTH,
    DATA_FRESHNESS,
    SIGNAL_STATS,
    CARRIER_BANDS,
  } from "./lib/graphql/queries";
  import StatCard from "./lib/components/StatCard.svelte";
  import BarChart from "./lib/components/BarChart.svelte";
  import ProvidersTable from "./lib/components/ProvidersTable.svelte";
  import RecentTowers from "./lib/components/RecentTowers.svelte";
  import TowerMap from "./lib/components/TowerMap.svelte";
  import TimelineChart from "./lib/components/TimelineChart.svelte";
  import SignalStats from "./lib/components/SignalStats.svelte";
  import DataFreshness from "./lib/components/DataFreshness.svelte";
  import CarrierBands from "./lib/components/CarrierBands.svelte";

  setContextClient(client);

  type Tab = "dashboard" | "map" | "analytics";
  let activeTab: Tab = $state("dashboard");

  // Dashboard queries
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

  // Analytics queries
  const growthQuery = queryStore({ client, query: TOWER_GROWTH });
  const freshnessQuery = queryStore({ client, query: DATA_FRESHNESS });
  const signalQuery = queryStore({ client, query: SIGNAL_STATS });
  const carrierBandsQuery = queryStore({ client, query: CARRIER_BANDS });

  // Map state
  let mapBounds = $state({
    minLat: 24.396308,
    maxLat: 49.384358,
    minLng: -125.0,
    maxLng: -66.93457,
  });
  let mapTowers: any[] = $state([]);
  let mapTotalCount = $state(0);
  let mapLoading = $state(false);

  async function loadMapTowers() {
    mapLoading = true;
    try {
      const result = await client.query(TOWERS_IN_BOUNDS, {
        ...mapBounds,
        limit: 5000,
        rat: null,
        provider_id: null,
      }).toPromise();

      if (result.data) {
        mapTowers = result.data.towers || [];
        mapTotalCount = result.data.towers_aggregate?.aggregate?.count || 0;
      }
    } finally {
      mapLoading = false;
    }
  }

  function handleBoundsChange(bounds: typeof mapBounds) {
    mapBounds = bounds;
    loadMapTowers();
  }

  // Derived data for charts
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

  let growthData = $derived(
    $growthQuery.data
      ? [
          { label: "<2020", count: $growthQuery.data.before2020?.aggregate?.count || 0, color: "#52525b" },
          { label: "2020", count: $growthQuery.data.y2020?.aggregate?.count || 0, color: "#71717a" },
          { label: "2021", count: $growthQuery.data.y2021?.aggregate?.count || 0, color: "#3b82f6" },
          { label: "2022", count: $growthQuery.data.y2022?.aggregate?.count || 0, color: "#8b5cf6" },
          { label: "2023", count: $growthQuery.data.y2023?.aggregate?.count || 0, color: "#22c55e" },
          { label: "2024", count: $growthQuery.data.y2024?.aggregate?.count || 0, color: "#f59e0b" },
          { label: "2025", count: $growthQuery.data.y2025?.aggregate?.count || 0, color: "#ec4899" },
        ]
      : []
  );

  let freshnessData = $derived(
    $freshnessQuery.data
      ? [
          { label: "Last 24h", count: $freshnessQuery.data.last_24h?.aggregate?.count || 0, color: "#22c55e" },
          { label: "Last 7 days", count: $freshnessQuery.data.last_7d?.aggregate?.count || 0, color: "#3b82f6" },
          { label: "Last 30 days", count: $freshnessQuery.data.last_30d?.aggregate?.count || 0, color: "#8b5cf6" },
          { label: "Last 90 days", count: $freshnessQuery.data.last_90d?.aggregate?.count || 0, color: "#f59e0b" },
          { label: "Last year", count: $freshnessQuery.data.last_year?.aggregate?.count || 0, color: "#f97316" },
          { label: "Older", count: $freshnessQuery.data.older?.aggregate?.count || 0, color: "#71717a" },
        ]
      : []
  );

  let carrierBandsData = $derived(
    $carrierBandsQuery.data?.providers?.map((p: any) => ({
      country_id: p.country_id,
      provider_id: p.provider_id,
      b2: p.b2?.aggregate?.count || 0,
      b4: p.b4?.aggregate?.count || 0,
      b12: p.b12?.aggregate?.count || 0,
      b13: p.b13?.aggregate?.count || 0,
      b14: p.b14?.aggregate?.count || 0,
    })) || []
  );
</script>

<main>
  <header>
    <div class="header-content">
      <h1>ACD Dashboard</h1>
      <p class="subtitle">Aerocell Data - Cell Tower Analytics</p>
    </div>
    <nav class="tabs">
      <button
        class="tab"
        class:active={activeTab === "dashboard"}
        onclick={() => (activeTab = "dashboard")}
      >
        Overview
      </button>
      <button
        class="tab"
        class:active={activeTab === "map"}
        onclick={() => {
          activeTab = "map";
          if (mapTowers.length === 0) loadMapTowers();
        }}
      >
        Map
      </button>
      <button
        class="tab"
        class:active={activeTab === "analytics"}
        onclick={() => (activeTab = "analytics")}
      >
        Analytics
      </button>
    </nav>
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
    {#if activeTab === "dashboard"}
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
    {:else if activeTab === "map"}
      <section class="map-section">
        <TowerMap
          towers={mapTowers}
          totalCount={mapTotalCount}
          loading={mapLoading}
          onBoundsChange={handleBoundsChange}
        />
      </section>
    {:else if activeTab === "analytics"}
      <section class="analytics-section">
        <div class="analytics-row">
          {#if !$growthQuery.fetching && growthData.length > 0}
            <TimelineChart title="Tower Discovery by Year" data={growthData} />
          {/if}

          {#if !$freshnessQuery.fetching && freshnessData.length > 0}
            <DataFreshness data={freshnessData} />
          {/if}
        </div>

        <div class="analytics-row">
          {#if !$signalQuery.fetching && $signalQuery.data}
            <SignalStats
              signalAvg={$signalQuery.data.cells_aggregate?.aggregate?.avg?.signal}
              signalMin={$signalQuery.data.cells_aggregate?.aggregate?.min?.signal}
              signalMax={$signalQuery.data.cells_aggregate?.aggregate?.max?.signal}
              avgDownload={$signalQuery.data.speed_stats?.aggregate?.avg?.avg_speed_down_mbps}
              maxDownload={$signalQuery.data.speed_stats?.aggregate?.max?.max_speed_down_mbps}
              avgUpload={$signalQuery.data.speed_stats?.aggregate?.avg?.avg_speed_up_mbps}
              maxUpload={$signalQuery.data.speed_stats?.aggregate?.max?.max_speed_up_mbps}
              avgSnr={$signalQuery.data.snr_stats?.aggregate?.avg?.lte_snr_max}
              avgRsrq={$signalQuery.data.snr_stats?.aggregate?.avg?.lte_rsrq_max}
            />
          {/if}
        </div>

        <div class="analytics-row">
          {#if !$carrierBandsQuery.fetching && carrierBandsData.length > 0}
            <CarrierBands carriers={carrierBandsData} />
          {/if}
        </div>
      </section>
    {/if}
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
    flex-wrap: wrap;
    gap: 1rem;
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

  .tabs {
    display: flex;
    gap: 0.5rem;
    background: #1e1e2e;
    padding: 0.375rem;
    border-radius: 10px;
  }

  .tab {
    padding: 0.625rem 1.25rem;
    border: none;
    background: transparent;
    color: #a1a1aa;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .tab:hover {
    color: #f4f4f5;
  }

  .tab.active {
    background: #3b82f6;
    color: white;
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

  .map-section {
    margin-bottom: 2rem;
  }

  .analytics-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .analytics-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
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
      gap: 1rem;
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

    .analytics-row {
      grid-template-columns: 1fr;
    }
  }
</style>
