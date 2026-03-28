/**
 * Logic for Pillar 1.1 / Return to Home routing.
 * Helps drivers find loads that lead back to their home base.
 */
export const isHeadingHome = (shipment, homeCity) => {
  if (!shipment || !homeCity) return false;
  
  const dropAddress = shipment.drop_address?.toLowerCase() || '';
  const home = homeCity.toLowerCase();
  
  // Basic string matching for demonstration. 
  // In production, this would use PostGIS distance calculation:
  // ST_Distance(shipment.drop_location, home_base_location) < 100km
  return dropAddress.includes(home);
};

export const getHomePriorityScore = (shipment, homeCity) => {
  return isHeadingHome(shipment, homeCity) ? 1.5 : 1.0;
};
