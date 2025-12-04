<script lang="ts">
  interface Tower {
    id: number;
    external_id: string | null;
    rat: string | null;
    tower_type: string | null;
    latitude: number;
    longitude: number;
    last_seen_at: string | null;
    provider: {
      name: string | null;
      country_id: number;
      provider_id: number;
    } | null;
  }

  interface Props {
    towers: Tower[];
  }

  let { towers }: Props = $props();

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

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
</script>

<div class="recent-towers">
  <h3>Recently Seen Towers</h3>
  <div class="towers-list">
    {#each towers as tower}
      <div class="tower-item">
        <div class="tower-main">
          <span class="rat-badge" style="background: {getRATColor(tower.rat)}">{tower.rat || "?"}</span>
          <div class="tower-info">
            <span class="tower-id">#{tower.id}</span>
            <span class="tower-type">{tower.tower_type || "Unknown"}</span>
          </div>
        </div>
        <div class="tower-meta">
          <span class="provider">{tower.provider?.name || "Unknown Provider"}</span>
          <span class="coords">{tower.latitude.toFixed(4)}, {tower.longitude.toFixed(4)}</span>
          <span class="date">{formatDate(tower.last_seen_at)}</span>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .recent-towers {
    background: #1e1e2e;
    border-radius: 12px;
    padding: 1.5rem;
  }

  h3 {
    margin: 0 0 1rem;
    font-size: 1rem;
    color: #f4f4f5;
    font-weight: 600;
  }

  .towers-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .tower-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: #27273a;
    border-radius: 8px;
    transition: background 0.2s;
  }

  .tower-item:hover {
    background: #323248;
  }

  .tower-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .rat-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    color: white;
  }

  .tower-info {
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }

  .tower-id {
    font-size: 0.875rem;
    font-weight: 600;
    color: #f4f4f5;
  }

  .tower-type {
    font-size: 0.75rem;
    color: #a1a1aa;
  }

  .tower-meta {
    display: flex;
    align-items: center;
    gap: 1rem;
    font-size: 0.75rem;
    color: #71717a;
  }

  .provider {
    color: #a1a1aa;
  }

  .coords {
    font-family: monospace;
  }

  .date {
    color: #52525b;
  }
</style>
