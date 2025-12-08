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

  // Calculate carrier slices for stacked bars
  function getCarrierSlices(item: BandPerTowerData): { color: string; width: number; name: string }[] {
    if (!item.by_carrier || item.by_carrier.length === 0) {
      return [{ color: "linear-gradient(90deg, #3b82f6, #8b5cf6)", width: 100, name: "All" }];
    }

    const total = item.by_carrier.reduce((sum, c) => sum + c.count, 0);
    return item.by_carrier.map((c) => ({
      color: getCarrierColor(c.country_id, c.provider_id),
      width: total > 0 ? (c.count / total) * 100 : 0,
      name: getCarrierName(c.country_id, c.provider_id),
    })).filter(s => s.width > 0);
  }
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
        {#each bandsPerTower.slice(0, 8) as item}
          {@const barWidth = (item.tower_count / maxBandCount) * 100}
          {@const slices = getCarrierSlices(item)}
          <div class="dist-bar-row">
            <span class="dist-label">{item.bands_count}</span>
            <div class="dist-bar-container">
              <div class="dist-bar-stacked" style="width: {barWidth}%">
                {#each slices as slice}
                  <div
                    class="dist-bar-slice"
                    style="width: {slice.width}%; background: {slice.color}"
                    title="{slice.name}: {Math.round(slice.width)}%"
                  ></div>
                {/each}
              </div>
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

    <!-- Bearing/Azimuth Distribution - Radar Style -->
    <div class="fingerprint-section">
      <h4>Sector Bearing Distribution</h4>
      <p class="section-desc">Cell sector directions (azimuth)</p>
      <div class="bearing-radar">
        <svg viewBox="0 0 200 200" class="radar-svg">
          <!-- Background circles -->
          <circle cx="100" cy="100" r="80" fill="none" stroke="#27273a" stroke-width="1" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="#27273a" stroke-width="1" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="#27273a" stroke-width="1" />
          <circle cx="100" cy="100" r="20" fill="none" stroke="#27273a" stroke-width="1" />

          <!-- Direction lines -->
          {#each [0, 45, 90, 135, 180, 225, 270, 315] as angle}
            <line
              x1="100"
              y1="100"
              x2={100 + 85 * Math.sin((angle * Math.PI) / 180)}
              y2={100 - 85 * Math.cos((angle * Math.PI) / 180)}
              stroke="#27273a"
              stroke-width="1"
            />
          {/each}

          <!-- Data polygon -->
          <polygon
            points={bearingDistribution
              .map((d, i) => {
                const angle = i * 45;
                const radius = (d.count / maxBearingCount) * 75;
                const x = 100 + radius * Math.sin((angle * Math.PI) / 180);
                const y = 100 - radius * Math.cos((angle * Math.PI) / 180);
                return `${x},${y}`;
              })
              .join(" ")}
            fill="rgba(59, 130, 246, 0.3)"
            stroke="#3b82f6"
            stroke-width="2"
          />

          <!-- Data points -->
          {#each bearingDistribution as d, i}
            {@const angle = i * 45}
            {@const radius = (d.count / maxBearingCount) * 75}
            {@const x = 100 + radius * Math.sin((angle * Math.PI) / 180)}
            {@const y = 100 - radius * Math.cos((angle * Math.PI) / 180)}
            <circle cx={x} cy={y} r="4" fill="#3b82f6" />
          {/each}

          <!-- Direction labels -->
          {#each compassLabels as label, i}
            {@const angle = i * 45}
            {@const x = 100 + 95 * Math.sin((angle * Math.PI) / 180)}
            {@const y = 100 - 95 * Math.cos((angle * Math.PI) / 180)}
            <text
              x={x}
              y={y}
              text-anchor="middle"
              dominant-baseline="middle"
              fill={label === "N" ? "#ef4444" : "#71717a"}
              font-size="11"
              font-weight={label === "N" ? "700" : "500"}
            >
              {label}
            </text>
          {/each}
        </svg>

        <!-- Stats grid below radar -->
        <div class="bearing-stats-grid">
          {#each bearingDistribution as dir, i}
            {@const pct = totalBearings > 0 ? (dir.count / totalBearings) * 100 : 0}
            <div class="bearing-stat-item">
              <span class="bearing-dir">{compassLabels[i]}</span>
              <span class="bearing-count">{dir.count.toLocaleString()}</span>
              <span class="bearing-pct">{pct.toFixed(1)}%</span>
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

  /* Bands distribution with stacked carrier colors */
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

  /* Bearing radar chart */
  .bearing-radar {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }

  .radar-svg {
    width: 100%;
    max-width: 200px;
    height: auto;
  }

  .bearing-stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.5rem;
    width: 100%;
  }

  .bearing-stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.25rem;
    background: #1e1e2e;
    border-radius: 4px;
  }

  .bearing-dir {
    font-size: 0.7rem;
    font-weight: 600;
    color: #71717a;
  }

  .bearing-count {
    font-size: 0.75rem;
    color: #e4e4e7;
    font-variant-numeric: tabular-nums;
    font-weight: 500;
  }

  .bearing-pct {
    font-size: 0.65rem;
    color: #52525b;
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
