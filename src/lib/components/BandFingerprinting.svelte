<script lang="ts">
  import { getCarrierName, getCarrierColor } from "../carriers";

  interface BandPerTowerData {
    bands_count: number;
    tower_count: number;
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
  const compassDirections = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  let maxBearingCount = $derived(Math.max(...bearingDistribution.map((b) => b.count), 1));
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
        <span class="stat-label">With Bearing</span>
      </div>
      <div class="header-stat">
        <span class="stat-value">{((towersWithBands / totalTowers) * 100).toFixed(1)}%</span>
        <span class="stat-label">Coverage</span>
      </div>
    </div>
  </div>

  <div class="fingerprint-grid">
    <!-- Bands Per Tower Distribution -->
    <div class="fingerprint-section">
      <h4>Bands Per Tower</h4>
      <p class="section-desc">Distribution of band count per tower site</p>
      <div class="bands-distribution">
        {#each bandsPerTower.slice(0, 8) as item}
          {@const barWidth = (item.tower_count / maxBandCount) * 100}
          <div class="dist-bar-row">
            <span class="dist-label">{item.bands_count}</span>
            <div class="dist-bar-container">
              <div
                class="dist-bar"
                style="width: {barWidth}%; background: linear-gradient(90deg, #3b82f6, #8b5cf6)"
              ></div>
            </div>
            <span class="dist-count">{item.tower_count.toLocaleString()}</span>
          </div>
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

  <div class="fingerprint-grid">
    <!-- Band Combinations (Carrier Signatures) -->
    <div class="fingerprint-section wide">
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

    <!-- Bearing/Azimuth Distribution -->
    <div class="fingerprint-section">
      <h4>Sector Bearing Distribution</h4>
      <p class="section-desc">Cell sector directions (azimuth)</p>
      <div class="bearing-compass">
        <div class="compass-ring">
          {#each bearingDistribution as dir, i}
            {@const angle = i * 45 - 90}
            {@const barHeight = (dir.count / maxBearingCount) * 40}
            <div
              class="compass-bar"
              style="transform: rotate({angle}deg); --bar-height: {barHeight}px"
            >
              <div class="compass-bar-fill"></div>
            </div>
          {/each}
          <div class="compass-center">
            <span class="compass-n">N</span>
          </div>
        </div>
        <div class="bearing-stats">
          {#each bearingDistribution as dir, i}
            <div class="bearing-stat">
              <span class="bearing-dir">{compassDirections[i]}</span>
              <span class="bearing-count">{dir.count.toLocaleString()}</span>
            </div>
          {/each}
        </div>
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

  .fingerprint-grid:last-child {
    margin-bottom: 0;
  }

  .fingerprint-section {
    background: #27273a;
    border-radius: 8px;
    padding: 1rem;
  }

  .fingerprint-section.wide {
    grid-column: span 1;
  }

  @media (min-width: 900px) {
    .fingerprint-section.wide {
      grid-column: span 2;
    }

    .fingerprint-grid:last-child {
      grid-template-columns: 2fr 1fr;
    }
  }

  .section-desc {
    margin: 0 0 1rem;
    font-size: 0.75rem;
    color: #71717a;
  }

  /* Bands distribution */
  .bands-distribution {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .dist-bar-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
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

  .dist-bar {
    height: 100%;
    border-radius: 4px;
    min-width: 4px;
    transition: width 0.5s ease-out;
  }

  .dist-count {
    min-width: 60px;
    font-size: 0.8rem;
    color: #e4e4e7;
    text-align: right;
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

  /* Bearing compass */
  .bearing-compass {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .compass-ring {
    position: relative;
    width: 140px;
    height: 140px;
    border: 2px solid #3b3b50;
    border-radius: 50%;
  }

  .compass-bar {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 50%;
    transform-origin: bottom center;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .compass-bar-fill {
    width: 8px;
    height: var(--bar-height, 20px);
    background: linear-gradient(180deg, #3b82f6, #8b5cf6);
    border-radius: 2px;
    margin-top: 4px;
  }

  .compass-center {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 40px;
    height: 40px;
    background: #27273a;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .compass-n {
    font-size: 0.75rem;
    font-weight: 700;
    color: #ef4444;
  }

  .bearing-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    width: 100%;
  }

  .bearing-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.25rem;
  }

  .bearing-dir {
    font-size: 0.7rem;
    font-weight: 600;
    color: #71717a;
  }

  .bearing-count {
    font-size: 0.75rem;
    color: #a1a1aa;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 800px) {
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

    .fingerprint-section.wide {
      grid-column: span 1;
    }
  }
</style>
