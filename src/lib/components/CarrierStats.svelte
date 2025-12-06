<script lang="ts">
  import { getCarrierName, getCarrierColor } from "../carriers";

  interface CarrierData {
    id: number;
    country_id: number;
    provider_id: number;
    name: string | null;
    tower_providers_aggregate: {
      aggregate: {
        count: number;
      };
    };
    endc_tower_providers: {
      aggregate: {
        count: number;
      };
    };
    lte_tower_providers: {
      aggregate: {
        count: number;
      };
    };
    nr_tower_providers: {
      aggregate: {
        count: number;
      };
    };
  }

  interface CombinationData {
    combination: string;
    tower_count: number;
  }

  interface Props {
    carriers: CarrierData[];
    combinations: CombinationData[];
    totalTowers: number;
    sharedTowers: number;
  }

  let { carriers, combinations, totalTowers, sharedTowers }: Props = $props();

  let sortedCarriers = $derived(
    [...carriers]
      .map((c) => ({
        ...c,
        name: getCarrierName(c.country_id, c.provider_id),
        color: getCarrierColor(c.country_id, c.provider_id),
        total: c.tower_providers_aggregate.aggregate.count,
        endc: c.endc_tower_providers.aggregate.count,
        lte: c.lte_tower_providers.aggregate.count,
        nr: c.nr_tower_providers.aggregate.count,
      }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total)
  );

  // Find max EN-DC percentage for normalization
  let maxEndcPct = $derived(
    Math.max(...sortedCarriers.map((c) => (c.total > 0 ? (c.endc / c.total) * 100 : 0)), 1)
  );

  // Max combination count for normalization
  let maxCombinationCount = $derived(
    Math.max(...combinations.map((c) => c.tower_count), 1)
  );

  function pct(value: number, total: number): string {
    if (total === 0) return "0%";
    return ((value / total) * 100).toFixed(1) + "%";
  }

  function getBarColor(combination: string): string {
    if (combination.includes("T-Mobile") && combination.includes("AT&T") && combination.includes("Verizon")) {
      return "#8b5cf6"; // Purple for all three
    }
    if (combination.includes("T-Mobile") && combination.includes("AT&T")) {
      return "#ec4899"; // Pink
    }
    if (combination.includes("T-Mobile") && combination.includes("Verizon")) {
      return "#f59e0b"; // Orange
    }
    if (combination.includes("AT&T") && combination.includes("Verizon")) {
      return "#3b82f6"; // Blue
    }
    return "#71717a"; // Gray default
  }
</script>

<div class="carrier-stats">
  <div class="stats-header">
    <h3>Carrier Network Statistics</h3>
    <div class="summary-stats">
      <div class="summary-item">
        <span class="summary-value">{totalTowers.toLocaleString()}</span>
        <span class="summary-label">Total Towers</span>
      </div>
      <div class="summary-item">
        <span class="summary-value">{sharedTowers.toLocaleString()}</span>
        <span class="summary-label">Shared Sites</span>
      </div>
      <div class="summary-item">
        <span class="summary-value">{pct(sharedTowers, totalTowers)}</span>
        <span class="summary-label">Shared %</span>
      </div>
    </div>
  </div>

  <div class="stats-grid">
    <!-- EN-DC by Carrier -->
    <div class="stat-section">
      <h4>EN-DC Capability by Carrier</h4>
      <div class="bar-chart">
        {#each sortedCarriers as carrier}
          {@const endcPct = carrier.total > 0 ? (carrier.endc / carrier.total) * 100 : 0}
          {@const barWidth = (endcPct / maxEndcPct) * 100}
          <div class="bar-row">
            <div class="bar-label-section">
              <span class="carrier-dot" style="background: {carrier.color}"></span>
              <span class="bar-label">{carrier.name}</span>
            </div>
            <div class="bar-container">
              <div
                class="bar"
                style="width: {barWidth}%; background: {carrier.color}"
              ></div>
            </div>
            <div class="bar-stats">
              <span class="bar-count">{carrier.endc.toLocaleString()}</span>
              <span class="bar-pct">{endcPct.toFixed(1)}%</span>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Shared Tower Combinations -->
    <div class="stat-section">
      <h4>Shared Site Carrier Combinations</h4>
      <div class="bar-chart">
        {#each combinations as combo}
          {@const barWidth = (combo.tower_count / maxCombinationCount) * 100}
          <div class="bar-row">
            <div class="bar-label-section wide">
              <span class="bar-label">{combo.combination}</span>
            </div>
            <div class="bar-container">
              <div
                class="bar"
                style="width: {barWidth}%; background: {getBarColor(combo.combination)}"
              ></div>
            </div>
            <div class="bar-stats">
              <span class="bar-count">{combo.tower_count.toLocaleString()}</span>
              <span class="bar-pct">{pct(combo.tower_count, sharedTowers)}</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Quick Stats Table -->
  <div class="stats-table">
    <table>
      <thead>
        <tr>
          <th>Carrier</th>
          <th class="right">Sites</th>
          <th class="right">EN-DC</th>
          <th class="right">LTE</th>
          <th class="right">5G NR</th>
        </tr>
      </thead>
      <tbody>
        {#each sortedCarriers as carrier}
          <tr>
            <td class="carrier-name">
              <span class="carrier-dot" style="background: {carrier.color}"></span>
              {carrier.name}
            </td>
            <td class="right">{carrier.total.toLocaleString()}</td>
            <td class="right endc">{carrier.endc.toLocaleString()}</td>
            <td class="right lte">{carrier.lte.toLocaleString()}</td>
            <td class="right nr">{carrier.nr.toLocaleString()}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .carrier-stats {
    background: #1e1e2e;
    border-radius: 12px;
    padding: 1.5rem;
  }

  .stats-header {
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
    margin: 0 0 1rem;
    font-size: 0.8rem;
    color: #a1a1aa;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .summary-stats {
    display: flex;
    gap: 1.5rem;
  }

  .summary-item {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  }

  .summary-value {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f4f4f5;
    font-variant-numeric: tabular-nums;
  }

  .summary-label {
    font-size: 0.7rem;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .stat-section {
    background: #27273a;
    border-radius: 8px;
    padding: 1rem;
  }

  .bar-chart {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .bar-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .bar-label-section {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100px;
    flex-shrink: 0;
  }

  .bar-label-section.wide {
    width: 180px;
  }

  .carrier-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .bar-label {
    font-size: 0.8rem;
    color: #e4e4e7;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bar-container {
    flex: 1;
    height: 24px;
    background: #1e1e2e;
    border-radius: 4px;
    overflow: hidden;
  }

  .bar {
    height: 100%;
    border-radius: 4px;
    min-width: 4px;
    transition: width 0.5s ease-out;
  }

  .bar-stats {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    min-width: 70px;
  }

  .bar-count {
    font-size: 0.85rem;
    font-weight: 600;
    color: #f4f4f5;
    font-variant-numeric: tabular-nums;
  }

  .bar-pct {
    font-size: 0.7rem;
    color: #71717a;
  }

  .stats-table {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    text-align: left;
    padding: 0.75rem 0.5rem;
    font-size: 0.7rem;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #27273a;
  }

  th.right {
    text-align: right;
  }

  td {
    padding: 0.75rem 0.5rem;
    font-size: 0.85rem;
    color: #e4e4e7;
    border-bottom: 1px solid #27273a;
  }

  td.right {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background: #27273a;
  }

  .carrier-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }

  .endc {
    color: #8b5cf6;
  }

  .lte {
    color: #3b82f6;
  }

  .nr {
    color: #a78bfa;
  }

  @media (max-width: 800px) {
    .stats-header {
      flex-direction: column;
    }

    .summary-stats {
      width: 100%;
      justify-content: space-between;
    }

    .summary-item {
      align-items: center;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .bar-label-section.wide {
      width: 140px;
    }
  }
</style>
