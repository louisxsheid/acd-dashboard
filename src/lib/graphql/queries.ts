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
    endc_towers: towers_aggregate(where: { endc_available: { _eq: true } }) {
      aggregate {
        count
      }
    }
  }
`;

export const TOWERS_BY_RAT = gql`
  query TowersByRAT {
    lte: towers_aggregate(where: { rat: { _eq: "LTE" } }) {
      aggregate {
        count
      }
    }
    nr: towers_aggregate(where: { rat: { _eq: "NR" } }) {
      aggregate {
        count
      }
    }
    gsm: towers_aggregate(where: { rat: { _eq: "GSM" } }) {
      aggregate {
        count
      }
    }
    cdma: towers_aggregate(where: { rat: { _eq: "CDMA" } }) {
      aggregate {
        count
      }
    }
    umts: towers_aggregate(where: { rat: { _eq: "UMTS" } }) {
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

export const RECENT_TOWERS = gql`
  query RecentTowers($limit: Int!) {
    towers(
      order_by: { first_seen_at: desc_nulls_last }
      limit: $limit
      where: { first_seen_at: { _is_null: false } }
    ) {
      id
      external_id
      rat
      tower_type
      latitude
      longitude
      first_seen_at
      last_seen_at
      endc_available
      provider {
        country_id
        provider_id
      }
      cells_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;

export const PROVIDERS_WITH_STATS = gql`
  query ProvidersWithStats {
    providers(order_by: { id: asc }) {
      id
      country_id
      provider_id
      name
      visible
      towers_aggregate {
        aggregate {
          count
        }
      }
      lte_towers: towers_aggregate(where: { rat: { _eq: "LTE" } }) {
        aggregate {
          count
        }
      }
      nr_towers: towers_aggregate(where: { rat: { _eq: "NR" } }) {
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

// Map query - loads towers within viewport bounds
export const TOWERS_IN_BOUNDS = gql`
  query TowersInBounds(
    $minLat: float8!
    $maxLat: float8!
    $minLng: float8!
    $maxLng: float8!
    $limit: Int!
    $rat: String
    $provider_id: Int
  ) {
    towers(
      where: {
        latitude: { _gte: $minLat, _lte: $maxLat }
        longitude: { _gte: $minLng, _lte: $maxLng }
        rat: { _eq: $rat }
        provider_id: { _eq: $provider_id }
      }
      limit: $limit
      order_by: { id: asc }
    ) {
      id
      latitude
      longitude
      rat
      tower_type
      endc_available
      provider {
        country_id
        provider_id
      }
    }
    towers_aggregate(
      where: {
        latitude: { _gte: $minLat, _lte: $maxLat }
        longitude: { _gte: $minLng, _lte: $maxLng }
        rat: { _eq: $rat }
        provider_id: { _eq: $provider_id }
      }
    ) {
      aggregate {
        count
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

// Carrier band comparison
export const CARRIER_BANDS = gql`
  query CarrierBands {
    providers {
      id
      country_id
      provider_id
      b2: towers_aggregate(
        where: { tower_bands: { band_number: { _eq: 2 } } }
      ) {
        aggregate { count }
      }
      b4: towers_aggregate(
        where: { tower_bands: { band_number: { _eq: 4 } } }
      ) {
        aggregate { count }
      }
      b12: towers_aggregate(
        where: { tower_bands: { band_number: { _eq: 12 } } }
      ) {
        aggregate { count }
      }
      b13: towers_aggregate(
        where: { tower_bands: { band_number: { _eq: 13 } } }
      ) {
        aggregate { count }
      }
      b14: towers_aggregate(
        where: { tower_bands: { band_number: { _eq: 14 } } }
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
    snr_stats: cells_aggregate(where: { lte_snr_max: { _is_null: false } }) {
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
