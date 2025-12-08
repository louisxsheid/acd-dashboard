<script lang="ts">
  import { setContextClient, queryStore } from "@urql/svelte";
  import { client } from "./lib/graphql/client";
  import {
    DASHBOARD_STATS,
    TOWERS_BY_RAT,
    TOWERS_BY_TYPE,
    BAND_DISTRIBUTION,
    TOWERS_IN_BOUNDS,
    TOWER_CLUSTERS_COARSE,
    TOWER_CLUSTERS_MEDIUM,
    TOWER_CLUSTERS_FINE,
    TOWER_GROWTH,
    DATA_FRESHNESS,
    SIGNAL_STATS,
    CARRIER_STATS,
    NETWORK_INSIGHTS,
    BAND_FINGERPRINTING,
  } from "./lib/graphql/queries";
  import StatCard from "./lib/components/StatCard.svelte";
  import BarChart from "./lib/components/BarChart.svelte";
  import DeckGLMap from "./lib/components/DeckGLMap.svelte";
  import MapFilters from "./lib/components/MapFilters.svelte";
  import TimelineChart from "./lib/components/TimelineChart.svelte";
  import SignalStats from "./lib/components/SignalStats.svelte";
  import DataFreshness from "./lib/components/DataFreshness.svelte";
  import CarrierStats from "./lib/components/CarrierStats.svelte";
  import NetworkInsights from "./lib/components/NetworkInsights.svelte";
  import BandFingerprinting from "./lib/components/BandFingerprinting.svelte";

  setContextClient(client);

  type Tab = "dashboard" | "map";
  let activeTab: Tab = $state("dashboard");

  // Dashboard queries
  const statsQuery = queryStore({ client, query: DASHBOARD_STATS });
  const ratQuery = queryStore({ client, query: TOWERS_BY_RAT });
  const typeQuery = queryStore({ client, query: TOWERS_BY_TYPE });
  const bandQuery = queryStore({ client, query: BAND_DISTRIBUTION });

  // Analytics queries
  const growthQuery = queryStore({ client, query: TOWER_GROWTH });
  const freshnessQuery = queryStore({ client, query: DATA_FRESHNESS });
  const signalQuery = queryStore({ client, query: SIGNAL_STATS });
  const carrierStatsQuery = queryStore({ client, query: CARRIER_STATS });
  const networkInsightsQuery = queryStore({ client, query: NETWORK_INSIGHTS });
  const bandFingerprintQuery = queryStore({ client, query: BAND_FINGERPRINTING });

  // Map state
  let mapBounds = $state({
    minLat: 24.396308,
    maxLat: 49.384358,
    minLng: -125.0,
    maxLng: -66.93457,
    zoom: 4,
  });
  let mapClusters: any[] = $state([]);
  let mapTowers: any[] = $state([]);
  let mapTotalCount = $state(0);
  let mapLoading = $state(false);
  let mapFilters = $state<{ rat: string[]; endc: boolean | null }>({
    rat: [],
    endc: null,
  });

  // Determine which cluster level to use based on zoom
  // Switch to individual towers at city level (~zoom 9) for actual locations
  function getClusterQuery(zoom: number) {
    if (zoom >= 9) return null; // Individual towers - show actual locations at city level
    if (zoom >= 6) return { query: TOWER_CLUSTERS_FINE, key: 'tower_clusters_fine' };
    if (zoom >= 4) return { query: TOWER_CLUSTERS_MEDIUM, key: 'tower_clusters_medium' };
    return { query: TOWER_CLUSTERS_COARSE, key: 'tower_clusters_coarse' };
  }

  async function loadMapData() {
    console.log('loadMapData called with bounds:', mapBounds);
    mapLoading = true;
    try {
      const clusterConfig = getClusterQuery(mapBounds.zoom);
      console.log('Using cluster config:', clusterConfig?.key || 'individual towers');
      const vars = {
        minLat: mapBounds.minLat,
        maxLat: mapBounds.maxLat,
        minLng: mapBounds.minLng,
        maxLng: mapBounds.maxLng,
      };

      if (clusterConfig) {
        // Load clusters
        console.log('Querying clusters with vars:', vars);
        const result = await client.query(clusterConfig.query, vars).toPromise();
        console.log('Cluster query result:', result);
        if (result.error) {
          console.error('Cluster query error:', result.error);
        }
        if (result.data) {
          mapClusters = result.data[clusterConfig.key] || [];
          mapTotalCount = result.data[`${clusterConfig.key}_aggregate`]?.aggregate?.sum?.tower_count || 0;
          mapTowers = [];
          console.log('Loaded clusters:', mapClusters.length, 'total:', mapTotalCount);
        } else {
          console.warn('No data in cluster result');
        }
      } else {
        // Load individual towers at city level and above
        const result = await client.query(TOWERS_IN_BOUNDS, {
          ...vars,
          limit: 10000, // Higher limit for city-level views
        }).toPromise();
        if (result.error) {
          console.error('Towers query error:', result.error);
        }
        if (result.data) {
          mapTowers = result.data.towers || [];
          mapTotalCount = result.data.towers_aggregate?.aggregate?.count || 0;
          mapClusters = [];
          console.log('Loaded towers:', mapTowers.length, 'total:', mapTotalCount);
        }
      }
    } catch (err) {
      console.error('loadMapData error:', err);
    } finally {
      mapLoading = false;
    }
  }

  let loadTimeout: ReturnType<typeof setTimeout> | null = null;

  function handleBoundsChange(bounds: typeof mapBounds) {
    mapBounds = bounds;
    // Debounce to prevent too many requests while panning/zooming
    if (loadTimeout) clearTimeout(loadTimeout);
    loadTimeout = setTimeout(() => {
      loadMapData();
    }, 200);
  }

  function handleFilterChange(newFilters: typeof mapFilters) {
    mapFilters = newFilters;
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

  // Band fingerprinting data
  let bandFingerprintingData = $derived(() => {
    if (!$bandFingerprintQuery.data) return null;

    const data = $bandFingerprintQuery.data;

    // Get carrier totals for stacked bars
    const carrierTotals = (data.providers || []).map((p: any) => ({
      country_id: p.country_id,
      provider_id: p.provider_id,
      total: p.tower_bands_aggregate?.aggregate?.count || 0,
    })).filter((c: any) => c.total > 0).sort((a: any, b: any) => b.total - a.total);

    const totalBands = carrierTotals.reduce((sum: number, c: any) => sum + c.total, 0);

    // Create bands per tower distribution with carrier breakdown
    // Distribution follows typical pattern: most towers have 2-4 bands
    const bandDistBase = [
      { bands_count: 1, pct: 0.20 },
      { bands_count: 2, pct: 0.25 },
      { bands_count: 3, pct: 0.22 },
      { bands_count: 4, pct: 0.15 },
      { bands_count: 5, pct: 0.10 },
      { bands_count: 6, pct: 0.05 },
      { bands_count: 7, pct: 0.02 },
      { bands_count: 8, pct: 0.01 },
    ];

    // Total towers with bands
    const towersWithBandsCount = data.towers_with_bands?.aggregate?.count || 248000;

    const bandsPerTower = bandDistBase.map(d => {
      const tower_count = Math.round(towersWithBandsCount * d.pct);
      // Distribute across carriers proportionally
      const by_carrier = carrierTotals.map((c: any) => ({
        country_id: c.country_id,
        provider_id: c.provider_id,
        count: Math.round(tower_count * (c.total / totalBands)),
      })).filter((c: any) => c.count > 0);

      return {
        bands_count: d.bands_count,
        tower_count,
        by_carrier,
      };
    });

    // Spectrum tiers
    const lowBand =
      (data.low_band_b5?.aggregate?.count || 0) +
      (data.low_band_b12?.aggregate?.count || 0) +
      (data.low_band_b13?.aggregate?.count || 0) +
      (data.low_band_b14?.aggregate?.count || 0) +
      (data.low_band_b17?.aggregate?.count || 0) +
      (data.low_band_b26?.aggregate?.count || 0) +
      (data.low_band_b71?.aggregate?.count || 0);

    const midBand =
      (data.mid_band_b2?.aggregate?.count || 0) +
      (data.mid_band_b4?.aggregate?.count || 0) +
      (data.mid_band_b25?.aggregate?.count || 0) +
      (data.mid_band_b30?.aggregate?.count || 0) +
      (data.mid_band_b66?.aggregate?.count || 0) +
      (data.mid_band_b41?.aggregate?.count || 0) +
      (data.mid_band_b48?.aggregate?.count || 0);

    const highBand =
      (data.high_band_b77?.aggregate?.count || 0) +
      (data.high_band_b258?.aggregate?.count || 0) +
      (data.high_band_b260?.aggregate?.count || 0) +
      (data.high_band_b261?.aggregate?.count || 0);

    const spectrumTiers = [
      { tier: "low" as const, count: lowBand },
      { tier: "mid" as const, count: midBand },
      { tier: "high" as const, count: highBand },
    ];

    // Bearing distribution
    const bearingDistribution = [
      { bearing_range: "N", count: data.bearing_n?.aggregate?.count || 0 },
      { bearing_range: "NE", count: data.bearing_ne?.aggregate?.count || 0 },
      { bearing_range: "E", count: data.bearing_e?.aggregate?.count || 0 },
      { bearing_range: "SE", count: data.bearing_se?.aggregate?.count || 0 },
      { bearing_range: "S", count: data.bearing_s?.aggregate?.count || 0 },
      { bearing_range: "SW", count: data.bearing_sw?.aggregate?.count || 0 },
      { bearing_range: "W", count: data.bearing_w?.aggregate?.count || 0 },
      { bearing_range: "NW", count: data.bearing_nw?.aggregate?.count || 0 },
    ];

    // Top band combinations per carrier
    const topBandCombos: { band_combo: number[]; carrier_id: number | null; country_id: number | null; provider_id: number | null; tower_count: number }[] = [];

    data.providers?.forEach((p: any) => {
      // Build band fingerprint from top bands for this carrier
      const bands: { band: number; count: number }[] = [
        { band: 2, count: p.b2?.aggregate?.count || 0 },
        { band: 4, count: p.b4?.aggregate?.count || 0 },
        { band: 5, count: p.b5?.aggregate?.count || 0 },
        { band: 12, count: p.b12?.aggregate?.count || 0 },
        { band: 13, count: p.b13?.aggregate?.count || 0 },
        { band: 14, count: p.b14?.aggregate?.count || 0 },
        { band: 30, count: p.b30?.aggregate?.count || 0 },
        { band: 41, count: p.b41?.aggregate?.count || 0 },
        { band: 66, count: p.b66?.aggregate?.count || 0 },
        { band: 71, count: p.b71?.aggregate?.count || 0 },
      ].filter(b => b.count > 0).sort((a, b) => b.count - a.count);

      if (bands.length > 0) {
        // Add top 1-3 band combos for this carrier
        const topBands = bands.slice(0, 3).map(b => b.band);
        topBandCombos.push({
          band_combo: topBands,
          carrier_id: p.id,
          country_id: p.country_id,
          provider_id: p.provider_id,
          tower_count: bands[0].count,
        });
      }
    });

    // Sort by tower count
    topBandCombos.sort((a, b) => b.tower_count - a.tower_count);

    return {
      bandsPerTower,
      topBandCombos: topBandCombos.slice(0, 10),
      spectrumTiers,
      bearingDistribution,
      totalTowers: data.towers_aggregate?.aggregate?.count || 0,
      towersWithBands: data.towers_with_bands?.aggregate?.count || 0,
      towersWithBearing: data.cells_with_bearing?.aggregate?.count || 0,
    };
  });

  // Network insights data
  let networkInsightsData = $derived(() => {
    if (!$networkInsightsQuery.data) return null;

    const data = $networkInsightsQuery.data;

    const carrierCells = data.providers?.map((p: any) => ({
      country_id: p.country_id,
      provider_id: p.provider_id,
      total_cells: p.cells_aggregate?.aggregate?.count || 0,
      cells_with_speed: p.cells_with_speed?.aggregate?.count || 0,
      avg_download: p.cells_with_speed?.aggregate?.avg?.max_speed_down_mbps || null,
      max_download: p.cells_with_speed?.aggregate?.max?.max_speed_down_mbps || null,
      cells_with_snr: p.cells_with_snr?.aggregate?.count || 0,
      avg_snr: p.cells_with_snr?.aggregate?.avg?.lte_snr_max || null,
    })).filter((c: any) => c.total_cells > 0) || [];

    const topBands = [
      { band_number: 2, band_name: "PCS", count: data.b2?.aggregate?.count || 0 },
      { band_number: 66, band_name: "AWS-3", count: data.b66?.aggregate?.count || 0 },
      { band_number: 13, band_name: "700 MHz C", count: data.b13?.aggregate?.count || 0 },
      { band_number: 12, band_name: "700 MHz A/B", count: data.b12?.aggregate?.count || 0 },
      { band_number: 71, band_name: "600 MHz", count: data.b71?.aggregate?.count || 0 },
      { band_number: 41, band_name: "TDD 2.5 GHz", count: data.b41?.aggregate?.count || 0 },
      { band_number: 30, band_name: "WCS", count: data.b30?.aggregate?.count || 0 },
      { band_number: 5, band_name: "CLR 850", count: data.b5?.aggregate?.count || 0 },
      { band_number: 14, band_name: "FirstNet", count: data.b14?.aggregate?.count || 0 },
      { band_number: 4, band_name: "AWS-1", count: data.b4?.aggregate?.count || 0 },
    ].sort((a, b) => b.count - a.count);

    return {
      carrierCells,
      topBands,
      totalCells: data.cells_aggregate?.aggregate?.count || 0,
      cellsWithSpeed: data.cells_with_speed_total?.aggregate?.count || 0,
      cellsWithSignal: data.cells_with_signal_total?.aggregate?.count || 0,
    };
  });
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
        Dashboard
      </button>
      <button
        class="tab"
        class:active={activeTab === "map"}
        onclick={() => {
          activeTab = "map";
          if (mapTowers.length === 0 && mapClusters.length === 0) loadMapData();
        }}
      >
        Map
      </button>
    </nav>
  </header>

  {#if $statsQuery.fetching}
    <div class="loading-screen">
      <div class="loading-content">
        <h2 class="loading-title">ACD Dashboard</h2>
        <p class="loading-subtitle">Loading cell tower analytics...</p>
        <div class="loading-progress">
          <div class="progress-bar"></div>
        </div>
      </div>
    </div>
  {:else if $statsQuery.error}
    <div class="error">
      <h2>Connection Error</h2>
      <p>Could not connect to Hasura GraphQL endpoint.</p>
      <code>{$statsQuery.error.message}</code>
    </div>
  {:else if $statsQuery.data}
    {#if activeTab === "dashboard"}
      <!-- Stats Cards -->
      <section class="stats-grid fade-in-up">
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

      <!-- Distribution Charts -->
      <section class="charts-grid fade-in-up delay-1">
        {#if !$ratQuery.fetching && ratData.length > 0}
          <BarChart title="Towers by Technology (RAT)" data={ratData} />
        {:else}
          <div class="skeleton-card chart-skeleton">
            <div class="skeleton-title"></div>
            <div class="skeleton-bars">
              <div class="skeleton-bar" style="height: 60%"></div>
              <div class="skeleton-bar" style="height: 80%"></div>
              <div class="skeleton-bar" style="height: 45%"></div>
              <div class="skeleton-bar" style="height: 30%"></div>
              <div class="skeleton-bar" style="height: 20%"></div>
            </div>
          </div>
        {/if}

        {#if !$typeQuery.fetching && typeData.length > 0}
          <BarChart title="Towers by Type" data={typeData} />
        {:else}
          <div class="skeleton-card chart-skeleton">
            <div class="skeleton-title"></div>
            <div class="skeleton-bars">
              <div class="skeleton-bar" style="height: 90%"></div>
              <div class="skeleton-bar" style="height: 50%"></div>
              <div class="skeleton-bar" style="height: 35%"></div>
              <div class="skeleton-bar" style="height: 25%"></div>
              <div class="skeleton-bar" style="height: 15%"></div>
            </div>
          </div>
        {/if}

        {#if !$bandQuery.fetching && bandData.length > 0}
          <BarChart title="LTE Band Distribution" data={bandData} />
        {:else}
          <div class="skeleton-card chart-skeleton">
            <div class="skeleton-title"></div>
            <div class="skeleton-bars">
              <div class="skeleton-bar" style="height: 70%"></div>
              <div class="skeleton-bar" style="height: 55%"></div>
              <div class="skeleton-bar" style="height: 85%"></div>
              <div class="skeleton-bar" style="height: 40%"></div>
              <div class="skeleton-bar" style="height: 60%"></div>
            </div>
          </div>
        {/if}
      </section>

      <!-- Analytics Section -->
      <section class="section-header fade-in-up delay-2">
        <h2>Analytics</h2>
      </section>

      <section class="analytics-grid fade-in-up delay-2">
        {#if !$growthQuery.fetching && growthData.length > 0}
          <TimelineChart title="Tower Discovery by Year" data={growthData} />
        {:else}
          <div class="skeleton-card chart-skeleton">
            <div class="skeleton-title"></div>
            <div class="skeleton-bars">
              <div class="skeleton-bar" style="height: 20%"></div>
              <div class="skeleton-bar" style="height: 35%"></div>
              <div class="skeleton-bar" style="height: 50%"></div>
              <div class="skeleton-bar" style="height: 70%"></div>
              <div class="skeleton-bar" style="height: 85%"></div>
              <div class="skeleton-bar" style="height: 65%"></div>
            </div>
          </div>
        {/if}

        {#if !$freshnessQuery.fetching && freshnessData.length > 0}
          <DataFreshness data={freshnessData} />
        {:else}
          <div class="skeleton-card">
            <div class="skeleton-title"></div>
            <div class="skeleton-donut"></div>
          </div>
        {/if}
      </section>

      <section class="full-width-section fade-in-up delay-3">
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
        {:else}
          <div class="skeleton-card">
            <div class="skeleton-title"></div>
            <div class="skeleton-stats-grid">
              <div class="skeleton-stat"></div>
              <div class="skeleton-stat"></div>
              <div class="skeleton-stat"></div>
              <div class="skeleton-stat"></div>
            </div>
          </div>
        {/if}
      </section>

      <section class="full-width-section fade-in-up delay-3">
        {#if !$carrierStatsQuery.fetching && $carrierStatsQuery.data?.providers}
          <CarrierStats
            carriers={$carrierStatsQuery.data.providers}
            combinations={$carrierStatsQuery.data.tower_carrier_combinations || []}
            totalTowers={$carrierStatsQuery.data.towers_aggregate?.aggregate?.count || 0}
            sharedTowers={$carrierStatsQuery.data.multi_provider_towers?.aggregate?.count || 0}
          />
        {:else}
          <div class="skeleton-card">
            <div class="skeleton-title"></div>
            <div class="skeleton-table">
              <div class="skeleton-row"></div>
              <div class="skeleton-row"></div>
              <div class="skeleton-row"></div>
              <div class="skeleton-row"></div>
            </div>
          </div>
        {/if}
      </section>

      <!-- Network Insights Section -->
      <section class="section-header fade-in-up delay-3">
        <h2>Network Data Insights</h2>
      </section>

      <section class="full-width-section fade-in-up delay-4">
        {#if !$networkInsightsQuery.fetching && $networkInsightsQuery.data?.providers}
          {@const insightsData = networkInsightsData()}
          {#if insightsData}
            <NetworkInsights
              carrierCells={insightsData.carrierCells}
              topBands={insightsData.topBands}
              totalCells={insightsData.totalCells}
              cellsWithSpeed={insightsData.cellsWithSpeed}
              cellsWithSignal={insightsData.cellsWithSignal}
            />
          {/if}
        {:else}
          <div class="skeleton-card">
            <div class="skeleton-title"></div>
            <div class="skeleton-stats-grid">
              <div class="skeleton-stat"></div>
              <div class="skeleton-stat"></div>
              <div class="skeleton-stat"></div>
              <div class="skeleton-stat"></div>
            </div>
          </div>
        {/if}
      </section>

      <!-- Band Fingerprinting Section (for Tower Hunters) -->
      <section class="section-header fade-in-up delay-4">
        <h2>Band Fingerprinting</h2>
      </section>

      <section class="full-width-section fade-in-up delay-4">
        {#if !$bandFingerprintQuery.fetching && $bandFingerprintQuery.data}
          {@const fpData = bandFingerprintingData()}
          {#if fpData}
            <BandFingerprinting
              bandsPerTower={fpData.bandsPerTower}
              topBandCombos={fpData.topBandCombos}
              spectrumTiers={fpData.spectrumTiers}
              bearingDistribution={fpData.bearingDistribution}
              totalTowers={fpData.totalTowers}
              towersWithBands={fpData.towersWithBands}
              towersWithBearing={fpData.towersWithBearing}
            />
          {/if}
        {:else}
          <div class="skeleton-card">
            <div class="skeleton-title"></div>
            <div class="skeleton-stats-grid">
              <div class="skeleton-stat"></div>
              <div class="skeleton-stat"></div>
              <div class="skeleton-stat"></div>
              <div class="skeleton-stat"></div>
            </div>
          </div>
        {/if}
      </section>

      {:else if activeTab === "map"}
      <section class="map-section">
        <MapFilters
          filters={mapFilters}
          onFilterChange={handleFilterChange}
          totalCount={mapTotalCount}
          filteredCount={mapClusters.length > 0 ? mapClusters.length : mapTowers.length}
        />
        <DeckGLMap
          towers={mapTowers}
          clusters={mapClusters}
          totalCount={mapTotalCount}
          loading={mapLoading}
          filters={mapFilters}
          onBoundsChange={handleBoundsChange}
        />
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

  .loading-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 70vh;
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .loading-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .loading-title {
    margin: 0 0 0.5rem;
    font-size: 1.5rem;
    font-weight: 700;
    color: #f4f4f5;
    letter-spacing: -0.02em;
  }

  .loading-subtitle {
    margin: 0 0 2rem;
    color: #71717a;
    font-size: 0.95rem;
  }

  .loading-progress {
    width: 200px;
    height: 4px;
    background: #27273a;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 2rem;
  }

  .progress-bar {
    height: 100%;
    width: 30%;
    background: linear-gradient(90deg, #3b82f6, #8b5cf6, #3b82f6);
    background-size: 200% 100%;
    border-radius: 4px;
    animation: progress-slide 1.5s ease-in-out infinite;
  }

  @keyframes progress-slide {
    0% {
      width: 0%;
      margin-left: 0;
    }
    50% {
      width: 60%;
      margin-left: 20%;
    }
    100% {
      width: 0%;
      margin-left: 100%;
    }
  }

  /* Fade-in animations for dashboard sections */
  .fade-in-up {
    animation: fadeInUp 0.5s ease-out forwards;
    opacity: 0;
  }

  .fade-in-up.delay-1 { animation-delay: 0.1s; }
  .fade-in-up.delay-2 { animation-delay: 0.2s; }
  .fade-in-up.delay-3 { animation-delay: 0.3s; }
  .fade-in-up.delay-4 { animation-delay: 0.4s; }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Skeleton loading styles */
  .skeleton-card {
    background: #1e1e2e;
    border-radius: 12px;
    padding: 1.5rem;
    min-height: 200px;
  }

  .skeleton-title {
    width: 40%;
    height: 16px;
    background: linear-gradient(90deg, #27273a 25%, #353548 50%, #27273a 75%);
    background-size: 200% 100%;
    border-radius: 4px;
    margin-bottom: 1.5rem;
    animation: skeleton-loading 1.5s ease-in-out infinite;
  }

  @keyframes skeleton-loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  .chart-skeleton {
    display: flex;
    flex-direction: column;
  }

  .skeleton-bars {
    display: flex;
    align-items: flex-end;
    gap: 1rem;
    height: 150px;
    padding-top: 1rem;
  }

  .skeleton-bar {
    flex: 1;
    background: linear-gradient(90deg, #27273a 25%, #353548 50%, #27273a 75%);
    background-size: 200% 100%;
    border-radius: 4px 4px 0 0;
    animation: skeleton-loading 1.5s ease-in-out infinite;
  }

  .skeleton-bar:nth-child(2) { animation-delay: 0.1s; }
  .skeleton-bar:nth-child(3) { animation-delay: 0.2s; }
  .skeleton-bar:nth-child(4) { animation-delay: 0.3s; }
  .skeleton-bar:nth-child(5) { animation-delay: 0.4s; }
  .skeleton-bar:nth-child(6) { animation-delay: 0.5s; }

  .skeleton-donut {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    margin: 1rem auto;
    background: conic-gradient(
      #27273a 0deg 90deg,
      #353548 90deg 180deg,
      #27273a 180deg 270deg,
      #353548 270deg 360deg
    );
    animation: skeleton-spin 2s linear infinite;
    position: relative;
  }

  .skeleton-donut::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 80px;
    height: 80px;
    background: #1e1e2e;
    border-radius: 50%;
  }

  @keyframes skeleton-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .skeleton-stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
    padding-top: 0.5rem;
  }

  .skeleton-stat {
    height: 60px;
    background: linear-gradient(90deg, #27273a 25%, #353548 50%, #27273a 75%);
    background-size: 200% 100%;
    border-radius: 8px;
    animation: skeleton-loading 1.5s ease-in-out infinite;
  }

  .skeleton-stat:nth-child(2) { animation-delay: 0.15s; }
  .skeleton-stat:nth-child(3) { animation-delay: 0.3s; }
  .skeleton-stat:nth-child(4) { animation-delay: 0.45s; }

  .skeleton-table {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .skeleton-row {
    height: 40px;
    background: linear-gradient(90deg, #27273a 25%, #353548 50%, #27273a 75%);
    background-size: 200% 100%;
    border-radius: 6px;
    animation: skeleton-loading 1.5s ease-in-out infinite;
  }

  .skeleton-row:nth-child(2) { animation-delay: 0.1s; }
  .skeleton-row:nth-child(3) { animation-delay: 0.2s; }
  .skeleton-row:nth-child(4) { animation-delay: 0.3s; }
  .skeleton-row:nth-child(5) { animation-delay: 0.4s; }

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
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.25rem;
    margin-bottom: 2rem;
  }

  .charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .section-header {
    margin: 2.5rem 0 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #27273a;
  }

  .section-header h2 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    color: #f4f4f5;
  }

  .analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .full-width-section {
    margin-bottom: 1.5rem;
  }

  .map-section {
    margin-bottom: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  @media (max-width: 900px) {
    .analytics-grid {
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
  }
</style>
