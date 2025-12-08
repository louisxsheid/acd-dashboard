<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Chart, registerables } from "chart.js";

  Chart.register(...registerables);

  interface BarData {
    name: string;
    count: number;
    color: string;
  }

  interface Props {
    title: string;
    data: BarData[];
  }

  let { title, data }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  let total = $derived(data.reduce((sum, d) => sum + d.count, 0));
  let filteredData = $derived(data.filter((d) => d.count > 0));

  function createChart() {
    if (!canvas || filteredData.length === 0) return;

    if (chart) {
      chart.destroy();
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: filteredData.map((d) => d.name),
        datasets: [
          {
            data: filteredData.map((d) => d.count),
            backgroundColor: filteredData.map((d) => d.color),
            borderColor: filteredData.map((d) => d.color),
            borderWidth: 0,
            borderRadius: 4,
            barThickness: 24,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "#27273a",
            titleColor: "#f4f4f5",
            bodyColor: "#a1a1aa",
            borderColor: "#3b3b50",
            borderWidth: 1,
            callbacks: {
              label: function (context) {
                const value = context.parsed.x;
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
                return `${value.toLocaleString()} (${pct}%)`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: "#27273a",
            },
            ticks: {
              color: "#71717a",
              font: {
                size: 10,
              },
              callback: function (value) {
                return Number(value).toLocaleString();
              },
            },
          },
          y: {
            grid: {
              display: false,
            },
            ticks: {
              color: "#a1a1aa",
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
    setTimeout(() => {
      createChart();
    }, 50);
  });

  onDestroy(() => {
    if (chart) chart.destroy();
  });

  $effect(() => {
    if (filteredData && canvas) {
      createChart();
    }
  });
</script>

<div class="bar-chart">
  <h3>{title}</h3>
  {#if filteredData.length === 0}
    <p class="no-data">No data available</p>
  {:else}
    <div class="chart-container">
      <canvas bind:this={canvas}></canvas>
    </div>
    <div class="total">
      Total: {total.toLocaleString()}
    </div>
  {/if}
</div>

<style>
  .bar-chart {
    background: #1e1e2e;
    border-radius: 12px;
    padding: 1.5rem;
  }

  h3 {
    margin: 0 0 1.25rem;
    font-size: 1rem;
    color: #f4f4f5;
    font-weight: 600;
  }

  .no-data {
    color: #71717a;
    font-size: 0.875rem;
  }

  .chart-container {
    height: 200px;
    position: relative;
  }

  .total {
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid #27273a;
    font-size: 0.875rem;
    color: #a1a1aa;
    text-align: right;
  }
</style>
