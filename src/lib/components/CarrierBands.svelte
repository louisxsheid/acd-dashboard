<script lang="ts">
  import { getCarrierName, getCarrierColor } from "../carriers";

  interface CarrierBandData {
    country_id: number;
    provider_id: number;
    b2: number;
    b4: number;
    b12: number;
    b13: number;
    b14: number;
  }

  interface Props {
    carriers: CarrierBandData[];
  }

  let { carriers }: Props = $props();

  const bands = [
    { key: "b2", name: "B2", fullName: "PCS" },
    { key: "b4", name: "B4", fullName: "AWS" },
    { key: "b12", name: "B12", fullName: "SMH" },
    { key: "b13", name: "B13", fullName: "Verizon" },
    { key: "b14", name: "B14", fullName: "FirstNet" },
  ] as const;

  let sortedCarriers = $derived(
    [...carriers]
      .map((c) => ({
        ...c,
        name: getCarrierName(c.country_id, c.provider_id),
        color: getCarrierColor(c.country_id, c.provider_id),
        total: c.b2 + c.b4 + c.b12 + c.b13 + c.b14,
      }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6)
  );

  let maxValue = $derived(
    Math.max(
      ...sortedCarriers.flatMap((c) => [c.b2, c.b4, c.b12, c.b13, c.b14]),
      1
    )
  );
</script>

<div class="carrier-bands">
  <h3>Band Deployment by Carrier</h3>

  <div class="table-wrapper">
    <table>
      <thead>
        <tr>
          <th>Carrier</th>
          {#each bands as band}
            <th class="band-header">
              <span class="band-name">{band.name}</span>
              <span class="band-full">{band.fullName}</span>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each sortedCarriers as carrier}
          <tr>
            <td class="carrier-name">
              <span class="carrier-dot" style="background: {carrier.color}"></span>
              {carrier.name}
            </td>
            {#each bands as band}
              {@const value = carrier[band.key]}
              {@const percentage = (value / maxValue) * 100}
              <td class="band-cell">
                <div class="band-bar-container">
                  <div
                    class="band-bar"
                    style="width: {percentage}%; background: {carrier.color}"
                  ></div>
                </div>
                <span class="band-value">{value > 0 ? value.toLocaleString() : "—"}</span>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<style>
  .carrier-bands {
    background: #1e1e2e;
    border-radius: 12px;
    padding: 1.5rem;
  }

  h3 {
    margin: 0 0 1.25rem;
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
    padding: 0.75rem 0.5rem;
    font-size: 0.7rem;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid #27273a;
  }

  .band-header {
    text-align: center;
    min-width: 80px;
  }

  .band-name {
    display: block;
    font-weight: 700;
    color: #a1a1aa;
  }

  .band-full {
    display: block;
    font-size: 0.65rem;
    font-weight: 400;
    color: #52525b;
  }

  td {
    padding: 0.75rem 0.5rem;
    border-bottom: 1px solid #27273a;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr:hover td {
    background: #27273a;
  }

  .carrier-name {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-weight: 500;
    color: #f4f4f5;
    white-space: nowrap;
  }

  .carrier-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .band-cell {
    text-align: center;
  }

  .band-bar-container {
    height: 8px;
    background: #27273a;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.25rem;
  }

  .band-bar {
    height: 100%;
    border-radius: 4px;
    transition: width 0.5s ease-out;
  }

  .band-value {
    font-size: 0.75rem;
    color: #a1a1aa;
    font-variant-numeric: tabular-nums;
  }
</style>
