<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Chart, registerables } from "chart.js";
  import { getCarrierName, getCarrierColor } from "../carriers";
  import {
    chartColors,
    chartFonts,
    tooltipConfig,
  } from "../chartConfig";

  Chart.register(...registerables);

  interface CarrierBandData {
    country_id: number;
    provider_id: number;
    b2: number;
    b4: number;
    b5: number;
    b12: number;
    b13: number;
    b14: number;
    b30: number;
    b41: number;
    b66: number;
    b71: number;
  }

  interface Props {
    carriers: CarrierBandData[];
  }

  let { carriers }: Props = $props();

  let chartCanvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  const bands = [
    { key: "b66", name: "B66", fullName: "AWS-3", tier: "mid" },
    { key: "b2", name: "B2", fullName: "PCS", tier: "mid" },
    { key: "b4", name: "B4", fullName: "AWS-1", tier: "mid" },
    { key: "b13", name: "B13", fullName: "700 MHz C", tier: "low" },
    { key: "b12", name: "B12", fullName: "700 MHz A/B", tier: "low" },
    { key: "b71", name: "B71", fullName: "600 MHz", tier: "low" },
    { key: "b41", name: "B41", fullName: "TDD 2.5G", tier: "high" },
    { key: "b5", name: "B5", fullName: "CLR 850", tier: "low" },
    { key: "b14", name: "B14", fullName: "FirstNet", tier: "low" },
    { key: "b30", name: "B30", fullName: "WCS", tier: "mid" },
  ] as const;

  let sortedCarriers = $derived(
    [...carriers]
      .map((c) => ({
        ...c,
        name: getCarrierName(c.country_id, c.provider_id),
        color: getCarrierColor(c.country_id, c.provider_id),
        total: (c.b2 || 0) + (c.b4 || 0) + (c.b5 || 0) + (c.b12 || 0) +
               (c.b13 || 0) + (c.b14 || 0) + (c.b30 || 0) + (c.b41 || 0) +
               (c.b66 || 0) + (c.b71 || 0),
      }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 4)
  );

  // Get band data sorted by total count
  let sortedBands = $derived(
    [...bands]
      .map(b => ({
        ...b,
        total: sortedCarriers.reduce((sum, c) => sum + ((c as any)[b.key] || 0), 0),
      }))
      .filter(b => b.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
  );

  function createChart() {
    if (!chartCanvas || sortedCarriers.length === 0 || sortedBands.length === 0) return;

    if (chart) {
      chart.destroy();
    }

    const ctx = chartCanvas.getContext("2d");
    if (!ctx) return;

    // Create datasets for each carrier (grouped bars)
    const datasets = sortedCarriers.map((carrier) => ({
      label: carrier.name,
      data: sortedBands.map(b => (carrier as any)[b.key] || 0),
      backgroundColor: carrier.color,
      borderColor: carrier.color,
      borderWidth: 0,
      borderRadius: 3,
      barPercentage: 0.85,
      categoryPercentage: 0.8,
    }));

    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: sortedBands.map(b => b.name),
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: chartColors.text.secondary,
              padding: 16,
              usePointStyle: true,
              pointStyle: "rectRounded",
              font: {
                size: chartFonts.size.sm,
              },
            },
          },
          tooltip: {
            ...tooltipConfig,
            callbacks: {
              title: function(context) {
                const bandIndex = context[0].dataIndex;
                const band = sortedBands[bandIndex];
                return `${band.name} - ${band.fullName}`;
              },
              label: function(context) {
                return `${context.dataset.label}: ${(context.parsed.y ?? 0).toLocaleString()} cells`;
              }
            }
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: chartColors.text.secondary,
              font: { size: chartFonts.size.sm, weight: "bold" as const },
            },
          },
          y: {
            grid: {
              color: chartColors.grid,
              lineWidth: 1,
            },
            ticks: {
              color: chartColors.text.muted,
              font: { size: chartFonts.size.xs },
              callback: function(value) {
                return (Number(value) / 1000).toFixed(0) + 'k';
              }
            },
          },
        },
      },
    });
  }

  onMount(() => {
    setTimeout(createChart, 50);
  });

  onDestroy(() => {
    if (chart) chart.destroy();
  });

  $effect(() => {
    if (sortedCarriers && sortedBands && chartCanvas) {
      createChart();
    }
  });

  // Calculate totals for stats
  let totalBandRecords = $derived(
    sortedCarriers.reduce((sum, c) => sum + c.total, 0)
  );

  let topBand = $derived(sortedBands[0]);
</script>

<div class="carrier-bands">
  <div class="section-header">
    <div class="header-title">
      <h3>Band Deployment by Carrier</h3>
      <p class="section-subtitle">Spectrum allocation comparison across carriers</p>
    </div>
    <div class="header-stats">
      <div class="header-stat">
        <span class="stat-value">{sortedBands.length}</span>
        <span class="stat-label">Active Bands</span>
      </div>
      <div class="header-stat">
        <span class="stat-value">{totalBandRecords.toLocaleString()}</span>
        <span class="stat-label">Total Records</span>
      </div>
      {#if topBand}
        <div class="header-stat">
          <span class="stat-value">{topBand.name}</span>
          <span class="stat-label">Most Deployed</span>
        </div>
      {/if}
    </div>
  </div>

  <div class="chart-container">
    <canvas bind:this={chartCanvas}></canvas>
  </div>

  <div class="band-legend">
    <span class="legend-item"><span class="legend-dot low"></span>Low Band (&lt;1GHz)</span>
    <span class="legend-item"><span class="legend-dot mid"></span>Mid Band (1-6GHz)</span>
    <span class="legend-item"><span class="legend-dot high"></span>High Band (&gt;6GHz)</span>
  </div>
</div>

<style>
  .carrier-bands {
    background: #1e1e2e;
    border-radius: 12px;
    padding: 1.5rem;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .header-title {
    flex: 1;
    min-width: 200px;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
    color: #f4f4f5;
    font-weight: 600;
  }

  .section-subtitle {
    margin: 0.25rem 0 0;
    font-size: 0.8rem;
    color: #71717a;
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
    font-size: 0.65rem;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .chart-container {
    height: 280px;
    margin-bottom: 1rem;
  }

  .band-legend {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #27273a;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    color: #71717a;
  }

  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 3px;
  }

  .legend-dot.low {
    background: #22c55e;
  }

  .legend-dot.mid {
    background: #3b82f6;
  }

  .legend-dot.high {
    background: #8b5cf6;
  }

  @media (max-width: 800px) {
    .section-header {
      flex-direction: column;
    }

    .header-stats {
      width: 100%;
      justify-content: space-between;
    }

    .chart-container {
      height: 240px;
    }
  }
</style>
