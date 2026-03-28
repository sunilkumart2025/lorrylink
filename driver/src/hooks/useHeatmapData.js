import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

/**
 * Fetch shipment density to populate the Pillar 4.3 Heatmap.
 * Aggregates by pickup city to find "Hot Zones".
 */
export const useHeatmapData = () => {
  return useQuery({
    queryKey: ['heatmap-data'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shipments')
        .select('*');

      if (error) {
        console.warn("Heatmap fetch error:", error);
        return []; 
      }

      // Helper to parse PostGIS WKT "POINT(lng lat)"
      const parseWKT = (wkt) => {
        if (!wkt || typeof wkt !== 'string') return null;
        const match = wkt.match(/POINT\(([^ ]+)\s+([^)]+)\)/);
        return match ? [parseFloat(match[2]), parseFloat(match[1])] : null; 
      };

      // Aggregate density by City (inferred from pickup_address)
      const densityMap = data.reduce((acc, shipment) => {
        const city = shipment.pickup_address?.split(',')[0] || 'Other';
        if (!acc[city]) {
          acc[city] = { count: 0, avgRate: 0, pos: parseWKT(shipment.pickup_location) };
        }
        acc[city].count += 1;
        acc[city].avgRate += (shipment.price || 0);
        return acc;
      }, {});

      return Object.keys(densityMap).map(city => ({
        city: city,
        count: densityMap[city].count,
        avgRate: densityMap[city].avgRate / densityMap[city].count,
        position: densityMap[city].pos || getCityCoords(city), 
        tier: getDemandTier(densityMap[city].count)
      }));
    }
  });
};

/**
 * Color-coding logic from Pillar 4.3:
 * 🔴 Hot (> 5 loads)
 * 🟡 Moderate (2-5 loads)
 * 🔵 Cold (1 load)
 */
const getDemandTier = (count) => {
  if (count >= 5) return 'HOT';
  if (count >= 2) return 'MODERATE';
  return 'COLD';
};

/**
 * Fallback Mock Heatmap
 */
const generateMockHeatmap = () => [
  { city: 'Mumbai', count: 12, avgRate: 62000, position: [19.0760, 72.8777], tier: 'HOT' },
  { city: 'Pune', count: 8, avgRate: 48000, position: [18.5204, 73.8567], tier: 'HOT' },
  { city: 'Chennai', count: 4, avgRate: 54000, position: [13.0827, 80.2707], tier: 'MODERATE' },
  { city: 'Nagpur', count: 3, avgRate: 38000, position: [21.1458, 79.0882], tier: 'MODERATE' },
  { city: 'Delhi', count: 9, avgRate: 68000, position: [28.6139, 77.2090], tier: 'HOT' },
  { city: 'Hyderabad', count: 1, avgRate: 41000, position: [17.3850, 78.4867], tier: 'COLD' }
];

const getCityCoords = (city) => {
  const map = {
    'Mumbai': [19.0760, 72.8777],
    'Pune': [18.5204, 73.8567],
    'Chennai': [13.0827, 80.2707],
    'Nagpur': [21.1458, 79.0882],
    'Delhi': [28.6139, 77.2090],
    'Hyderabad': [17.3850, 78.4867]
  };
  return map[city] || [20.5937, 78.9629];
};
