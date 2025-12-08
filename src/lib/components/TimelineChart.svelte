<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Chart, registerables } from "chart.js";

  Chart.register(...registerables);

  interface TimelineData {
    label: string;
    count: number;
    color: string;
  }

  interface Props {
    title: string;
    data: TimelineData[];
  }

  let { title, data }: Props = $props();

  let canvas: HTMLCanvasElement;
  let chart: Chart | null = null;

  let total = $derived(data.reduce((sum, d) => sum + d.count, 0));

  function createChart() {
    if (!canvas || data.length === 0) return;

    if (chart) {
      chart.destroy();
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    chart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map((d) => d.label),
        datasets: [
          {
            data: data.map((d) => d.count),
            backgroundColor: data.map((d) => d.color),
            borderColor: data.map((d) => d.color),
            borderWidth: 0,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
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
                const value = context.parsed.y;
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : "0";
                return `${value.toLocaleString()} towers (${pct}%)`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: "#71717a",
              font: {
                size: 11,
              },
            },
          },
          y: {
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

<div class="timeline-chart">
  <h3>{title}</h3>
  <div class="chart-container">
    <canvas bind:this={canvas}></canvas>
  </div>
  <div class="total">
    Total: {total.toLocaleString()}
  </div>
</div>

<style>
  .timeline-chart {
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
