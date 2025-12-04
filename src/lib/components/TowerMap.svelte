<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { getCarrierName, getCarrierColor } from "../carriers";
  import type { Map, CircleMarker, LayerGroup } from "leaflet";

  interface Tower {
    id: number;
    latitude: number;
    longitude: number;
    rat: string | null;
    tower_type: string | null;
    endc_available: boolean;
    provider: {
      country_id: number;
      provider_id: number;
    } | null;
  }

  interface Props {
    towers: Tower[];
    totalCount: number;
    loading: boolean;
    onBoundsChange: (bounds: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    }) => void;
  }

  let { towers, totalCount, loading, onBoundsChange }: Props = $props();

  let mapContainer: HTMLDivElement;
  let map: Map | null = null;
  let markersLayer: LayerGroup | null = null;
  let L: typeof import("leaflet") | null = null;

  function getRATColor(rat: string | null): string {
    switch (rat) {
      case "LTE":
        return "#3b82f6";
      case "NR":
        return "#8b5cf6";
      case "GSM":
        return "#22c55e";
      case "CDMA":
        return "#f59e0b";
      case "UMTS":
        return "#ec4899";
      default:
        return "#71717a";
    }
  }

  function updateMarkers() {
    if (!map || !markersLayer || !L) return;

    markersLayer.clearLayers();

    for (const tower of towers) {
      const color = getRATColor(tower.rat);
      const carrierName = tower.provider
        ? getCarrierName(tower.provider.country_id, tower.provider.provider_id)
        : "Unknown";

      const marker = L.circleMarker([tower.latitude, tower.longitude], {
        radius: 6,
        fillColor: color,
        color: tower.endc_available ? "#fff" : color,
        weight: tower.endc_available ? 2 : 1,
        opacity: 1,
        fillOpacity: 0.8,
      });

      marker.bindPopup(`
        <div style="font-family: system-ui; font-size: 13px;">
          <strong>#${tower.id}</strong><br>
          <span style="color: ${color}; font-weight: 600;">${tower.rat || "Unknown"}</span>
          ${tower.endc_available ? '<span style="background: #8b5cf6; color: white; padding: 1px 4px; border-radius: 3px; font-size: 10px; margin-left: 4px;">EN-DC</span>' : ""}<br>
          <span style="color: #666;">${tower.tower_type || "Unknown"}</span><br>
          <span style="color: #888;">${carrierName}</span><br>
          <span style="font-family: monospace; font-size: 11px; color: #999;">
            ${tower.latitude.toFixed(5)}, ${tower.longitude.toFixed(5)}
          </span>
        </div>
      `);

      markersLayer.addLayer(marker);
    }
  }

  function handleMoveEnd() {
    if (!map) return;
    const bounds = map.getBounds();
    onBoundsChange({
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLng: bounds.getWest(),
      maxLng: bounds.getEast(),
    });
  }

  onMount(async () => {
    L = await import("leaflet");
    await import("leaflet/dist/leaflet.css");

    map = L.map(mapContainer).setView([39.8283, -98.5795], 4); // Center of US

    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);

    markersLayer = L.layerGroup().addTo(map);

    map.on("moveend", handleMoveEnd);
    map.on("zoomend", handleMoveEnd);

    // Initial bounds
    handleMoveEnd();
  });

  onDestroy(() => {
    if (map) {
      map.remove();
      map = null;
    }
  });

  $effect(() => {
    if (towers && markersLayer) {
      updateMarkers();
    }
  });
</script>

<div class="map-container">
  <div class="map-header">
    <h3>Tower Map</h3>
    <div class="map-stats">
      {#if loading}
        <span class="loading-indicator">Loading...</span>
      {:else}
        <span class="tower-count">
          Showing {towers.length.toLocaleString()} of {totalCount.toLocaleString()} towers
        </span>
      {/if}
    </div>
  </div>
  <div class="map-wrapper">
    <div bind:this={mapContainer} class="map"></div>
    <div class="legend">
      <div class="legend-title">Technology</div>
      <div class="legend-item">
        <span class="legend-dot" style="background: #3b82f6"></span> LTE
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background: #8b5cf6"></span> 5G NR
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background: #ec4899"></span> UMTS
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background: #f59e0b"></span> CDMA
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background: #22c55e"></span> GSM
      </div>
      <div class="legend-divider"></div>
      <div class="legend-item">
        <span class="legend-dot endc"></span> EN-DC
      </div>
    </div>
  </div>
</div>

<style>
  .map-container {
    background: #1e1e2e;
    border-radius: 12px;
    overflow: hidden;
  }

  .map-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #27273a;
  }

  h3 {
    margin: 0;
    font-size: 1rem;
    color: #f4f4f5;
    font-weight: 600;
  }

  .map-stats {
    font-size: 0.875rem;
    color: #71717a;
  }

  .loading-indicator {
    color: #3b82f6;
  }

  .map-wrapper {
    position: relative;
    height: 500px;
  }

  .map {
    width: 100%;
    height: 100%;
  }

  .legend {
    position: absolute;
    bottom: 20px;
    right: 20px;
    background: rgba(30, 30, 46, 0.95);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    z-index: 1000;
    font-size: 0.75rem;
    color: #a1a1aa;
  }

  .legend-title {
    font-weight: 600;
    color: #f4f4f5;
    margin-bottom: 0.5rem;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.25rem 0;
  }

  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .legend-dot.endc {
    background: #8b5cf6;
    border: 2px solid white;
    width: 8px;
    height: 8px;
  }

  .legend-divider {
    height: 1px;
    background: #27273a;
    margin: 0.5rem 0;
  }

  :global(.leaflet-popup-content-wrapper) {
    background: #1e1e2e;
    color: #f4f4f5;
    border-radius: 8px;
  }

  :global(.leaflet-popup-tip) {
    background: #1e1e2e;
  }

  :global(.leaflet-popup-close-button) {
    color: #71717a !important;
  }
</style>
