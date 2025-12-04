<script lang="ts">
  interface Provider {
    id: number;
    country_id: number;
    provider_id: number;
    name: string | null;
    visible: boolean;
    towers_aggregate: {
      aggregate: {
        count: number;
      };
    };
  }

  interface Props {
    providers: Provider[];
  }

  let { providers }: Props = $props();
</script>

<div class="providers-table">
  <h3>Providers</h3>
  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Country</th>
          <th>Towers</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {#each providers as provider}
          <tr>
            <td class="id">{provider.provider_id}</td>
            <td class="name">{provider.name || "Unknown"}</td>
            <td class="country">{provider.country_id}</td>
            <td class="towers">{provider.towers_aggregate.aggregate.count.toLocaleString()}</td>
            <td>
              <span class="status" class:visible={provider.visible}>
                {provider.visible ? "Visible" : "Hidden"}
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .providers-table {
    background: #1e1e2e;
    border-radius: 12px;
    padding: 1.5rem;
    overflow: hidden;
  }

  h3 {
    margin: 0 0 1rem;
    font-size: 1rem;
    color: #f4f4f5;
    font-weight: 600;
  }

  .table-wrapper {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    text-align: left;
    padding: 0.75rem;
    font-size: 0.75rem;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #27273a;
  }

  td {
    padding: 0.75rem;
    font-size: 0.875rem;
    color: #e4e4e7;
    border-bottom: 1px solid #27273a;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background: #27273a;
  }

  .id {
    font-family: monospace;
    color: #a1a1aa;
  }

  .name {
    font-weight: 500;
  }

  .towers {
    font-weight: 600;
    color: #3b82f6;
  }

  .status {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 500;
    background: #27273a;
    color: #71717a;
  }

  .status.visible {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }
</style>
