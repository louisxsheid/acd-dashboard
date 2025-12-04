<script lang="ts">
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

  let total = $derived(data.reduce((sum, d) => sum + d.count, 0));
  let maxCount = $derived(Math.max(...data.map((d) => d.count), 1));
</script>

<div class="timeline-chart">
  <h3>{title}</h3>
  <div class="chart-area">
    <div class="bars">
      {#each data as item, i}
        <div class="bar-column">
          <div class="bar-value">{item.count > 0 ? item.count.toLocaleString() : ""}</div>
          <div class="bar-track">
            <div
              class="bar"
              style="height: {(item.count / maxCount) * 100}%; background: {item.color}"
            ></div>
          </div>
          <div class="bar-label">{item.label}</div>
        </div>
      {/each}
    </div>
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

  .chart-area {
    height: 200px;
    display: flex;
    align-items: flex-end;
  }

  .bars {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    width: 100%;
    height: 100%;
  }

  .bar-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }

  .bar-value {
    font-size: 0.7rem;
    color: #a1a1aa;
    margin-bottom: 0.25rem;
    font-variant-numeric: tabular-nums;
    min-height: 1rem;
  }

  .bar-track {
    flex: 1;
    width: 100%;
    max-width: 40px;
    background: #27273a;
    border-radius: 4px 4px 0 0;
    display: flex;
    align-items: flex-end;
    overflow: hidden;
  }

  .bar {
    width: 100%;
    border-radius: 4px 4px 0 0;
    transition: height 0.5s ease-out;
    min-height: 2px;
  }

  .bar-label {
    font-size: 0.7rem;
    color: #71717a;
    margin-top: 0.5rem;
    text-align: center;
    white-space: nowrap;
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
