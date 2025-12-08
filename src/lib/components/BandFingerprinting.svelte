<script lang="ts">
  import { getCarrierName, getCarrierColor } from "../carriers";

  interface CarrierBandCount {
    country_id: number;
    provider_id: number;
    count: number;
  }

  interface BandPerTowerData {
    bands_count: number;
    tower_count: number;
    by_carrier: CarrierBandCount[];
  }

  interface BandComboData {
    band_combo: number[];
    carrier_id: number | null;
    country_id: number | null;
    provider_id: number | null;
    tower_count: number;
  }

  interface SpectrumTierData {
    tier: "low" | "mid" | "high";
    count: number;
  }

  interface BearingData {
    bearing_range: string;
    count: number;
  }

  interface Props {
    bandsPerTower: BandPerTowerData[];
    topBandCombos: BandComboData[];
    spectrumTiers: SpectrumTierData[];
    bearingDistribution: BearingData[];
    totalTowers: number;
    towersWithBands: number;
    towersWithBearing: number;
  }

  let {
    bandsPerTower,
    topBandCombos,
    spectrumTiers,
    bearingDistribution,
    totalTowers,
    towersWithBands,
    towersWithBearing,
  }: Props = $props();

  // Band count distribution
  let maxBandCount = $derived(Math.max(...bandsPerTower.map((b) => b.tower_count), 1));

  // Band combo max for normalization
  let maxComboCount = $derived(Math.max(...topBandCombos.map((c) => c.tower_count), 1));

  // Spectrum tier colors
  const tierColors: Record<string, string> = {
    low: "#22c55e",
    mid: "#3b82f6",
    high: "#8b5cf6",
  };

  const tierLabels: Record<string, string> = {
    low: "Low Band (<1 GHz)",
    mid: "Mid Band (1-6 GHz)",
    high: "High Band (>6 GHz)",
  };

  // Format band combo display
  function formatBandCombo(bands: number[]): string {
    return bands.map((b) => `B${b}`).join("+");
  }

  // Get color for band combo based on carrier
  function getComboColor(combo: BandComboData): string {
    if (combo.country_id && combo.provider_id) {
      return getCarrierColor(combo.country_id, combo.provider_id);
    }
    return "#71717a";
  }

  function getComboCarrier(combo: BandComboData): string {
    if (combo.country_id && combo.provider_id) {
      return getCarrierName(combo.country_id, combo.provider_id);
    }
    return "Mixed";
  }

  // Calculate spectrum tier percentages
  let tierTotal = $derived(spectrumTiers.reduce((sum, t) => sum + t.count, 0));
  let tierPercentages = $derived(
    spectrumTiers.map((t) => ({
      ...t,
      pct: tierTotal > 0 ? (t.count / tierTotal) * 100 : 0,
    }))
  );

  // Bearing compass directions
  const compassLabels = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  let maxBearingCount = $derived(Math.max(...bearingDistribution.map((b) => b.count), 1));
  let totalBearings = $derived(bearingDistribution.reduce((sum, b) => sum + b.count, 0));

  // Calculate carrier slices for stacked bars with labels
  function getCarrierSlices(item: BandPerTowerData): { color: string; width: number; name: string; count: number }[] {
    if (!item.by_carrier || item.by_carrier.length === 0) {
      return [{ color: "#3b82f6", width: 100, name: "All", count: item.tower_count }];
    }

    const total = item.by_carrier.reduce((sum, c) => sum + c.count, 0);
    return item.by_carrier.map((c) => ({
      color: getCarrierColor(c.country_id, c.provider_id),
      width: total > 0 ? (c.count / total) * 100 : 0,
      name: getCarrierName(c.country_id, c.provider_id),
      count: c.count,
    })).filter(s => s.width > 0).sort((a, b) => b.count - a.count);
  }

  // Hovered bar for showing carrier breakdown
  let hoveredBar = $state<number | null>(null);
</script>

<div class="band-fingerprinting">
  <div class="section-header">
    <h3>Band Fingerprinting</h3>
    <div class="header-stats">
      <div class="header-stat">
        <span class="stat-value">{towersWithBands.toLocaleString()}</span>
        <span class="stat-label">With Band Data</span>
      </div>
      <div class="header-stat">
        <span class="stat-value">{towersWithBearing.toLocaleString()}</span>
        <span class="stat-label">Cells With Bearing</span>
      </div>
      <div class="header-stat">
        <span class="stat-value">{((towersWithBands / totalTowers) * 100).toFixed(1)}%</span>
        <span class="stat-label">Coverage</span>
      </div>
    </div>
  </div>

  <div class="fingerprint-grid">
    <!-- Bands Per Tower Distribution with Carrier Breakdown -->
    <div class="fingerprint-section">
      <h4>Bands Per Tower</h4>
      <p class="section-desc">Distribution by band count, colored by carrier</p>
      <div class="bands-distribution">
        {#each bandsPerTower.slice(0, 8) as item, idx}
          {@const barWidth = (item.tower_count / maxBandCount) * 100}
          {@const slices = getCarrierSlices(item)}
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            class="dist-bar-row"
            onmouseenter={() => hoveredBar = idx}
            onmouseleave={() => hoveredBar = null}
          >
            <span class="dist-label">{item.bands_count}</span>
            <div class="dist-bar-container">
              <div class="dist-bar-stacked" style="width: {barWidth}%">
                {#each slices as slice}
                  <div
                    class="dist-bar-slice"
                    style="width: {slice.width}%; background: {slice.color}"
                  ></div>
                {/each}
              </div>
            </div>
            <span class="dist-count">{item.tower_count.toLocaleString()}</span>
          </div>
          <!-- Carrier breakdown tooltip -->
          {#if hoveredBar === idx && slices.length > 1}
            <div class="carrier-breakdown">
              {#each slices.slice(0, 4) as slice}
                <div class="breakdown-item">
                  <span class="breakdown-dot" style="background: {slice.color}"></span>
                  <span class="breakdown-name">{slice.name}</span>
                  <span class="breakdown-count">{slice.count.toLocaleString()}</span>
                </div>
              {/each}
            </div>
          {/if}
        {/each}
      </div>
    </div>

    <!-- Spectrum Tier Distribution -->
    <div class="fingerprint-section">
      <h4>Spectrum Tier Distribution</h4>
      <p class="section-desc">Band records by frequency tier</p>
      <div class="tier-chart">
        <div class="tier-bar-stacked">
          {#each tierPercentages as tier}
            {#if tier.pct > 0}
              <div
                class="tier-segment"
                style="width: {tier.pct}%; background: {tierColors[tier.tier]}"
                title="{tierLabels[tier.tier]}: {tier.count.toLocaleString()}"
              ></div>
            {/if}
          {/each}
        </div>
        <div class="tier-legend">
          {#each tierPercentages as tier}
            <div class="tier-item">
              <span class="tier-dot" style="background: {tierColors[tier.tier]}"></span>
              <span class="tier-label">{tierLabels[tier.tier]}</span>
              <span class="tier-value">{tier.count.toLocaleString()}</span>
              <span class="tier-pct">({tier.pct.toFixed(1)}%)</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  </div>

  <!-- Band Combinations and Bearing side by side -->
  <div class="fingerprint-row">
    <!-- Band Combinations (Carrier Signatures) -->
    <div class="fingerprint-section flex-grow">
      <h4>Band Combinations (Carrier Signatures)</h4>
      <p class="section-desc">Most common band combinations per carrier - use to identify towers</p>
      <div class="combo-chart">
        {#each topBandCombos.slice(0, 8) as combo}
          {@const barWidth = (combo.tower_count / maxComboCount) * 100}
          <div class="combo-row">
            <div class="combo-info">
              <span class="combo-bands">{formatBandCombo(combo.band_combo)}</span>
              <span class="combo-carrier" style="color: {getComboColor(combo)}"
                >{getComboCarrier(combo)}</span
              >
            </div>
            <div class="combo-bar-container">
              <div
                class="combo-bar"
                style="width: {barWidth}%; background: {getComboColor(combo)}"
              ></div>
            </div>
            <span class="combo-count">{combo.tower_count.toLocaleString()}</span>
          </div>
        {/each}
      </div>
    </div>

    <!-- Bearing/Azimuth Distribution - Polar Area Chart -->
    <div class="fingerprint-section bearing-section">
      <h4>Sector Bearings</h4>
      <p class="section-desc">Cell azimuth distribution</p>
      <div class="bearing-polar">
        <svg viewBox="0 0 220 220" class="polar-svg">
          <!-- Background rings with labels -->
          <circle cx="110" cy="110" r="90" fill="#1e1e2e" stroke="#3b3b50" stroke-width="1" />
          <circle cx="110" cy="110" r="67.5" fill="none" stroke="#27273a" stroke-width="1" stroke-dasharray="4 2" />
          <circle cx="110" cy="110" r="45" fill="none" stroke="#27273a" stroke-width="1" stroke-dasharray="4 2" />
          <circle cx="110" cy="110" r="22.5" fill="none" stroke="#27273a" stroke-width="1" stroke-dasharray="4 2" />

          <!-- Polar area segments (pie-like wedges with varying radius) -->
          {#each bearingDistribution as d, i}
            {@const startAngle = (i * 45 - 22.5 - 90) * (Math.PI / 180)}
            {@const endAngle = (i * 45 + 22.5 - 90) * (Math.PI / 180)}
            {@const radius = 20 + (d.count / maxBearingCount) * 70}
            {@const x1 = 110 + radius * Math.cos(startAngle)}
            {@const y1 = 110 + radius * Math.sin(startAngle)}
            {@const x2 = 110 + radius * Math.cos(endAngle)}
            {@const y2 = 110 + radius * Math.sin(endAngle)}
            {@const pct = totalBearings > 0 ? (d.count / totalBearings) * 100 : 0}
            {@const hue = 210 + (pct - 12.5) * 4}
            <path
              d="M 110 110 L {x1} {y1} A {radius} {radius} 0 0 1 {x2} {y2} Z"
              fill="hsla({hue}, 70%, 55%, 0.7)"
              stroke="#1e1e2e"
              stroke-width="2"
            />
          {/each}

          <!-- Center circle -->
          <circle cx="110" cy="110" r="18" fill="#27273a" stroke="#3b3b50" stroke-width="1" />

          <!-- Direction labels with counts -->
          {#each bearingDistribution as d, i}
            {@const angle = i * 45 - 90}
            {@const labelRadius = 100}
            {@const x = 110 + labelRadius * Math.cos(angle * Math.PI / 180)}
            {@const y = 110 + labelRadius * Math.sin(angle * Math.PI / 180)}
            {@const pct = totalBearings > 0 ? (d.count / totalBearings) * 100 : 0}
            <g>
              <text
                x={x}
                y={y - 6}
                text-anchor="middle"
                dominant-baseline="middle"
                fill={compassLabels[i] === "N" ? "#ef4444" : "#a1a1aa"}
                font-size="11"
                font-weight="600"
              >
                {compassLabels[i]}
              </text>
              <text
                x={x}
                y={y + 6}
                text-anchor="middle"
                dominant-baseline="middle"
                fill="#71717a"
                font-size="8"
              >
                {pct.toFixed(0)}%
              </text>
            </g>
          {/each}
        </svg>
      </div>
    </div>
  </div>
</div>

<style>
  .band-fingerprinting {
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
    font-size: 1.25rem;
    font-weight: 700;
    color: #f4f4f5;
    font-variant-numeric: tabular-nums;
  }

  .stat-label {
    font-size: 0.7rem;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .fingerprint-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .fingerprint-row {
    display: flex;
    gap: 1.5rem;
  }

  .fingerprint-section {
    background: #27273a;
    border-radius: 8px;
    padding: 1rem;
  }

  .fingerprint-section.flex-grow {
    flex: 1;
    min-width: 0;
  }

  .fingerprint-section.bearing-section {
    width: 260px;
    flex-shrink: 0;
  }

  .section-desc {
    margin: 0 0 1rem;
    font-size: 0.75rem;
    color: #71717a;
  }

  /* Bands distribution with stacked carrier colors */
  .bands-distribution {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .dist-bar-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
    padding: 0.25rem 0;
    border-radius: 4px;
    transition: background 0.15s;
  }

  .dist-bar-row:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .dist-label {
    width: 24px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #a1a1aa;
    text-align: center;
  }

  .dist-bar-container {
    flex: 1;
    height: 20px;
    background: #1e1e2e;
    border-radius: 4px;
    overflow: hidden;
  }

  .dist-bar-stacked {
    height: 100%;
    display: flex;
    border-radius: 4px;
    overflow: hidden;
    transition: width 0.5s ease-out;
  }

  .dist-bar-slice {
    height: 100%;
    min-width: 2px;
  }

  .dist-count {
    min-width: 60px;
    font-size: 0.8rem;
    color: #e4e4e7;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* Carrier breakdown tooltip */
  .carrier-breakdown {
    margin-left: 32px;
    padding: 0.5rem 0.75rem;
    background: #1e1e2e;
    border-radius: 6px;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
  }

  .breakdown-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .breakdown-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .breakdown-name {
    font-size: 0.7rem;
    color: #a1a1aa;
  }

  .breakdown-count {
    font-size: 0.7rem;
    color: #e4e4e7;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  /* Spectrum tiers */
  .tier-chart {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .tier-bar-stacked {
    display: flex;
    height: 32px;
    border-radius: 6px;
    overflow: hidden;
  }

  .tier-segment {
    transition: width 0.5s ease-out;
  }

  .tier-legend {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .tier-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tier-dot {
    width: 10px;
    height: 10px;
    border-radius: 2px;
    flex-shrink: 0;
  }

  .tier-label {
    font-size: 0.8rem;
    color: #a1a1aa;
    flex: 1;
  }

  .tier-value {
    font-size: 0.85rem;
    font-weight: 600;
    color: #e4e4e7;
    font-variant-numeric: tabular-nums;
  }

  .tier-pct {
    font-size: 0.75rem;
    color: #71717a;
    min-width: 50px;
    text-align: right;
  }

  /* Band combinations */
  .combo-chart {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .combo-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .combo-info {
    display: flex;
    flex-direction: column;
    width: 120px;
    flex-shrink: 0;
  }

  .combo-bands {
    font-size: 0.85rem;
    font-weight: 600;
    color: #f4f4f5;
    font-family: monospace;
  }

  .combo-carrier {
    font-size: 0.7rem;
  }

  .combo-bar-container {
    flex: 1;
    height: 24px;
    background: #1e1e2e;
    border-radius: 4px;
    overflow: hidden;
  }

  .combo-bar {
    height: 100%;
    border-radius: 4px;
    min-width: 4px;
    transition: width 0.5s ease-out;
  }

  .combo-count {
    min-width: 60px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #f4f4f5;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* Bearing polar chart */
  .bearing-polar {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .polar-svg {
    width: 100%;
    max-width: 220px;
    height: auto;
  }

  @media (max-width: 900px) {
    .fingerprint-row {
      flex-direction: column;
    }

    .fingerprint-section.bearing-section {
      width: 100%;
    }

    .section-header {
      flex-direction: column;
    }

    .header-stats {
      width: 100%;
      justify-content: space-between;
    }

    .fingerprint-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
