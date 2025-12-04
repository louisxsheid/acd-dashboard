<script lang="ts">
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

  let total = $derived(data.reduce((sum, d) => sum + d.count, 0));
  let maxCount = $derived(Math.max(...data.map((d) => d.count), 1));
  let filteredData = $derived(data.filter((d) => d.count > 0));
</script>

<div class="bar-chart">
  <h3>{title}</h3>
  {#if filteredData.length === 0}
    <p class="no-data">No data available</p>
  {:else}
    <div class="bars">
      {#each filteredData as item}
        <div class="bar-row">
          <span class="bar-label">{item.name}</span>
          <div class="bar-container">
            <div
              class="bar"
              style="width: {(item.count / maxCount) * 100}%; background: {item.color}"
            ></div>
          </div>
          <span class="bar-value">{item.count.toLocaleString()}</span>
          <span class="bar-percent">{((item.count / total) * 100).toFixed(1)}%</span>
        </div>
      {/each}
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

  .bars {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .bar-row {
    display: grid;
    grid-template-columns: 100px 1fr 80px 50px;
    align-items: center;
    gap: 0.75rem;
  }

  .bar-label {
    font-size: 0.8rem;
    color: #a1a1aa;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bar-container {
    height: 20px;
    background: #27273a;
    border-radius: 4px;
    overflow: hidden;
  }

  .bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease-out;
    min-width: 2px;
  }

  .bar-value {
    font-size: 0.8rem;
    color: #f4f4f5;
    font-weight: 600;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .bar-percent {
    font-size: 0.75rem;
    color: #71717a;
    text-align: right;
    font-variant-numeric: tabular-nums;
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
