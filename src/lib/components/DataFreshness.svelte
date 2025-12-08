<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Chart, registerables } from "chart.js";

  Chart.register(...registerables);

  interface FreshnessData {
    label: string;
    count: number;
    color: string;
  }

  interface Props {
    data: FreshnessData[];
  }

  let { data }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  let total = $derived(data.reduce((sum, d) => sum + d.count, 0));
  let freshCount = $derived(data.slice(0, 3).reduce((sum, d) => sum + d.count, 0));
  let staleCount = $derived(data.slice(3).reduce((sum, d) => sum + d.count, 0));

  function createChart() {
    if (!canvas || data.length === 0) return;

    if (chart) {
      chart.destroy();
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    chart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            data: data.map((d) => d.count),
            backgroundColor: data.map((d) => d.color),
            borderColor: "#1e1e2e",
            borderWidth: 2,
            hoverBorderColor: "#f4f4f5",
            hoverBorderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "65%",
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: "#a1a1aa",
              padding: 10,
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
              label: function (context) {
                const value = context.parsed;
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
                return `${value.toLocaleString()} towers (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }

  onMount(() => {
    setTimeout(() => {
      createChart();
    }, 50);
  });

  onDestroy(() => {
    if (chart) chart.destroy();
  });

  $effect(() => {
    if (data && canvas) {
      createChart();
    }
  });
</script>

<div class="data-freshness">
  <h3>Data Freshness</h3>
  <p class="description">When towers were last observed</p>

  <div class="chart-container">
    <canvas bind:this={canvas}></canvas>
    <div class="center-stat">
      <span class="center-value">{total.toLocaleString()}</span>
      <span class="center-label">Total</span>
    </div>
  </div>

  <div class="freshness-summary">
    <div class="summary-item good">
      <span class="summary-label">Fresh (last 30 days)</span>
      <span class="summary-value">{freshCount.toLocaleString()}</span>
    </div>
    <div class="summary-item stale">
      <span class="summary-label">Stale (30+ days)</span>
      <span class="summary-value">{staleCount.toLocaleString()}</span>
    </div>
  </div>
</div>

<style>
  .data-freshness {
    background: #1e1e2e;
    border-radius: 12px;
    padding: 1.5rem;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
    color: #f4f4f5;
    font-weight: 600;
  }

  .description {
    margin: 0.25rem 0 1.25rem;
    font-size: 0.8rem;
    color: #71717a;
  }

  .chart-container {
    height: 200px;
    position: relative;
  }

  .center-stat {
    position: absolute;
    top: 50%;
    left: 35%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;
  }

  .center-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f4f4f5;
    font-variant-numeric: tabular-nums;
  }

  .center-label {
    font-size: 0.7rem;
    color: #71717a;
    text-transform: uppercase;
  }

  .freshness-summary {
    display: flex;
    gap: 1rem;
    margin-top: 1.25rem;
    padding-top: 1rem;
    border-top: 1px solid #27273a;
  }

  .summary-item {
    flex: 1;
    background: #27273a;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .summary-label {
    font-size: 0.8rem;
    color: #a1a1aa;
  }

  .summary-value {
    font-size: 1rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .good .summary-value {
    color: #22c55e;
  }

  .stale .summary-value {
    color: #f59e0b;
  }
</style>
