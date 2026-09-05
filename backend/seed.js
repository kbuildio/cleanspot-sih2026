// This is a one-time script to fill your database with realistic test data.
// Run it once with: node seed.js
// It does NOT run as part of your actual server — it's just a testing helper.

require('dotenv').config();
const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  description: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  photoUrl: { type: String, default: null },
  resolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);

// Base location — same one your map is centered on. Change if you used a different city.
const BASE_LAT = 26.8467;
const BASE_LNG = 80.9462;

// Small helper: nudges a coordinate slightly, to simulate nearby-but-not-identical spots.
// ~0.0004 degrees is roughly 40-50 meters — close enough to fall inside your grouping radius.
function nudge(value, amount) {
  return value + amount;
}

const sampleReports = [
  // --- HOTSPOT 1: Market area — 5 tightly clustered, unresolved reports (should show RED, fairly dark) ---
  { description: 'Overflowing garbage bin near vegetable market', lat: BASE_LAT, lng: BASE_LNG, resolved: false },
  { description: 'Litter scattered outside market entrance', lat: nudge(BASE_LAT, 0.0002), lng: nudge(BASE_LNG, 0.0001), resolved: false },
  { description: 'Rotting food waste smell near market', lat: nudge(BASE_LAT, -0.0001), lng: nudge(BASE_LNG, 0.0002), resolved: false },
  { description: 'Plastic waste piling up behind stalls', lat: nudge(BASE_LAT, 0.0001), lng: nudge(BASE_LNG, -0.0002), resolved: false },
  { description: 'Stray animals rummaging through garbage', lat: nudge(BASE_LAT, -0.0002), lng: nudge(BASE_LNG, -0.0001), resolved: false },

  // --- HOTSPOT 2: Park area — 2 reports, one resolved (should show YELLOW, since 1 unresolved) ---
  { description: 'Litter near park benches', lat: nudge(BASE_LAT, 0.01), lng: nudge(BASE_LNG, 0.01), resolved: false },
  { description: 'Overflowing dustbin at park entrance', lat: nudge(BASE_LAT, 0.0101), lng: nudge(BASE_LNG, 0.0102), resolved: true },

  // --- HOTSPOT 3: Bus stop area — fully resolved (should show GREEN) ---
  { description: 'Garbage pile near bus stop, since cleared', lat: nudge(BASE_LAT, -0.01), lng: nudge(BASE_LNG, 0.008), resolved: true },
  { description: 'Litter near bus stop bench', lat: nudge(BASE_LAT, -0.0098), lng: nudge(BASE_LNG, 0.0081), resolved: true },

  // --- Isolated single reports, spread further out (should each show YELLOW) ---
  { description: 'Garbage dumped near residential gate', lat: nudge(BASE_LAT, 0.02), lng: nudge(BASE_LNG, -0.015), resolved: false },
  { description: 'Overflowing bin outside school', lat: nudge(BASE_LAT, -0.018), lng: nudge(BASE_LNG, -0.02), resolved: false },
  { description: 'Litter along roadside near temple', lat: nudge(BASE_LAT, 0.015), lng: nudge(BASE_LNG, 0.02), resolved: false }
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB, seeding data...');

    await Report.insertMany(sampleReports);
    console.log(`Successfully added ${sampleReports.length} test reports!`);

    await mongoose.disconnect();
    console.log('Done. You can now refresh your CleanSpot map to see the test data.');
  } catch (error) {
    console.log('Seeding failed:', error.message);
  }
}

seedDatabase();
