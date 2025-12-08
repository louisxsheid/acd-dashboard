<script lang="ts">
  import { getCarrierName, getCarrierColor } from "../carriers";

  interface CarrierOpportunity {
    country_id: number;
    provider_id: number;
    name: string | null;
    total_sites: number;
    endc_sites: number;
    non_endc_sites: number;
    exclusive_sites: number;
  }

  interface Props {
    carriers: CarrierOpportunity[];
    totalTowers: number;
    singleCarrierTowers: number;
  }

  let { carriers, totalTowers, singleCarrierTowers }: Props = $props();

  let sortedCarriers = $derived(
    [...carriers]
      .map((c) => ({
        ...c,
        name: getCarrierName(c.country_id, c.provider_id),
        color: getCarrierColor(c.country_id, c.provider_id),
        upgradePct: c.total_sites > 0 ? (c.non_endc_sites / c.total_sites) * 100 : 0,
      }))
      .filter((c) => c.total_sites > 0)
      .sort((a, b) => b.non_endc_sites - a.non_endc_sites)
  );

  let totalUpgradeOpportunities = $derived(
    sortedCarriers.reduce((sum, c) => sum + c.non_endc_sites, 0)
  );

  let totalExclusiveSites = $derived(
    sortedCarriers.reduce((sum, c) => sum + c.exclusive_sites, 0)
  );

  // Find max for bar normalization
  let maxNonEndc = $derived(
    Math.max(...sortedCarriers.map((c) => c.non_endc_sites), 1)
  );

  let maxExclusive = $derived(
    Math.max(...sortedCarriers.map((c) => c.exclusive_sites), 1)
  );

  function formatNumber(n: number): string {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return n.toLocaleString();
  }

  function formatCurrency(n: number): string {
    if (n >= 1000000000) return "$" + (n / 1000000000).toFixed(1) + "B";
    if (n >= 1000000) return "$" + (n / 1000000).toFixed(0) + "M";
    return "$" + n.toLocaleString();
  }
</script>

<div class="business-opportunities">
  <div class="section-header">
    <h3>Business Opportunities</h3>
    <div class="header-stats">
      <div class="header-stat">
        <span class="stat-value highlight">{formatNumber(totalUpgradeOpportunities)}</span>
        <span class="stat-label">5G Upgrade Opportunities</span>
      </div>
      <div class="header-stat">
        <span class="stat-value highlight-green">{formatNumber(totalExclusiveSites)}</span>
        <span class="stat-label">Co-location Leads</span>
      </div>
    </div>
  </div>

  <div class="opportunities-grid">
    <!-- 5G Upgrade Opportunities -->
    <div class="opportunity-section">
      <h4>5G Upgrade Opportunities</h4>
      <p class="section-desc">Sites without EN-DC capability that could be upgraded</p>
      <div class="bar-chart">
        {#each sortedCarriers as carrier}
          {@const barWidth = (carrier.non_endc_sites / maxNonEndc) * 100}
          <div class="bar-row">
            <div class="bar-label-section">
              <span class="carrier-dot" style="background: {carrier.color}"></span>
              <span class="bar-label">{carrier.name}</span>
            </div>
            <div class="bar-container">
              <div
                class="bar"
                style="width: {barWidth}%; background: linear-gradient(90deg, {carrier.color}, {carrier.color}88)"
              ></div>
            </div>
            <div class="bar-stats">
              <span class="bar-count">{formatNumber(carrier.non_endc_sites)}</span>
              <span class="bar-pct">{carrier.upgradePct.toFixed(0)}% need upgrade</span>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Co-location Opportunities -->
    <div class="opportunity-section">
      <h4>Co-location Opportunities</h4>
      <p class="section-desc">Exclusive sites where competitors could add coverage</p>
      <div class="bar-chart">
        {#each sortedCarriers.sort((a, b) => b.exclusive_sites - a.exclusive_sites) as carrier}
          {@const barWidth = (carrier.exclusive_sites / maxExclusive) * 100}
          <div class="bar-row">
            <div class="bar-label-section">
              <span class="carrier-dot" style="background: {carrier.color}"></span>
              <span class="bar-label">{carrier.name}</span>
            </div>
            <div class="bar-container">
              <div
                class="bar"
                style="width: {barWidth}%; background: linear-gradient(90deg, #22c55e, #22c55e88)"
              ></div>
            </div>
            <div class="bar-stats">
              <span class="bar-count">{formatNumber(carrier.exclusive_sites)}</span>
              <span class="bar-pct">exclusive sites</span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>

  <!-- Market Value Estimation -->
  <div class="market-value">
    <h4>Estimated Market Value</h4>
    <div class="value-cards">
      <div class="value-card">
        <div class="value-icon">📡</div>
        <div class="value-content">
          <span class="value-amount">{formatCurrency(totalExclusiveSites * 50000)}</span>
          <span class="value-desc">Co-location market (at $50K/site/yr)</span>
        </div>
      </div>
      <div class="value-card">
        <div class="value-icon">⚡</div>
        <div class="value-content">
          <span class="value-amount">{formatCurrency(totalUpgradeOpportunities * 30000)}</span>
          <span class="value-desc">5G upgrade market (at $30K/site)</span>
        </div>
      </div>
      <div class="value-card total">
        <div class="value-icon">💰</div>
        <div class="value-content">
          <span class="value-amount">{formatCurrency(totalExclusiveSites * 50000 + totalUpgradeOpportunities * 30000)}</span>
          <span class="value-desc">Total addressable market</span>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .business-opportunities {
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
    font-size: 1.5rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .stat-value.highlight {
    color: #f59e0b;
  }

  .stat-value.highlight-green {
    color: #22c55e;
  }

  .stat-label {
    font-size: 0.7rem;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .opportunities-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .opportunity-section {
    background: #27273a;
    border-radius: 8px;
    padding: 1rem;
  }

  .section-desc {
    margin: 0 0 1rem;
    font-size: 0.75rem;
    color: #71717a;
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
    min-width: 90px;
  }

  .bar-count {
    font-size: 0.85rem;
    font-weight: 600;
    color: #f4f4f5;
    font-variant-numeric: tabular-nums;
  }

  .bar-pct {
    font-size: 0.65rem;
    color: #71717a;
  }

  .market-value {
    background: #27273a;
    border-radius: 8px;
    padding: 1rem;
  }

  .value-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }

  .value-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #1e1e2e;
    border-radius: 8px;
    border: 1px solid #3f3f5a;
  }

  .value-card.total {
    background: linear-gradient(135deg, #1e1e2e, #2a2a4a);
    border-color: #8b5cf6;
  }

  .value-icon {
    font-size: 1.5rem;
  }

  .value-content {
    display: flex;
    flex-direction: column;
  }

  .value-amount {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f4f4f5;
  }

  .value-card.total .value-amount {
    color: #a78bfa;
  }

  .value-desc {
    font-size: 0.7rem;
    color: #71717a;
  }

  @media (max-width: 800px) {
    .section-header {
      flex-direction: column;
    }

    .header-stats {
      width: 100%;
      justify-content: space-between;
    }

    .opportunities-grid {
      grid-template-columns: 1fr;
    }

    .value-cards {
      grid-template-columns: 1fr;
    }
  }
</style>
