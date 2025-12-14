import ngeohash from 'ngeohash';

/**
 * Encode latitude and longitude to a geohash
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {number} precision - Geohash precision (default 7)
 * @returns {string} Geohash string
 */
export function encodeGeohash(latitude, longitude, precision = 7) {
    if (!latitude || !longitude) return null;
    return ngeohash.encode(latitude, longitude, precision);
}

/**
 * Decode a geohash to latitude and longitude
 * @param {string} hash 
 * @returns {object} { latitude, longitude }
 */
export function decodeGeohash(hash) {
    const decoded = ngeohash.decode(hash);
    return {
        latitude: decoded.latitude,
        longitude: decoded.longitude
    };
}

/**
 * Get all neighboring geohashes including the center
 * This handles edge cases where nearby locations may have different geohash prefixes
 * @param {string} hash 
 * @returns {string[]} Array of 9 geohashes (center + 8 neighbors)
 */
export function getNeighborsWithCenter(hash) {
    const neighbors = ngeohash.neighbors(hash);
    return [hash, ...Object.values(neighbors)];
}

/**
 * Calculate distance between two coordinates in miles
 * Uses Haversine formula
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in miles
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Get geohash precision based on search radius
 * @param {number} radiusMiles 
 * @returns {number} Geohash precision
 */
export function getPrecisionForRadius(radiusMiles) {
    // Approximate geohash precision to radius mapping
    if (radiusMiles <= 0.5) return 8;   // ~38m x 19m
    if (radiusMiles <= 2) return 7;     // ~153m x 153m
    if (radiusMiles <= 5) return 6;     // ~1.2km x 609m
    if (radiusMiles <= 20) return 5;    // ~4.9km x 4.9km
    if (radiusMiles <= 80) return 4;    // ~39km x 19.5km
    return 3;                            // ~156km x 156km
}

/**
 * Get all geohashes within a radius from a center point
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {number} radiusMiles 
 * @returns {string[]} Array of geohash prefixes to search
 */
export function getGeohashesInRadius(latitude, longitude, radiusMiles) {
    const precision = getPrecisionForRadius(radiusMiles);
    const centerHash = encodeGeohash(latitude, longitude, precision);

    // Get center and all 8 neighbors to handle edge cases
    return getNeighborsWithCenter(centerHash);
}
