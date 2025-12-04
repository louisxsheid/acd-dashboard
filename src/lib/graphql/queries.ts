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
    towers(distinct_on: tower_type) {
      tower_type
    }
    macro: towers_aggregate(where: { tower_type: { _eq: "MACRO" } }) {
      aggregate {
        count
      }
    }
    small: towers_aggregate(where: { tower_type: { _eq: "SMALL_CELL" } }) {
      aggregate {
        count
      }
    }
    indoor: towers_aggregate(where: { tower_type: { _eq: "INDOOR" } }) {
      aggregate {
        count
      }
    }
  }
`;

export const RECENT_TOWERS = gql`
  query RecentTowers($limit: Int!) {
    towers(order_by: { last_seen_at: desc_nulls_last }, limit: $limit) {
      id
      external_id
      rat
      tower_type
      latitude
      longitude
      last_seen_at
      provider {
        name
        country_id
        provider_id
      }
    }
  }
`;

export const PROVIDERS_LIST = gql`
  query ProvidersList {
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
    }
  }
`;

export const TOP_BANDS = gql`
  query TopBands {
    tower_bands(distinct_on: band_number, order_by: { band_number: asc }) {
      band_number
      band_name
    }
  }
`;

export const BAND_DISTRIBUTION = gql`
  query BandDistribution {
    b2: tower_bands_aggregate(where: { band_number: { _eq: 2 } }) {
      aggregate { count }
    }
    b4: tower_bands_aggregate(where: { band_number: { _eq: 4 } }) {
      aggregate { count }
    }
    b7: tower_bands_aggregate(where: { band_number: { _eq: 7 } }) {
      aggregate { count }
    }
    b12: tower_bands_aggregate(where: { band_number: { _eq: 12 } }) {
      aggregate { count }
    }
    b13: tower_bands_aggregate(where: { band_number: { _eq: 13 } }) {
      aggregate { count }
    }
    b14: tower_bands_aggregate(where: { band_number: { _eq: 14 } }) {
      aggregate { count }
    }
    b25: tower_bands_aggregate(where: { band_number: { _eq: 25 } }) {
      aggregate { count }
    }
    b26: tower_bands_aggregate(where: { band_number: { _eq: 26 } }) {
      aggregate { count }
    }
    b30: tower_bands_aggregate(where: { band_number: { _eq: 30 } }) {
      aggregate { count }
    }
    b41: tower_bands_aggregate(where: { band_number: { _eq: 41 } }) {
      aggregate { count }
    }
    b66: tower_bands_aggregate(where: { band_number: { _eq: 66 } }) {
      aggregate { count }
    }
    b71: tower_bands_aggregate(where: { band_number: { _eq: 71 } }) {
      aggregate { count }
    }
    n41: tower_bands_aggregate(where: { band_number: { _eq: 41 } }) {
      aggregate { count }
    }
    n71: tower_bands_aggregate(where: { band_number: { _eq: 71 } }) {
      aggregate { count }
    }
    n77: tower_bands_aggregate(where: { band_number: { _eq: 77 } }) {
      aggregate { count }
    }
    n78: tower_bands_aggregate(where: { band_number: { _eq: 78 } }) {
      aggregate { count }
    }
  }
`;
