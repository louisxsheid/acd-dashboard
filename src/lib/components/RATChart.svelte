<script lang="ts">
  interface RATData {
    name: string;
    count: number;
    color: string;
  }

  interface Props {
    data: RATData[];
  }

  let { data }: Props = $props();

  let total = $derived(data.reduce((sum, d) => sum + d.count, 0));
  let maxCount = $derived(Math.max(...data.map((d) => d.count)));
</script>

<div class="rat-chart">
  <h3>Towers by Technology</h3>
  <div class="bars">
    {#each data.filter((d) => d.count > 0) as item}
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
</div>

<style>
  .rat-chart {
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

  .bars {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .bar-row {
    display: grid;
    grid-template-columns: 60px 1fr 80px 50px;
    align-items: center;
    gap: 0.75rem;
  }

  .bar-label {
    font-size: 0.875rem;
    color: #a1a1aa;
    font-weight: 500;
  }

  .bar-container {
    height: 24px;
    background: #27273a;
    border-radius: 4px;
    overflow: hidden;
  }

  .bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease-out;
  }

  .bar-value {
    font-size: 0.875rem;
    color: #f4f4f5;
    font-weight: 600;
    text-align: right;
  }

  .bar-percent {
    font-size: 0.75rem;
    color: #71717a;
    text-align: right;
  }
</style>
