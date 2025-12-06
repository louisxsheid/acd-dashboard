-- Function to get clustered tower data for map visualization
-- Groups towers into grid cells based on precision parameter

CREATE OR REPLACE FUNCTION get_tower_clusters(
  min_lat float8,
  max_lat float8,
  min_lng float8,
  max_lng float8,
  grid_precision int DEFAULT 2  -- decimal places for grid (2 = ~1km, 1 = ~10km, 0 = ~100km)
)
RETURNS TABLE (
  grid_lat float8,
  grid_lng float8,
  tower_count bigint,
  lte_count bigint,
  nr_count bigint,
  endc_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROUND(latitude::numeric, grid_precision)::float8 as grid_lat,
    ROUND(longitude::numeric, grid_precision)::float8 as grid_lng,
    COUNT(*)::bigint as tower_count,
    COUNT(*) FILTER (WHERE rat = 'LTE')::bigint as lte_count,
    COUNT(*) FILTER (WHERE rat = 'NR')::bigint as nr_count,
    COUNT(*) FILTER (WHERE endc_available = true)::bigint as endc_count
  FROM towers
  WHERE
    latitude >= min_lat AND latitude <= max_lat
    AND longitude >= min_lng AND longitude <= max_lng
  GROUP BY
    ROUND(latitude::numeric, grid_precision),
    ROUND(longitude::numeric, grid_precision);
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_tower_clusters TO PUBLIC;
