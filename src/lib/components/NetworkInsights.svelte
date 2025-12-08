<script lang="ts">
  import { getCarrierName, getCarrierColor } from "../carriers";

  interface CarrierCellData {
    country_id: number;
    provider_id: number;
    total_cells: number;
    cells_with_speed: number;
    avg_download: number | null;
    max_download: number | null;
    cells_with_snr: number;
    avg_snr: number | null;
  }

  interface BandData {
    band_number: number;
    band_name: string | null;
    count: number;
  }

  interface Props {
    carrierCells: CarrierCellData[];
    topBands: BandData[];
    totalCells: number;
    cellsWithSpeed: number;
    cellsWithSignal: number;
  }

  let { carrierCells, topBands, totalCells, cellsWithSpeed, cellsWithSignal }: Props = $props();

  let sortedCarriers = $derived(
    [...carrierCells]
      .map((c) => ({
        ...c,
        name: getCarrierName(c.country_id, c.provider_id),
        color: getCarrierColor(c.country_id, c.provider_id),
        speedCoverage: c.total_cells > 0 ? (c.cells_with_speed / c.total_cells) * 100 : 0,
      }))
      .filter((c) => c.total_cells > 0)
      .sort((a, b) => b.total_cells - a.total_cells)
  );

  let maxCells = $derived(Math.max(...sortedCarriers.map((c) => c.total_cells), 1));
  let maxBandCount = $derived(Math.max(...topBands.map((b) => b.count), 1));

  function formatSpeed(speed: number | null): string {
    if (speed === null) return "—";
    return speed.toFixed(0) + " Mbps";
  }

  function getBandColor(bandNumber: number): string {
    // Low band (< 1GHz)
    if (bandNumber === 5 || bandNumber === 12 || bandNumber === 13 || bandNumber === 14 || bandNumber === 17 || bandNumber === 71) {
      return "#22c55e"; // Green for low band
    }
    // Mid band
    if (bandNumber === 2 || bandNumber === 4 || bandNumber === 25 || bandNumber === 30 || bandNumber === 66) {
      return "#3b82f6"; // Blue for mid band
    }
    // High band (mmWave, C-band)
    if (bandNumber === 41 || bandNumber === 46 || bandNumber === 48 || bandNumber === 77 || bandNumber === 258 || bandNumber === 260 || bandNumber === 261) {
      return "#8b5cf6"; // Purple for high band
    }
    return "#71717a";
  }
</script>

<div class="network-insights">
  <div class="section-header">
    <h3>Network Data Insights</h3>
    <div class="header-stats">
      <div class="header-stat">
        <span class="stat-value">{totalCells.toLocaleString()}</span>
        <span class="stat-label">Total Cells</span>
      </div>
      <div class="header-stat">
        <span class="stat-value">{cellsWithSpeed.toLocaleString()}</span>
        <span class="stat-label">With Speed Data</span>
      </div>
      <div class="header-stat">
        <span class="stat-value">{((cellsWithSpeed / totalCells) * 100).toFixed(1)}%</span>
        <span class="stat-label">Speed Coverage</span>
      </div>
    </div>
  </div>

  <div class="insights-grid">
    <!-- Cell Density by Carrier -->
    <div class="insight-section">
      <h4>Cell Density by Carrier</h4>
      <p class="section-desc">Total cells and performance data coverage</p>
      <div class="bar-chart">
        {#each sortedCarriers as carrier}
          {@const barWidth = (carrier.total_cells / maxCells) * 100}
          <div class="bar-row">
            <div class="bar-label-section">
              <span class="carrier-dot" style="background: {carrier.color}"></span>
              <span class="bar-label">{carrier.name}</span>
            </div>
            <div class="bar-container">
              <div class="bar" style="width: {barWidth}%; background: {carrier.color}"></div>
            </div>
            <div class="bar-stats">
              <span class="bar-count">{carrier.total_cells.toLocaleString()}</span>
              <span class="bar-pct">{carrier.speedCoverage.toFixed(0)}% with speed</span>
            </div>
          </div>
        {/each}
      </div>
    </div>

    <!-- Top Bands Deployed -->
    <div class="insight-section">
      <h4>Top Spectrum Bands</h4>
      <p class="section-desc">Most deployed LTE bands across all carriers</p>
      <div class="bar-chart">
        {#each topBands.slice(0, 6) as band}
          {@const barWidth = (band.count / maxBandCount) * 100}
          <div class="bar-row">
            <div class="bar-label-section wide">
              <span class="band-badge" style="background: {getBandColor(band.band_number)}">B{band.band_number}</span>
              <span class="bar-label">{band.band_name || `Band ${band.band_number}`}</span>
            </div>
            <div class="bar-container">
              <div class="bar" style="width: {barWidth}%; background: {getBandColor(band.band_number)}"></div>
            </div>
            <div class="bar-stats">
              <span class="bar-count">{band.count.toLocaleString()}</span>
            </div>
          </div>
        {/each}
      </div>
      <div class="band-legend">
        <span class="legend-item"><span class="legend-dot" style="background: #22c55e"></span>Low Band (&lt;1GHz)</span>
        <span class="legend-item"><span class="legend-dot" style="background: #3b82f6"></span>Mid Band</span>
        <span class="legend-item"><span class="legend-dot" style="background: #8b5cf6"></span>High Band</span>
      </div>
    </div>
  </div>

  <!-- Performance by Carrier -->
  <div class="performance-table">
    <h4>Network Performance by Carrier</h4>
    <table>
      <thead>
        <tr>
          <th>Carrier</th>
          <th class="right">Cells</th>
          <th class="right">Avg Download</th>
          <th class="right">Max Download</th>
          <th class="right">Avg SNR</th>
          <th class="right">Data Coverage</th>
        </tr>
      </thead>
      <tbody>
        {#each sortedCarriers as carrier}
          <tr>
            <td class="carrier-name">
              <span class="carrier-dot" style="background: {carrier.color}"></span>
              {carrier.name}
            </td>
            <td class="right">{carrier.total_cells.toLocaleString()}</td>
            <td class="right speed">{formatSpeed(carrier.avg_download)}</td>
            <td class="right speed-max">{formatSpeed(carrier.max_download)}</td>
            <td class="right snr">{carrier.avg_snr ? carrier.avg_snr.toFixed(1) + " dB" : "—"}</td>
            <td class="right">
              <span class="coverage-bar">
                <span class="coverage-fill" style="width: {carrier.speedCoverage}%"></span>
              </span>
              {carrier.speedCoverage.toFixed(0)}%
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .network-insights {
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

  .insights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .insight-section {
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

  .bar-label-section.wide {
    width: 140px;
  }

  .carrier-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .band-badge {
    font-size: 0.65rem;
    font-weight: 600;
    padding: 2px 6px;
    border-radius: 4px;
    color: white;
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
    min-width: 80px;
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

  .band-legend {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid #1e1e2e;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    color: #71717a;
  }

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 2px;
  }

  .performance-table {
    background: #27273a;
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 0.75rem;
  }

  th {
    text-align: left;
    padding: 0.75rem 0.5rem;
    font-size: 0.7rem;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #1e1e2e;
  }

  th.right {
    text-align: right;
  }

  td {
    padding: 0.75rem 0.5rem;
    font-size: 0.85rem;
    color: #e4e4e7;
    border-bottom: 1px solid #1e1e2e;
  }

  td.right {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background: #1e1e2e;
  }

  .carrier-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 500;
  }

  .speed {
    color: #3b82f6;
  }

  .speed-max {
    color: #22c55e;
  }

  .snr {
    color: #f59e0b;
  }

  .coverage-bar {
    display: inline-block;
    width: 50px;
    height: 6px;
    background: #1e1e2e;
    border-radius: 3px;
    margin-right: 0.5rem;
    vertical-align: middle;
  }

  .coverage-fill {
    display: block;
    height: 100%;
    background: #8b5cf6;
    border-radius: 3px;
  }

  @media (max-width: 800px) {
    .section-header {
      flex-direction: column;
    }

    .header-stats {
      width: 100%;
      justify-content: space-between;
    }

    .insights-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
