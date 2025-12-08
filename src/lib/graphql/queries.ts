import { gql } from "@urql/svelte";

export const DASHBOARD_STATS = gql`
  query DashboardStats {
    towers_aggregate {
      aggregate {
        count
      }
    }
    cells_aggregate {
      aggregate {
        count
      }
    }
    providers_aggregate {
      aggregate {
        count
      }
    }
    tower_bands_aggregate {
      aggregate {
        count
      }
    }
    tower_providers_aggregate {
      aggregate {
        count
      }
    }
    endc_towers: towers_aggregate(where: { endc_available: { _eq: true } }) {
      aggregate {
        count
      }
    }
    multi_provider_towers: towers_aggregate(where: { provider_count: { _gt: 1 } }) {
      aggregate {
        count
      }
    }
  }
`;

// RAT counts now come from tower_providers (one tower can have multiple RATs)
export const TOWERS_BY_RAT = gql`
  query TowersByRAT {
    lte: tower_providers_aggregate(where: { rat: { _eq: "LTE" } }) {
      aggregate {
        count
      }
    }
    nr: tower_providers_aggregate(where: { rat: { _eq: "NR" } }) {
      aggregate {
        count
      }
    }
    gsm: tower_providers_aggregate(where: { rat: { _eq: "GSM" } }) {
      aggregate {
        count
      }
    }
    cdma: tower_providers_aggregate(where: { rat: { _eq: "CDMA" } }) {
      aggregate {
        count
      }
    }
    umts: tower_providers_aggregate(where: { rat: { _eq: "UMTS" } }) {
      aggregate {
        count
      }
    }
  }
`;

export const TOWERS_BY_TYPE = gql`
  query TowersByType {
    macro: towers_aggregate(where: { tower_type: { _eq: "MACRO" } }) {
      aggregate {
        count
      }
    }
    micro: towers_aggregate(where: { tower_type: { _eq: "MICRO" } }) {
      aggregate {
        count
      }
    }
    pico: towers_aggregate(where: { tower_type: { _eq: "PICO" } }) {
      aggregate {
        count
      }
    }
    das: towers_aggregate(where: { tower_type: { _eq: "DAS" } }) {
      aggregate {
        count
      }
    }
    cow: towers_aggregate(where: { tower_type: { _eq: "COW" } }) {
      aggregate {
        count
      }
    }
    decommissioned: towers_aggregate(where: { tower_type: { _eq: "DECOMMISSIONED" } }) {
      aggregate {
        count
      }
    }
  }
`;

// Recent towers with all their providers
export const RECENT_TOWERS = gql`
  query RecentTowers($limit: Int!) {
    towers(
      order_by: { first_seen_at: desc_nulls_last }
      limit: $limit
      where: { first_seen_at: { _is_null: false } }
    ) {
      id
      tower_type
      latitude
      longitude
      first_seen_at
      last_seen_at
      endc_available
      provider_count
      tower_providers(order_by: { last_seen_at: desc_nulls_last }) {
        id
        external_id
        rat
        rat_subtype
        site_id
        region_id
        first_seen_at
        last_seen_at
        endc_available
        provider {
          id
          country_id
          provider_id
          name
        }
      }
      cells_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;

// Providers with tower stats via tower_providers junction table
export const PROVIDERS_WITH_STATS = gql`
  query ProvidersWithStats {
    providers(order_by: { id: asc }) {
      id
      country_id
      provider_id
      name
      visible
      tower_providers_aggregate {
        aggregate {
          count
        }
      }
      lte_tower_providers: tower_providers_aggregate(where: { rat: { _eq: "LTE" } }) {
        aggregate {
          count
        }
      }
      nr_tower_providers: tower_providers_aggregate(where: { rat: { _eq: "NR" } }) {
        aggregate {
          count
        }
      }
    }
  }
`;

export const BAND_DISTRIBUTION = gql`
  query BandDistribution {
    b2: tower_bands_aggregate(where: { band_number: { _eq: 2 } }) {
      aggregate {
        count
      }
    }
    b4: tower_bands_aggregate(where: { band_number: { _eq: 4 } }) {
      aggregate {
        count
      }
    }
    b5: tower_bands_aggregate(where: { band_number: { _eq: 5 } }) {
      aggregate {
        count
      }
    }
    b12: tower_bands_aggregate(where: { band_number: { _eq: 12 } }) {
      aggregate {
        count
      }
    }
    b13: tower_bands_aggregate(where: { band_number: { _eq: 13 } }) {
      aggregate {
        count
      }
    }
    b14: tower_bands_aggregate(where: { band_number: { _eq: 14 } }) {
      aggregate {
        count
      }
    }
    b30: tower_bands_aggregate(where: { band_number: { _eq: 30 } }) {
      aggregate {
        count
      }
    }
  }
`;

// Map query - loads towers within viewport bounds with all their providers
export const TOWERS_IN_BOUNDS = gql`
  query TowersInBounds(
    $minLat: float8!
    $maxLat: float8!
    $minLng: float8!
    $maxLng: float8!
    $limit: Int!
  ) {
    towers(
      where: {
        latitude: { _gte: $minLat, _lte: $maxLat }
        longitude: { _gte: $minLng, _lte: $maxLng }
      }
      limit: $limit
      order_by: { id: asc }
    ) {
      id
      latitude
      longitude
      tower_type
      endc_available
      provider_count
      tower_providers {
        id
        rat
        endc_available
        provider {
          country_id
          provider_id
        }
      }
    }
    towers_aggregate(
      where: {
        latitude: { _gte: $minLat, _lte: $maxLat }
        longitude: { _gte: $minLng, _lte: $maxLng }
      }
    ) {
      aggregate {
        count
      }
    }
  }
`;

// Pre-computed cluster queries using PostGIS ST_SnapToGrid
// Coarse clusters (~100km grid) - for zoom < 6
export const TOWER_CLUSTERS_COARSE = gql`
  query TowerClustersCoarse(
    $minLat: numeric!
    $maxLat: numeric!
    $minLng: numeric!
    $maxLng: numeric!
  ) {
    tower_clusters_coarse(
      where: {
        lat: { _gte: $minLat, _lte: $maxLat }
        lng: { _gte: $minLng, _lte: $maxLng }
      }
    ) {
      lat
      lng
      tower_count
      lte_count
      nr_count
      endc_count
    }
    tower_clusters_coarse_aggregate(
      where: {
        lat: { _gte: $minLat, _lte: $maxLat }
        lng: { _gte: $minLng, _lte: $maxLng }
      }
    ) {
      aggregate {
        sum {
          tower_count
        }
      }
    }
  }
`;

// Medium clusters (~10km grid) - for zoom 6-10
export const TOWER_CLUSTERS_MEDIUM = gql`
  query TowerClustersMedium(
    $minLat: numeric!
    $maxLat: numeric!
    $minLng: numeric!
    $maxLng: numeric!
  ) {
    tower_clusters_medium(
      where: {
        lat: { _gte: $minLat, _lte: $maxLat }
        lng: { _gte: $minLng, _lte: $maxLng }
      }
    ) {
      lat
      lng
      tower_count
      lte_count
      nr_count
      endc_count
    }
    tower_clusters_medium_aggregate(
      where: {
        lat: { _gte: $minLat, _lte: $maxLat }
        lng: { _gte: $minLng, _lte: $maxLng }
      }
    ) {
      aggregate {
        sum {
          tower_count
        }
      }
    }
  }
`;

// Fine clusters (~1km grid) - for zoom 10-13
export const TOWER_CLUSTERS_FINE = gql`
  query TowersClustersFine(
    $minLat: numeric!
    $maxLat: numeric!
    $minLng: numeric!
    $maxLng: numeric!
  ) {
    tower_clusters_fine(
      where: {
        lat: { _gte: $minLat, _lte: $maxLat }
        lng: { _gte: $minLng, _lte: $maxLng }
      }
    ) {
      lat
      lng
      tower_count
      lte_count
      nr_count
      endc_count
    }
    tower_clusters_fine_aggregate(
      where: {
        lat: { _gte: $minLat, _lte: $maxLat }
        lng: { _gte: $minLng, _lte: $maxLng }
      }
    ) {
      aggregate {
        sum {
          tower_count
        }
      }
    }
  }
`;

// Tower growth over time - monthly aggregates
export const TOWER_GROWTH = gql`
  query TowerGrowth {
    y2020: towers_aggregate(where: { first_seen_at: { _gte: "2020-01-01", _lt: "2021-01-01" } }) {
      aggregate { count }
    }
    y2021: towers_aggregate(where: { first_seen_at: { _gte: "2021-01-01", _lt: "2022-01-01" } }) {
      aggregate { count }
    }
    y2022: towers_aggregate(where: { first_seen_at: { _gte: "2022-01-01", _lt: "2023-01-01" } }) {
      aggregate { count }
    }
    y2023: towers_aggregate(where: { first_seen_at: { _gte: "2023-01-01", _lt: "2024-01-01" } }) {
      aggregate { count }
    }
    y2024: towers_aggregate(where: { first_seen_at: { _gte: "2024-01-01", _lt: "2025-01-01" } }) {
      aggregate { count }
    }
    y2025: towers_aggregate(where: { first_seen_at: { _gte: "2025-01-01", _lt: "2026-01-01" } }) {
      aggregate { count }
    }
    before2020: towers_aggregate(where: { first_seen_at: { _lt: "2020-01-01" } }) {
      aggregate { count }
    }
    unknown: towers_aggregate(where: { first_seen_at: { _is_null: true } }) {
      aggregate { count }
    }
  }
`;

// Data freshness - last seen distribution
export const DATA_FRESHNESS = gql`
  query DataFreshness {
    last_24h: towers_aggregate(
      where: { last_seen_at: { _gte: "2025-04-01" } }
    ) {
      aggregate { count }
    }
    last_7d: towers_aggregate(
      where: { last_seen_at: { _gte: "2025-03-25", _lt: "2025-04-01" } }
    ) {
      aggregate { count }
    }
    last_30d: towers_aggregate(
      where: { last_seen_at: { _gte: "2025-03-01", _lt: "2025-03-25" } }
    ) {
      aggregate { count }
    }
    last_90d: towers_aggregate(
      where: { last_seen_at: { _gte: "2025-01-01", _lt: "2025-03-01" } }
    ) {
      aggregate { count }
    }
    last_year: towers_aggregate(
      where: { last_seen_at: { _gte: "2024-04-01", _lt: "2025-01-01" } }
    ) {
      aggregate { count }
    }
    older: towers_aggregate(
      where: { last_seen_at: { _lt: "2024-04-01" } }
    ) {
      aggregate { count }
    }
  }
`;

// Carrier band comparison - now uses tower_providers to find bands by provider
export const CARRIER_BANDS = gql`
  query CarrierBands {
    providers {
      id
      country_id
      provider_id
      name
      b2: tower_bands_aggregate(
        where: { band_number: { _eq: 2 } }
      ) {
        aggregate { count }
      }
      b4: tower_bands_aggregate(
        where: { band_number: { _eq: 4 } }
      ) {
        aggregate { count }
      }
      b12: tower_bands_aggregate(
        where: { band_number: { _eq: 12 } }
      ) {
        aggregate { count }
      }
      b13: tower_bands_aggregate(
        where: { band_number: { _eq: 13 } }
      ) {
        aggregate { count }
      }
      b14: tower_bands_aggregate(
        where: { band_number: { _eq: 14 } }
      ) {
        aggregate { count }
      }
    }
  }
`;

// Signal quality stats
export const SIGNAL_STATS = gql`
  query SignalStats {
    cells_aggregate(where: { signal: { _is_null: false } }) {
      aggregate {
        avg {
          signal
        }
        min {
          signal
        }
        max {
          signal
        }
      }
    }
    speed_stats: cells_aggregate(where: { max_speed_down_mbps: { _is_null: false } }) {
      aggregate {
        avg {
          max_speed_down_mbps
          avg_speed_down_mbps
          max_speed_up_mbps
          avg_speed_up_mbps
        }
        max {
          max_speed_down_mbps
          max_speed_up_mbps
        }
      }
    }
    snr_stats: cells_aggregate(where: {
      lte_snr_max: { _is_null: false, _lt: 100 },
      lte_rsrq_max: { _is_null: false, _gt: -50 }
    }) {
      aggregate {
        avg {
          lte_snr_max
          lte_rsrq_max
        }
      }
    }
  }
`;

// Cells per tower distribution
export const CELLS_PER_TOWER = gql`
  query CellsPerTower {
    single: towers_aggregate(where: { cells_aggregate: { count: { predicate: { _eq: 1 } } } }) {
      aggregate { count }
    }
    two_to_four: towers_aggregate(where: { cells_aggregate: { count: { predicate: { _gte: 2, _lte: 4 } } } }) {
      aggregate { count }
    }
    five_to_ten: towers_aggregate(where: { cells_aggregate: { count: { predicate: { _gte: 5, _lte: 10 } } } }) {
      aggregate { count }
    }
    many: towers_aggregate(where: { cells_aggregate: { count: { predicate: { _gt: 10 } } } }) {
      aggregate { count }
    }
  }
`;

// Get full tower details with all providers, cells, and bands
export const TOWER_DETAILS = gql`
  query TowerDetails($id: Int!) {
    towers_by_pk(id: $id) {
      id
      location_hash
      latitude
      longitude
      tower_type
      first_seen_at
      last_seen_at
      generator
      generator_time
      tower_mover_id
      contributors
      has_bandwidth_data
      has_frequency_data
      endc_available
      provider_count
      visible
      created_at
      tower_providers(order_by: { last_seen_at: desc_nulls_last }) {
        id
        external_id
        rat
        rat_subtype
        site_id
        region_id
        first_seen_at
        last_seen_at
        tower_mover
        has_bandwidth_data
        has_frequency_data
        endc_available
        visible
        provider {
          id
          country_id
          provider_id
          name
        }
      }
      cells(order_by: { last_seen_at: desc_nulls_last }) {
        id
        cell_id
        pci
        sector
        bearing
        bandwidth
        signal
        subsystem
        first_seen_at
        last_seen_at
        lte_snr_max
        lte_rsrq_max
        max_speed_down_mbps
        avg_speed_down_mbps
        max_speed_up_mbps
        avg_speed_up_mbps
        endc_available
        provider {
          id
          country_id
          provider_id
          name
        }
      }
      tower_bands(order_by: { band_number: asc }) {
        id
        band_number
        band_name
        channel
        bandwidth
        modulation
        provider {
          id
          country_id
          provider_id
          name
        }
      }
    }
  }
`;

// Providers per tower distribution
export const PROVIDERS_PER_TOWER = gql`
  query ProvidersPerTower {
    single: towers_aggregate(where: { provider_count: { _eq: 1 } }) {
      aggregate { count }
    }
    two: towers_aggregate(where: { provider_count: { _eq: 2 } }) {
      aggregate { count }
    }
    three: towers_aggregate(where: { provider_count: { _eq: 3 } }) {
      aggregate { count }
    }
    four_plus: towers_aggregate(where: { provider_count: { _gte: 4 } }) {
      aggregate { count }
    }
  }
`;

// Carrier stats with EN-DC and overlap counts
export const CARRIER_STATS = gql`
  query CarrierStats {
    providers {
      id
      country_id
      provider_id
      name
      tower_providers_aggregate {
        aggregate {
          count
        }
      }
      endc_tower_providers: tower_providers_aggregate(where: { endc_available: { _eq: true } }) {
        aggregate {
          count
        }
      }
      lte_tower_providers: tower_providers_aggregate(where: { rat: { _eq: "LTE" } }) {
        aggregate {
          count
        }
      }
      nr_tower_providers: tower_providers_aggregate(where: { rat: { _eq: "NR" } }) {
        aggregate {
          count
        }
      }
    }
    tower_carrier_combinations(order_by: { tower_count: desc }) {
      combination
      tower_count
    }
    towers_aggregate {
      aggregate {
        count
      }
    }
    multi_provider_towers: towers_aggregate(where: { provider_count: { _gt: 1 } }) {
      aggregate {
        count
      }
    }
  }
`;

// Network insights - cell density and performance data
export const NETWORK_INSIGHTS = gql`
  query NetworkInsights {
    providers {
      id
      country_id
      provider_id
      name
      cells_aggregate {
        aggregate {
          count
        }
      }
      cells_with_speed: cells_aggregate(where: { max_speed_down_mbps: { _is_null: false, _gt: 0 } }) {
        aggregate {
          count
          avg {
            max_speed_down_mbps
          }
          max {
            max_speed_down_mbps
          }
        }
      }
      cells_with_snr: cells_aggregate(where: { lte_snr_max: { _is_null: false, _lt: 100 } }) {
        aggregate {
          count
          avg {
            lte_snr_max
          }
        }
      }
    }
    cells_aggregate {
      aggregate {
        count
      }
    }
    cells_with_speed_total: cells_aggregate(where: { max_speed_down_mbps: { _is_null: false, _gt: 0 } }) {
      aggregate {
        count
      }
    }
    cells_with_signal_total: cells_aggregate(where: { lte_snr_max: { _is_null: false } }) {
      aggregate {
        count
      }
    }
    # Top bands by deployment count
    b2: tower_bands_aggregate(where: { band_number: { _eq: 2 } }) { aggregate { count } }
    b4: tower_bands_aggregate(where: { band_number: { _eq: 4 } }) { aggregate { count } }
    b5: tower_bands_aggregate(where: { band_number: { _eq: 5 } }) { aggregate { count } }
    b12: tower_bands_aggregate(where: { band_number: { _eq: 12 } }) { aggregate { count } }
    b13: tower_bands_aggregate(where: { band_number: { _eq: 13 } }) { aggregate { count } }
    b14: tower_bands_aggregate(where: { band_number: { _eq: 14 } }) { aggregate { count } }
    b30: tower_bands_aggregate(where: { band_number: { _eq: 30 } }) { aggregate { count } }
    b41: tower_bands_aggregate(where: { band_number: { _eq: 41 } }) { aggregate { count } }
    b66: tower_bands_aggregate(where: { band_number: { _eq: 66 } }) { aggregate { count } }
    b71: tower_bands_aggregate(where: { band_number: { _eq: 71 } }) { aggregate { count } }
  }
`;

// Multi-provider towers - towers with more than one carrier
export const MULTI_PROVIDER_TOWERS = gql`
  query MultiProviderTowers($limit: Int!) {
    towers(
      where: { provider_count: { _gt: 1 } }
      order_by: { provider_count: desc }
      limit: $limit
    ) {
      id
      latitude
      longitude
      tower_type
      provider_count
      endc_available
      first_seen_at
      last_seen_at
      tower_providers {
        id
        rat
        provider {
          id
          country_id
          provider_id
          name
        }
      }
    }
  }
`;
