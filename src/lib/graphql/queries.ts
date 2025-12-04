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

export const CELLS_BY_SUBSYSTEM = gql`
  query CellsBySubsystem {
    lte: cells_aggregate(where: { subsystem: { _eq: "LTE" } }) {
      aggregate {
        count
      }
    }
    lte_a: cells_aggregate(where: { subsystem: { _eq: "LTE-A" } }) {
      aggregate {
        count
      }
    }
    unknown: cells_aggregate(where: { subsystem: { _is_null: true } }) {
      aggregate {
        count
      }
    }
  }
`;

export const TOWER_ACTIVITY = gql`
  query TowerActivity {
    last_24h: towers_aggregate(
      where: { last_seen_at: { _gte: "now() - interval '24 hours'" } }
    ) {
      aggregate {
        count
      }
    }
    last_7d: towers_aggregate(
      where: { last_seen_at: { _gte: "now() - interval '7 days'" } }
    ) {
      aggregate {
        count
      }
    }
    last_30d: towers_aggregate(
      where: { last_seen_at: { _gte: "now() - interval '30 days'" } }
    ) {
      aggregate {
        count
      }
    }
    last_year: towers_aggregate(
      where: { last_seen_at: { _gte: "now() - interval '1 year'" } }
    ) {
      aggregate {
        count
      }
    }
  }
`;
