<script lang="ts">
  interface Filters {
    rat: string[];
    endc: boolean | null;
  }

  interface Props {
    filters: Filters;
    onFilterChange: (filters: Filters) => void;
    totalCount: number;
    filteredCount: number;
  }

  let { filters, onFilterChange, totalCount, filteredCount }: Props = $props();

  const RAT_OPTIONS = [
    { value: "LTE", label: "LTE", color: "#3b82f6" },
    { value: "NR", label: "5G NR", color: "#8b5cf6" },
    { value: "UMTS", label: "UMTS", color: "#ec4899" },
    { value: "CDMA", label: "CDMA", color: "#f59e0b" },
    { value: "GSM", label: "GSM", color: "#22c55e" },
  ];

  const ENDC_OPTIONS = [
    { value: null, label: "All" },
    { value: true, label: "EN-DC Only" },
    { value: false, label: "Non EN-DC" },
  ];

  function toggleRAT(rat: string) {
    const newRAT = filters.rat.includes(rat)
      ? filters.rat.filter(r => r !== rat)
      : [...filters.rat, rat];
    onFilterChange({ ...filters, rat: newRAT });
  }

  function setENDC(value: boolean | null) {
    onFilterChange({ ...filters, endc: value });
  }

  function clearFilters() {
    onFilterChange({ rat: [], endc: null });
  }

  let hasFilters = $derived(filters.rat.length > 0 || filters.endc !== null);
</script>

<div class="filters">
  <div class="filter-section">
    <div class="filter-label">Technology</div>
    <div class="filter-chips">
      {#each RAT_OPTIONS as opt}
        <button
          class="chip"
          class:active={filters.rat.length === 0 || filters.rat.includes(opt.value)}
          class:inactive={filters.rat.length > 0 && !filters.rat.includes(opt.value)}
          style="--chip-color: {opt.color}"
          onclick={() => toggleRAT(opt.value)}
        >
          <span class="chip-dot" style="background: {opt.color}"></span>
          {opt.label}
        </button>
      {/each}
    </div>
  </div>

  <div class="filter-section">
    <div class="filter-label">EN-DC</div>
    <div class="filter-chips">
      {#each ENDC_OPTIONS as opt}
        <button
          class="chip"
          class:active={filters.endc === opt.value}
          onclick={() => setENDC(opt.value)}
        >
          {opt.label}
        </button>
      {/each}
    </div>
  </div>

  {#if hasFilters}
    <div class="filter-actions">
      <button class="clear-btn" onclick={clearFilters}>
        Clear filters
      </button>
      <span class="filter-count">
        {filteredCount.toLocaleString()} / {totalCount.toLocaleString()}
      </span>
    </div>
  {/if}
</div>

<style>
  .filters {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    padding: 1rem 1.5rem;
    background: #1e1e2e;
    border-radius: 12px;
    align-items: flex-start;
  }

  .filter-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #71717a;
  }

  .filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.375rem;
  }

  .chip {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.375rem 0.625rem;
    border: 1px solid #27273a;
    border-radius: 6px;
    background: #27273a;
    color: #a1a1aa;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .chip:hover {
    border-color: #3b82f6;
    color: #f4f4f5;
  }

  .chip.active {
    background: rgba(59, 130, 246, 0.15);
    border-color: #3b82f6;
    color: #f4f4f5;
  }

  .chip.inactive {
    opacity: 0.5;
  }

  .chip-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .filter-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-left: auto;
  }

  .clear-btn {
    padding: 0.375rem 0.75rem;
    border: 1px solid #ef4444;
    border-radius: 6px;
    background: transparent;
    color: #ef4444;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .clear-btn:hover {
    background: rgba(239, 68, 68, 0.15);
  }

  .filter-count {
    font-size: 0.75rem;
    color: #71717a;
    font-variant-numeric: tabular-nums;
  }
</style>
