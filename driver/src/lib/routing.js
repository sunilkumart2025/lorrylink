/**
 * Calculate the net gain of taking a detour for a partial load.
 * Pillar 4.4 - Detour Value Calculator
 */
export const calculateDetourValue = (directKm, detourKm, loadEarning, dieselRate = 95, mileage = 4) => {
  const extraKm = detourKm - directKm;
  const dieselCostPerKm = dieselRate / mileage; // e.g. 95 / 4 = 23.75 INR/km
  const extraDieselCost = extraKm * dieselCostPerKm;
  const netGain = loadEarning - extraDieselCost;
  
  return {
    extraKm,
    extraDieselCost,
    netGain,
    isWorthIt: netGain > 5000 // Threshold from Pillar 4.4
  };
};

/**
 * Algorithm for Pillar 4.2 - Multi-Leg Combo Trips
 * Identifies pairs of shipments that can be chained together.
 */
export const findShipmentChains = (shipments, driverOrigin) => {
  const combos = [];
  
  // 1. Find potential first legs (starting from driver's origin or current location)
  const firstLegs = shipments.filter(s => s.status === 'pending');

  firstLegs.forEach(s1 => {
    // 2. Find potential second legs that start where the first one ends
    const secondLegs = shipments.filter(s2 => 
      s2.id !== s1.id && 
      s2.status === 'pending' &&
      s2.pickup_location === s1.drop_location
    );

    secondLegs.forEach(s2 => {
      const totalEarning = (s1.rate_per_ton * s1.tonnage) + (s2.rate_per_ton * s2.tonnage);
      
      combos.push({
        id: `combo-${s1.id}-${s2.id}`,
        legs: [
          { id: s1.id, from: s1.pickup_location, to: s1.drop_location, earning: s1.rate_per_ton * s1.tonnage, km: 800 }, // KM would normally come from Map API
          { id: s2.id, from: s2.pickup_location, to: s2.drop_location, earning: s2.rate_per_ton * s2.tonnage, km: 600 }
        ],
        totalEarning,
        efficiency: totalEarning > 50000 ? 'Ultra-High' : 'Premium'
      });
    });
  });

  return combos.sort((a, b) => b.totalEarning - a.totalEarning);
};
