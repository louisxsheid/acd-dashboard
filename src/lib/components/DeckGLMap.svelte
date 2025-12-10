<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { Deck } from "@deck.gl/core";
  import { HeatmapLayer } from "@deck.gl/aggregation-layers";
  import { ScatterplotLayer } from "@deck.gl/layers";
  import maplibregl from "maplibre-gl";
  import "maplibre-gl/dist/maplibre-gl.css";

  interface TowerProvider {
    id: number;
    rat: string | null;
    endc_available: boolean;
    provider_id: number;
    provider: {
      id: number;
      country_id: number;
      provider_id: number;
    } | null;
  }

  interface Tower {
    id: number;
    latitude: number;
    longitude: number;
    tower_type: string | null;
    endc_available: boolean;
    provider_count: number;
    tower_providers: TowerProvider[];
  }

  // Helper to get primary RAT from tower
  function getTowerRAT(tower: Tower): string | null {
    return tower.tower_providers?.[0]?.rat ?? null;
  }

  // Helper to get primary provider info
  function getTowerCarrier(tower: Tower): { countryId: number; providerId: number } | null {
    const provider = tower.tower_providers?.[0]?.provider;
    if (!provider) return null;
    return { countryId: provider.country_id, providerId: provider.provider_id };
  }

  // Get carrier name from MCC-MNC
  function getCarrierName(countryId: number, providerId: number): string {
    const key = `${countryId}-${providerId}`;
    const names: Record<string, string> = {
      "310-410": "AT&T", "310-070": "AT&T", "310-150": "AT&T",
      "311-480": "Verizon", "310-004": "Verizon", "310-012": "Verizon",
      "310-260": "T-Mobile", "310-200": "T-Mobile", "310-210": "T-Mobile",
      "311-220": "US Cellular", "311-221": "US Cellular",
      "311-012": "Dish", "312-680": "Dish",
      "313-100": "FirstNet",
    };
    return names[key] || `${countryId}-${providerId}`;
  }

  interface Cluster {
    lat: number;
    lng: number;
    tower_count: number;
    lte_count: number;
    nr_count: number;
    endc_count: number;
  }

  interface Filters {
    rat: string[];
    endc: boolean | null;
    carriers: number[];
    towerTypes: string[];
    providerCount: "all" | "single" | "multi";
  }

  interface Props {
    towers: Tower[];
    clusters: Cluster[];
    totalCount: number;
    loading: boolean;
    filters: Filters;
    onBoundsChange: (bounds: {
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
      zoom: number;
    }) => void;
  }

  let { towers, clusters, totalCount, loading, filters, onBoundsChange }: Props = $props();

  let container: HTMLDivElement;
  let map: maplibregl.Map | null = null;
  let deck: Deck | null = null;
  let currentZoom = $state(4);
  let mapReady = $state(false);

  const HEATMAP_THRESHOLD = 9; // Switch to points at city level (matches cluster query threshold)

  // Carrier colors - more distinctive palette
  const CARRIER_COLORS: Record<string, [number, number, number]> = {
    "AT&T": [0, 168, 224],       // AT&T Blue
    "Verizon": [205, 4, 11],     // Verizon Red
    "T-Mobile": [226, 0, 116],   // T-Mobile Magenta
    "US Cellular": [0, 87, 184], // US Cellular Blue
    "Dish": [236, 28, 36],       // Dish Red
    "FirstNet": [0, 51, 102],    // FirstNet Navy
  };

  // RAT colors (fallback)
  const RAT_COLORS: Record<string, [number, number, number]> = {
    LTE: [59, 130, 246],    // Blue
    NR: [139, 92, 246],     // Purple
    GSM: [34, 197, 94],     // Green
    CDMA: [245, 158, 11],   // Amber
    UMTS: [236, 72, 153],   // Pink
  };

  function getCarrierColor(countryId: number, providerId: number): [number, number, number] {
    const name = getCarrierName(countryId, providerId);
    // Check if carrier name contains known carrier
    for (const [carrier, color] of Object.entries(CARRIER_COLORS)) {
      if (name.includes(carrier)) return color;
    }
    return [113, 113, 122]; // Gray default
  }

  function getTowerColor(tower: Tower): [number, number, number] {
    // Decommissioned towers are always gray
    if (tower.tower_type === "DECOMMISSIONED") {
      return [113, 113, 122]; // Gray
    }
    // Multi-provider towers get a special color
    if (tower.provider_count > 1) {
      return [251, 191, 36]; // Amber for shared sites
    }
    // Color by carrier
    const carrier = getTowerCarrier(tower);
    if (carrier) {
      return getCarrierColor(carrier.countryId, carrier.providerId);
    }
    // Fallback to RAT color
    return RAT_COLORS[getTowerRAT(tower) || ""] || [113, 113, 122];
  }

  function getRATColor(rat: string | null): [number, number, number] {
    return RAT_COLORS[rat || ""] || [113, 113, 122]; // Gray default
  }

  // Filter towers based on current filters (only for individual tower view)
  let filteredTowers = $derived(() => {
    let result = towers;

    // RAT filter
    if (filters.rat.length > 0) {
      result = result.filter(t => filters.rat.includes(getTowerRAT(t) || ""));
    }

    // EN-DC filter
    if (filters.endc === true) {
      result = result.filter(t => t.endc_available);
    } else if (filters.endc === false) {
      result = result.filter(t => !t.endc_available);
    }

    // Carrier filter - filter by provider internal IDs (providers.id)
    if (filters.carriers.length > 0) {
      result = result.filter(t =>
        t.tower_providers.some(tp =>
          tp.provider && filters.carriers.includes(tp.provider.id)
        )
      );
    }

    // Tower type filter
    if (filters.towerTypes.length > 0) {
      result = result.filter(t => filters.towerTypes.includes(t.tower_type || ""));
    }

    // Provider count filter (single vs multi-carrier sites)
    if (filters.providerCount === "single") {
      result = result.filter(t => t.provider_count === 1);
    } else if (filters.providerCount === "multi") {
      result = result.filter(t => t.provider_count > 1);
    }

    return result;
  });

  // Create heatmap from cluster data - each cluster point weighted by tower_count
  function createClusterHeatmapLayers(clusterData: Cluster[], zoom: number) {
    if (clusterData.length === 0) {
      console.log('createClusterHeatmapLayers: no cluster data');
      return [];
    }
    console.log('createClusterHeatmapLayers: creating heatmap with', clusterData.length, 'clusters at zoom', zoom);

    // Smooth interpolation based on zoom level
    const minZoom = 3;
    const maxZoom = 9;
    const clampedZoom = Math.max(minZoom, Math.min(maxZoom, zoom));
    const t = (clampedZoom - minZoom) / (maxZoom - minZoom);

    // Radius: 70px at zoom 3 -> 16px at zoom 9
    const radiusPixels = Math.round(70 * Math.pow(0.78, (clampedZoom - minZoom)));

    // Intensity: 0.6 at zoom 3 -> 2.4 at zoom 9
    const intensity = 0.6 + (t * 1.8);

    return [
      new HeatmapLayer({
        id: "clusters-heatmap",
        data: clusterData,
        getPosition: (d: Cluster) => [d.lng, d.lat],
        getWeight: (d: Cluster) => Math.log10(d.tower_count + 1) * 10,
        aggregation: "SUM",
        radiusPixels,
        intensity,
        threshold: 0.025,
        colorRange: [
          [0, 0, 0, 0],           // Transparent
          [30, 60, 120, 130],     // Dark blue
          [59, 130, 246, 165],    // Blue
          [99, 102, 241, 190],    // Indigo
          [139, 92, 246, 210],    // Purple
          [192, 132, 252, 225],   // Light purple
          [251, 191, 36, 238],    // Amber
          [251, 146, 60, 248],    // Orange
          [239, 68, 68, 255],     // Red (hotspots)
        ],
      }),
    ];
  }

  function handleTowerClick(tower: Tower) {
    if (!map) return;
    // Zoom to the tower location
    map.flyTo({
      center: [tower.longitude, tower.latitude],
      zoom: 16,
      duration: 1000,
    });
  }

  function createTowerLayers(data: Tower[], zoom: number) {
    // Always show individual points when we have tower data (zoom >= 9)
    // Adjust point size based on zoom level for better visibility
    const radiusMinPixels = zoom < 10 ? 4 : zoom < 12 ? 5 : 6;
    const radiusMaxPixels = zoom < 10 ? 8 : zoom < 12 ? 12 : 16;

    return [
      new ScatterplotLayer({
        id: "towers-scatter",
        data,
        getPosition: (d: Tower) => [d.longitude, d.latitude],
        getRadius: 50,
        getFillColor: (d: Tower) => [...getTowerColor(d), zoom < 10 ? 200 : 220],
        getLineColor: (d: Tower) => {
          if (d.endc_available) return [255, 255, 255, 255]; // White ring for EN-DC
          if (d.provider_count > 1) return [30, 30, 30, 255]; // Dark ring for shared
          return [...getTowerColor(d), 255];
        },
        getLineWidth: (d: Tower) => (d.endc_available || d.provider_count > 1) ? 2 : 0,
        radiusMinPixels,
        radiusMaxPixels,
        lineWidthMinPixels: 1,
        pickable: true,
        stroked: true,
        updateTriggers: {
          getFillColor: [zoom],
          getLineColor: [zoom],
        },
      }),
    ];
  }

  function createLayers(towerData: Tower[], clusterData: Cluster[], zoom: number) {
    // Use cluster data as weighted heatmap when available (zoomed out)
    if (clusterData.length > 0) {
      return createClusterHeatmapLayers(clusterData, zoom);
    }
    // Use individual towers at high zoom
    if (towerData.length > 0) {
      return createTowerLayers(towerData, zoom);
    }
    return [];
  }

  function updateDeck() {
    if (!deck || !map) {
      console.log('updateDeck: deck or map not ready', { deck: !!deck, map: !!map });
      return;
    }

    const towerData = filteredTowers();
    const layers = createLayers(towerData, clusters, currentZoom);
    console.log('updateDeck: setting layers:', layers.length, 'layers');
    deck.setProps({ layers });
  }

  function handleViewStateChange() {
    if (!map) return;

    const center = map.getCenter();
    const zoom = map.getZoom();
    const bounds = map.getBounds();

    currentZoom = zoom;

    onBoundsChange({
      minLat: bounds.getSouth(),
      maxLat: bounds.getNorth(),
      minLng: bounds.getWest(),
      maxLng: bounds.getEast(),
      zoom,
    });
  }

  onMount(() => {
    // Initialize MapLibre with satellite imagery
    map = new maplibregl.Map({
      container,
      style: {
        version: 8,
        sources: {
          "esri-satellite": {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: "satellite-layer",
            type: "raster",
            source: "esri-satellite",
            minzoom: 0,
            maxzoom: 22,
          },
        ],
      },
      center: [-98.5795, 39.8283],
      zoom: 4,
      maxZoom: 18,
    });

    map.on("load", () => {
      // Initialize deck.gl
      deck = new Deck({
        parent: container,
        style: { position: "absolute", top: "0", left: "0", width: "100%", height: "100%", zIndex: "1", pointerEvents: "none" },
        pickingRadius: 5,
        initialViewState: {
          longitude: -98.5795,
          latitude: 39.8283,
          zoom: 4,
          pitch: 0,
          bearing: 0,
        },
        controller: false, // Let MapLibre handle controls
        layers: [],
        getTooltip: ({ object }: any) => {
          if (!object) return null;

          const tower = object as Tower;
          const providers = tower.tower_providers || [];
          const primaryProvider = providers[0];
          const rat = primaryProvider?.rat || "Unknown";
          const carrier = primaryProvider?.provider
            ? getCarrierName(primaryProvider.provider.country_id, primaryProvider.provider.provider_id)
            : "Unknown";

          // Build carrier list for multi-provider sites
          const carrierList = providers
            .map(tp => tp.provider ? getCarrierName(tp.provider.country_id, tp.provider.provider_id) : null)
            .filter((v, i, a) => v && a.indexOf(v) === i) // unique
            .join(", ");

          const towerType = tower.tower_type || "Unknown";
          const color = getTowerColor(tower);
          const colorHex = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;

          return {
            html: `<div style="background: #1e1e2e; color: #f4f4f5; padding: 12px 16px; border-radius: 8px; font-family: system-ui; font-size: 13px; min-width: 200px; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong style="font-size: 14px;">Tower #${tower.id}</strong>
                <span style="background: ${colorHex}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${rat}</span>
              </div>
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #71717a;">Carrier</span>
                  <span style="font-weight: 500;">${tower.provider_count > 1 ? `${tower.provider_count} carriers` : carrier}</span>
                </div>
                ${tower.provider_count > 1 ? `<div style="color: #a1a1aa; font-size: 11px; margin-left: auto;">${carrierList}</div>` : ""}
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #71717a;">Type</span>
                  <span>${towerType}</span>
                </div>
                ${tower.endc_available ? `<div style="display: flex; justify-content: space-between;">
                  <span style="color: #71717a;">5G</span>
                  <span style="color: #8b5cf6; font-weight: 600;">EN-DC Enabled</span>
                </div>` : ""}
              </div>
              <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #27273a; font-family: monospace; font-size: 11px; color: #52525b;">
                ${tower.latitude.toFixed(6)}, ${tower.longitude.toFixed(6)}
              </div>
            </div>`,
            style: {
              backgroundColor: "transparent",
              border: "none",
            },
          };
        },
      });

      // Sync deck.gl view with MapLibre
      map!.on("move", () => {
        if (!deck || !map) return;
        const { lng, lat } = map.getCenter();
        const zoom = map.getZoom();
        const pitch = map.getPitch();
        const bearing = map.getBearing();

        deck.setProps({
          viewState: {
            longitude: lng,
            latitude: lat,
            zoom,
            pitch,
            bearing,
          },
        });

        // Update layers based on zoom
        if (Math.abs(zoom - currentZoom) > 0.5 || zoom > HEATMAP_THRESHOLD !== currentZoom > HEATMAP_THRESHOLD) {
          currentZoom = zoom;
          updateDeck();
        }
      });

      map!.on("moveend", handleViewStateChange);

      // Handle clicks - query deck.gl for picked objects
      map!.on("click", (e) => {
        if (!deck) return;
        const picked = deck.pickObject({
          x: e.point.x,
          y: e.point.y,
          radius: 10,
        });
        if (picked?.object && 'latitude' in picked.object && 'longitude' in picked.object) {
          handleTowerClick(picked.object as Tower);
        }
      });

      // Initial load
      handleViewStateChange();
      mapReady = true;
      console.log('Map ready, deck initialized');
      updateDeck();
    });
  });

  onDestroy(() => {
    deck?.finalize();
    map?.remove();
  });

  // Update layers when towers, clusters, or filters change
  $effect(() => {
    const towerData = filteredTowers();
    const clusterData = clusters;
    const ready = mapReady;
    console.log('DeckGL effect triggered - clusters:', clusterData.length, 'towers:', towerData.length, 'zoom:', currentZoom, 'ready:', ready);
    if (clusterData.length > 0) {
      console.log('Sample cluster:', clusterData[0]);
    }
    if (ready) {
      updateDeck();
    }
  });

  let displayMode = $derived(
    clusters.length > 0 ? "heatmap" : "points"
  );
  let filteredCount = $derived(filteredTowers().length);
</script>

<div class="map-container">
  <div class="map-header">
    <h3>Tower Map</h3>
    <div class="map-stats">
      {#if loading}
        <span class="loading-indicator">
          <span class="loading-dot"></span>
          Loading...
        </span>
      {:else}
        <span class="tower-count">
          {totalCount.toLocaleString()} towers
        </span>
        <span class="mode-badge" class:heatmap={displayMode === "heatmap"}>
          {displayMode === "heatmap" ? "Density" : "Points"}
        </span>
      {/if}
    </div>
  </div>
  <div class="map-wrapper">
    <div bind:this={container} class="map"></div>
    <div class="legend">
      <div class="legend-title">
        {displayMode === "heatmap" ? "Density" : "Carriers"}
      </div>
      {#if displayMode === "heatmap"}
        <div class="heatmap-legend">
          <div class="heatmap-gradient"></div>
          <div class="heatmap-labels">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>
      {:else}
        <div class="legend-item">
          <span class="legend-dot" style="background: rgb(0, 168, 224)"></span> AT&T
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: rgb(205, 4, 11)"></span> Verizon
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: rgb(226, 0, 116)"></span> T-Mobile
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: rgb(0, 87, 184)"></span> US Cellular
        </div>
        <div class="legend-divider"></div>
        <div class="legend-item">
          <span class="legend-dot" style="background: rgb(251, 191, 36)"></span> Shared Site
        </div>
        <div class="legend-item">
          <span class="legend-dot endc"></span> EN-DC
        </div>
      {/if}
      <div class="legend-divider"></div>
      <div class="legend-hint">
        {displayMode === "heatmap" ? "Zoom to city level for tower locations" : "Hover for details"}
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
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.875rem;
    color: #71717a;
  }

  .loading-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #3b82f6;
  }

  .loading-dot {
    width: 8px;
    height: 8px;
    background: #3b82f6;
    border-radius: 50%;
    animation: pulse 1s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  .mode-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    background: #3b82f6;
    color: white;
  }

  .mode-badge.heatmap {
    background: linear-gradient(90deg, #3b82f6, #ec4899);
  }

  .map-wrapper {
    position: relative;
    height: 600px;
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
    backdrop-filter: blur(4px);
    min-width: 120px;
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
    background: rgb(139, 92, 246);
    border: 2px solid white;
    width: 8px;
    height: 8px;
  }

  .legend-divider {
    height: 1px;
    background: #27273a;
    margin: 0.5rem 0;
  }

  .legend-hint {
    color: #52525b;
    font-size: 0.65rem;
    font-style: italic;
  }

  .heatmap-legend {
    margin: 0.5rem 0;
  }

  .heatmap-gradient {
    height: 12px;
    border-radius: 3px;
    background: linear-gradient(90deg,
      rgba(30, 60, 120, 0.6),
      rgba(59, 130, 246, 0.7),
      rgba(139, 92, 246, 0.8),
      rgba(192, 132, 252, 0.85),
      rgba(251, 191, 36, 0.9),
      rgba(251, 146, 60, 0.95),
      rgba(239, 68, 68, 1)
    );
  }

  .heatmap-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.65rem;
    color: #71717a;
    margin-top: 0.25rem;
  }

  :global(.maplibregl-canvas) {
    outline: none;
  }
</style>
