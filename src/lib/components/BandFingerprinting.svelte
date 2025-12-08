<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Chart, registerables } from "chart.js";
  import { getCarrierName, getCarrierColor } from "../carriers";

  Chart.register(...registerables);

  interface CarrierBandCount {
    country_id: number;
    provider_id: number;
    count: number;
  }

  interface BandPerTowerData {
    bands_count: number;
    tower_count: number;
    by_carrier: CarrierBandCount[];
  }

  interface BandComboData {
    band_combo: number[];
    carrier_id: number | null;
    country_id: number | null;
    provider_id: number | null;
    tower_count: number;
  }

  interface SpectrumTierData {
    tier: "low" | "mid" | "high";
    count: number;
  }

  interface BearingData {
    bearing_range: string;
    count: number;
  }

  interface CarrierBearingData {
    country_id: number;
    provider_id: number;
    total: number;
    bearings: number[]; // [N, NE, E, SE, S, SW, W, NW]
  }

  interface Props {
    bandsPerTower: BandPerTowerData[];
    topBandCombos: BandComboData[];
    spectrumTiers: SpectrumTierData[];
    bearingDistribution: BearingData[];
    carrierBearings: CarrierBearingData[];
    totalTowers: number;
    towersWithBands: number;
    towersWithBearing: number;
  }

  let {
    bandsPerTower,
    topBandCombos,
    spectrumTiers,
    bearingDistribution,
    carrierBearings,
    totalTowers,
    towersWithBands,
    towersWithBearing,
  }: Props = $props();

  // Chart references
  let radarCanvas: HTMLCanvasElement;
  let radarChart: Chart | null = null;
  let bandsBarCanvas: HTMLCanvasElement;
  let bandsBarChart: Chart | null = null;

  // Band count distribution
  let maxBandCount = $derived(Math.max(...bandsPerTower.map((b) => b.tower_count), 1));

  // Band combo max for normalization
  let maxComboCount = $derived(Math.max(...topBandCombos.map((c) => c.tower_count), 1));

  // Spectrum tier colors
  const tierColors: Record<string, string> = {
    low: "#22c55e",
    mid: "#3b82f6",
    high: "#8b5cf6",
  };

  const tierLabels: Record<string, string> = {
    low: "Low Band (<1 GHz)",
    mid: "Mid Band (1-6 GHz)",
    high: "High Band (>6 GHz)",
  };

  // Format band combo display
  function formatBandCombo(bands: number[]): string {
    return bands.map((b) => `B${b}`).join("+");
  }

  // Get color for band combo based on carrier
  function getComboColor(combo: BandComboData): string {
    if (combo.country_id && combo.provider_id) {
      return getCarrierColor(combo.country_id, combo.provider_id);
    }
    return "#71717a";
  }

  function getComboCarrier(combo: BandComboData): string {
    if (combo.country_id && combo.provider_id) {
      return getCarrierName(combo.country_id, combo.provider_id);
    }
    return "Mixed";
  }

  // Calculate spectrum tier percentages
  let tierTotal = $derived(spectrumTiers.reduce((sum, t) => sum + t.count, 0));
  let tierPercentages = $derived(
    spectrumTiers.map((t) => ({
      ...t,
      pct: tierTotal > 0 ? (t.count / tierTotal) * 100 : 0,
    }))
  );

  // Bearing compass directions
  const compassLabels = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

  // Calculate carrier slices for stacked bars with labels
  function getCarrierSlices(item: BandPerTowerData): { color: string; width: number; name: string; count: number }[] {
    if (!item.by_carrier || item.by_carrier.length === 0) {
      return [{ color: "#3b82f6", width: 100, name: "All", count: item.tower_count }];
    }

    const total = item.by_carrier.reduce((sum, c) => sum + c.count, 0);
    return item.by_carrier.map((c) => ({
      color: getCarrierColor(c.country_id, c.provider_id),
      width: total > 0 ? (c.count / total) * 100 : 0,
      name: getCarrierName(c.country_id, c.provider_id),
      count: c.count,
    })).filter(s => s.width > 0).sort((a, b) => b.count - a.count);
  }

  // Hovered bar for showing carrier breakdown
  let hoveredBar = $state<number | null>(null);

  // Create radar chart for carrier bearings
  function createRadarChart() {
    if (!radarCanvas || !carrierBearings || carrierBearings.length === 0) return;

    // Destroy existing chart
    if (radarChart) {
      radarChart.destroy();
    }

    const ctx = radarCanvas.getContext("2d");
    if (!ctx) return;

    // Create datasets for each carrier (top 4)
    const datasets = carrierBearings.slice(0, 4).map((carrier) => {
      const color = getCarrierColor(carrier.country_id, carrier.provider_id);
      const name = getCarrierName(carrier.country_id, carrier.provider_id);
      // Normalize to percentages
      const total = carrier.bearings.reduce((sum, b) => sum + b, 0);
      const data = carrier.bearings.map(b => total > 0 ? (b / total) * 100 : 0);

      return {
        label: name,
        data,
        backgroundColor: color + "33",
        borderColor: color,
        borderWidth: 2,
        pointBackgroundColor: color,
        pointBorderColor: "#1e1e2e",
        pointBorderWidth: 1,
        pointRadius: 4,
        pointHoverRadius: 6,
      };
    });

    radarChart = new Chart(ctx, {
      type: "radar",
      data: {
        labels: compassLabels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#a1a1aa",
              padding: 12,
              usePointStyle: true,
              pointStyle: "circle",
              font: {
                size: 11,
              },
            },
          },
          tooltip: {
            backgroundColor: "#27273a",
            titleColor: "#f4f4f5",
            bodyColor: "#a1a1aa",
            borderColor: "#3b3b50",
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                const carrier = carrierBearings[context.datasetIndex];
                const direction = compassLabels[context.dataIndex];
                const count = carrier.bearings[context.dataIndex];
                const pct = context.parsed.r.toFixed(1);
                return `${context.dataset.label}: ${count.toLocaleString()} cells (${pct}%)`;
              }
            }
          },
        },
        scales: {
          r: {
            angleLines: {
              color: "#3b3b50",
            },
            grid: {
              color: "#27273a",
            },
            pointLabels: {
              color: "#e4e4e7",
              font: {
                size: 12,
                weight: "bold",
              },
              callback: function(label, index) {
                return label === "N" ? "N" : label;
              },
            },
            ticks: {
              display: false,
              stepSize: 5,
            },
            suggestedMin: 0,
            suggestedMax: 20,
          },
        },
      },
    });
  }

  // Create horizontal bar chart for bands per tower
  function createBandsBarChart() {
    if (!bandsBarCanvas || !bandsPerTower || bandsPerTower.length === 0) return;

    if (bandsBarChart) {
      bandsBarChart.destroy();
    }

    const ctx = bandsBarCanvas.getContext("2d");
    if (!ctx) return;

    // Get unique carriers across all band counts
    const allCarriers = new Map<string, { country_id: number; provider_id: number; color: string; name: string }>();
    bandsPerTower.forEach(item => {
      item.by_carrier?.forEach(c => {
        const key = `${c.country_id}-${c.provider_id}`;
        if (!allCarriers.has(key)) {
          allCarriers.set(key, {
            country_id: c.country_id,
            provider_id: c.provider_id,
            color: getCarrierColor(c.country_id, c.provider_id),
            name: getCarrierName(c.country_id, c.provider_id),
          });
        }
      });
    });

    // Sort carriers by total count across all bands
    const carrierTotals = new Map<string, number>();
    bandsPerTower.forEach(item => {
      item.by_carrier?.forEach(c => {
        const key = `${c.country_id}-${c.provider_id}`;
        carrierTotals.set(key, (carrierTotals.get(key) || 0) + c.count);
      });
    });

    const sortedCarriers = Array.from(allCarriers.entries())
      .sort((a, b) => (carrierTotals.get(b[0]) || 0) - (carrierTotals.get(a[0]) || 0))
      .slice(0, 4);

    // Create datasets for each carrier
    const datasets = sortedCarriers.map(([key, carrier]) => {
      const data = bandsPerTower.slice(0, 8).map(item => {
        const found = item.by_carrier?.find(c => `${c.country_id}-${c.provider_id}` === key);
        return found?.count || 0;
      });

      return {
        label: carrier.name,
        data,
        backgroundColor: carrier.color,
        borderColor: carrier.color,
        borderWidth: 0,
        borderRadius: 2,
      };
    });

    bandsBarChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: bandsPerTower.slice(0, 8).map(b => `${b.bands_count} bands`),
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#a1a1aa",
              padding: 12,
              usePointStyle: true,
              pointStyle: "rect",
              font: {
                size: 11,
              },
            },
          },
          tooltip: {
            backgroundColor: "#27273a",
            titleColor: "#f4f4f5",
            bodyColor: "#a1a1aa",
            borderColor: "#3b3b50",
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                return `${context.dataset.label}: ${context.parsed.x.toLocaleString()} towers`;
              }
            }
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: {
              color: "#27273a",
            },
            ticks: {
              color: "#71717a",
              font: {
                size: 10,
              },
              callback: function(value) {
                return Number(value).toLocaleString();
              }
            },
          },
          y: {
            stacked: true,
            grid: {
              display: false,
            },
            ticks: {
              color: "#e4e4e7",
              font: {
                size: 11,
              },
            },
          },
        },
      },
    });
  }

  onMount(() => {
    // Delay chart creation to ensure canvas is ready
    setTimeout(() => {
      createRadarChart();
      createBandsBarChart();
    }, 100);
  });

  onDestroy(() => {
    if (radarChart) radarChart.destroy();
    if (bandsBarChart) bandsBarChart.destroy();
  });

  // Recreate charts when data changes
  $effect(() => {
    if (carrierBearings && radarCanvas) {
      createRadarChart();
    }
  });

  $effect(() => {
    if (bandsPerTower && bandsBarCanvas) {
      createBandsBarChart();
    }
  });
</script>

<div class="band-fingerprinting">
  <div class="section-header">
    <h3>Band Fingerprinting</h3>
    <div class="header-stats">
      <div class="header-stat">
        <span class="stat-value">{towersWithBands.toLocaleString()}</span>
        <span class="stat-label">With Band Data</span>
      </div>
      <div class="header-stat">
        <span class="stat-value">{towersWithBearing.toLocaleString()}</span>
        <span class="stat-label">Cells With Bearing</span>
      </div>
      <div class="header-stat">
        <span class="stat-value">{((towersWithBands / totalTowers) * 100).toFixed(1)}%</span>
        <span class="stat-label">Coverage</span>
      </div>
    </div>
  </div>

  <div class="fingerprint-grid">
    <!-- Bands Per Tower Distribution with Chart.js -->
    <div class="fingerprint-section chart-section">
      <h4>Bands Per Tower Distribution</h4>
      <p class="section-desc">Tower count by band count, stacked by carrier</p>
      <div class="chart-container bands-chart">
        <canvas bind:this={bandsBarCanvas}></canvas>
      </div>
    </div>

    <!-- Spectrum Tier Distribution -->
    <div class="fingerprint-section">
      <h4>Spectrum Tier Distribution</h4>
      <p class="section-desc">Band records by frequency tier</p>
      <div class="tier-chart">
        <div class="tier-bar-stacked">
          {#each tierPercentages as tier}
            {#if tier.pct > 0}
              <div
                class="tier-segment"
                style="width: {tier.pct}%; background: {tierColors[tier.tier]}"
                title="{tierLabels[tier.tier]}: {tier.count.toLocaleString()}"
              ></div>
            {/if}
          {/each}
        </div>
        <div class="tier-legend">
          {#each tierPercentages as tier}
            <div class="tier-item">
              <span class="tier-dot" style="background: {tierColors[tier.tier]}"></span>
              <span class="tier-label">{tierLabels[tier.tier]}</span>
              <span class="tier-value">{tier.count.toLocaleString()}</span>
              <span class="tier-pct">({tier.pct.toFixed(1)}%)</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- Band Combinations and Bearing side by side -->
  <div class="fingerprint-row">
    <!-- Band Combinations (Carrier Signatures) -->
    <div class="fingerprint-section flex-grow">
      <h4>Band Combinations (Carrier Signatures)</h4>
      <p class="section-desc">Most common band combinations per carrier - use to identify towers</p>
      <div class="combo-chart">
        {#each topBandCombos.slice(0, 8) as combo}
          {@const barWidth = (combo.tower_count / maxComboCount) * 100}
          <div class="combo-row">
            <div class="combo-info">
              <span class="combo-bands">{formatBandCombo(combo.band_combo)}</span>
              <span class="combo-carrier" style="color: {getComboColor(combo)}"
                >{getComboCarrier(combo)}</span
              >
            </div>
            <div class="combo-bar-container">
              <div
                class="combo-bar"
                style="width: {barWidth}%; background: {getComboColor(combo)}"
              ></div>
            </div>
            <span class="combo-count">{combo.tower_count.toLocaleString()}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Bearing/Azimuth Distribution - Chart.js Radar -->
    <div class="fingerprint-section bearing-section">
      <h4>Sector Bearings by Carrier</h4>
      <p class="section-desc">Cell azimuth distribution (%) for each carrier</p>
      <div class="chart-container radar-chart">
        <canvas bind:this={radarCanvas}></canvas>
      </div>
      <div class="bearing-stats">
        <div class="bearing-stat-row">
          <span class="bearing-stat-label">Total Cells with Bearing:</span>
          <span class="bearing-stat-value">{towersWithBearing.toLocaleString()}</span>
        </div>
        {#each carrierBearings.slice(0, 4) as carrier}
          <div class="bearing-stat-row">
            <span class="carrier-indicator" style="background: {getCarrierColor(carrier.country_id, carrier.provider_id)}"></span>
            <span class="bearing-stat-label">{getCarrierName(carrier.country_id, carrier.provider_id)}:</span>
            <span class="bearing-stat-value">{carrier.total.toLocaleString()}</span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .band-fingerprinting {
    background: #1e1e2e;
    border-radius: 12px;
    padding: 1.5rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
    color: #f4f4f5;
    font-weight: 600;
  }

  h4 {
    margin: 0 0 0.5rem;
    font-size: 0.85rem;
    color: #e4e4e7;
    font-weight: 600;
  }

  .header-stats {
    display: flex;
    gap: 2rem;
  }

  .header-stat {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .stat-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f4f4f5;
    font-variant-numeric: tabular-nums;
  }

  .stat-label {
    font-size: 0.7rem;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .fingerprint-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .fingerprint-row {
    display: flex;
    gap: 1.5rem;
  }

  .fingerprint-section {
    background: #27273a;
    border-radius: 8px;
    padding: 1rem;
  }

  .fingerprint-section.chart-section {
    min-height: 280px;
  }

  .fingerprint-section.flex-grow {
    flex: 1;
    min-width: 0;
  }

  .fingerprint-section.bearing-section {
    width: 380px;
    flex-shrink: 0;
  }

  .section-desc {
    margin: 0 0 1rem;
    font-size: 0.75rem;
    color: #71717a;
  }

  /* Chart containers */
  .chart-container {
    position: relative;
  }

  .chart-container.bands-chart {
    height: 220px;
  }

  .chart-container.radar-chart {
    height: 240px;
    margin-bottom: 0.75rem;
  }

  /* Spectrum tiers */
  .tier-chart {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .tier-bar-stacked {
    display: flex;
    height: 32px;
    border-radius: 6px;
    overflow: hidden;
  }

  .tier-segment {
    transition: width 0.5s ease-out;
  }

  .tier-legend {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .tier-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tier-dot {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .tier-label {
    font-size: 0.8rem;
    color: #a1a1aa;
    flex: 1;
  }

  .tier-value {
    font-size: 0.85rem;
    font-weight: 600;
    color: #e4e4e7;
    font-variant-numeric: tabular-nums;
  }

  .tier-pct {
    font-size: 0.75rem;
    color: #71717a;
    min-width: 50px;
    text-align: right;
  }

  /* Band combinations */
  .combo-chart {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .combo-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .combo-info {
    display: flex;
    flex-direction: column;
    width: 120px;
    flex-shrink: 0;
  }

  .combo-bands {
    font-size: 0.85rem;
    font-weight: 600;
    color: #f4f4f5;
    font-family: monospace;
  }

  .combo-carrier {
    font-size: 0.7rem;
  }

  .combo-bar-container {
    flex: 1;
    height: 24px;
    background: #1e1e2e;
    border-radius: 4px;
    overflow: hidden;
  }

  .combo-bar {
    height: 100%;
    border-radius: 4px;
    min-width: 4px;
    transition: width 0.5s ease-out;
  }

  .combo-count {
    min-width: 60px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #f4f4f5;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* Bearing stats below radar chart */
  .bearing-stats {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    padding-top: 0.5rem;
    border-top: 1px solid #1e1e2e;
  }

  .bearing-stat-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
  }

  .carrier-indicator {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .bearing-stat-label {
    color: #a1a1aa;
    flex: 1;
  }

  .bearing-stat-value {
    color: #e4e4e7;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 900px) {
    .fingerprint-row {
      flex-direction: column;
    }

    .fingerprint-section.bearing-section {
      width: 100%;
    }

    .section-header {
      flex-direction: column;
    }

    .header-stats {
      width: 100%;
      justify-content: space-between;
    }

    .fingerprint-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
