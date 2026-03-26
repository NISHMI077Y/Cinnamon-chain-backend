const User = require('../models/User');

const findNearbyPeelers = async (lat, lng, radius) => {
  const peelers = await User.find({
    role: 'PEELER',
    status: 'ACTIVE',
    is_available: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: radius,
      },
    },
  })
    .select('display_name full_name reputation_score avatar_url location')
    .limit(50)
    .lean();

  // Calculate distance and weighted score
  return peelers.map((p) => {
    const [pLng, pLat] = p.location.coordinates;
    const distance_m = haversine(lat, lng, pLat, pLng);
    const maxDist = radius;
    const proximity_score = Math.max(0, 1 - distance_m / maxDist);
    const reputation_score = (p.reputation_score || 0) / 5;
    const weighted_score = 0.6 * proximity_score + 0.4 * reputation_score;

    return {
      user_id: p._id,
      display_name: p.display_name || p.full_name,
      reputation_score: p.reputation_score || 0,
      distance_m: Math.round(distance_m),
      avatar_url: p.avatar_url,
      weighted_score,
    };
  }).sort((a, b) => b.weighted_score - a.weighted_score);
};

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = { findNearbyPeelers };