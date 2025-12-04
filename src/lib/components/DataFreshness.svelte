<script lang="ts">
  interface FreshnessData {
    label: string;
    count: number;
    color: string;
  }

  interface Props {
    data: FreshnessData[];
  }

  let { data }: Props = $props();

  let total = $derived(data.reduce((sum, d) => sum + d.count, 0));
</script>

<div class="data-freshness">
  <h3>Data Freshness</h3>
  <p class="description">When towers were last observed</p>

  <div class="freshness-bars">
    {#each data as item}
      {@const percentage = total > 0 ? (item.count / total) * 100 : 0}
      <div class="freshness-row">
        <div class="freshness-label">{item.label}</div>
        <div class="freshness-bar-container">
          <div
            class="freshness-bar"
            style="width: {percentage}%; background: {item.color}"
          ></div>
        </div>
        <div class="freshness-stats">
          <span class="freshness-count">{item.count.toLocaleString()}</span>
          <span class="freshness-percent">{percentage.toFixed(1)}%</span>
        </div>
      </div>
    {/each}
  </div>

  <div class="freshness-summary">
    <div class="summary-item good">
      <span class="summary-label">Fresh (last 30 days)</span>
      <span class="summary-value">
        {data
          .slice(0, 3)
          .reduce((sum, d) => sum + d.count, 0)
          .toLocaleString()}
      </span>
    </div>
    <div class="summary-item stale">
      <span class="summary-label">Stale (30+ days)</span>
      <span class="summary-value">
        {data
          .slice(3)
          .reduce((sum, d) => sum + d.count, 0)
          .toLocaleString()}
      </span>
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

  .freshness-bars {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .freshness-row {
    display: grid;
    grid-template-columns: 100px 1fr 120px;
    align-items: center;
    gap: 0.75rem;
  }

  .freshness-label {
    font-size: 0.8rem;
    color: #a1a1aa;
  }

  .freshness-bar-container {
    height: 16px;
    background: #27273a;
    border-radius: 4px;
    overflow: hidden;
  }

  .freshness-bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease-out;
    min-width: 2px;
  }

  .freshness-stats {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
  }

  .freshness-count {
    font-size: 0.8rem;
    font-weight: 600;
    color: #f4f4f5;
    font-variant-numeric: tabular-nums;
  }

  .freshness-percent {
    font-size: 0.75rem;
    color: #71717a;
    font-variant-numeric: tabular-nums;
    width: 45px;
    text-align: right;
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
