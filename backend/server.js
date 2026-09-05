require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch((error) => console.log('Failed to connect to MongoDB:', error.message));

const reportSchema = new mongoose.Schema({
  description: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  photoUrl: { type: String, default: null },
  resolved: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.model('Report', reportSchema);

app.post('/reports', async (req, res) => {
  try {
    const { description, lat, lng, photoUrl } = req.body;
    const newReport = new Report({ description, lat, lng, photoUrl });
    await newReport.save();
    res.status(201).json(newReport);
  } catch (error) {
    res.status(500).json({ error: 'Failed to save report' });
  }
});

app.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find();
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// --- NEW: figure out how far apart two points are, in meters ---
// This uses the "Haversine formula" — the standard way to measure
// distance between two lat/lng points on a curved surface (the Earth).
function distanceInMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- NEW: group nearby reports into "areas", and give each one a status ---
const GROUPING_RADIUS_METERS = 50;

function groupReportsIntoAreas(reports) {
  const areas = [];       // will hold our final grouped areas
  const visited = new Set();  // tracks which reports we've already placed in a group

  reports.forEach((report, index) => {
    if (visited.has(index)) return;  // already grouped, skip

    // Start a new area with this report
    const group = [report];
    visited.add(index);

    // Check every other report — if it's close enough, add it to this group
    reports.forEach((other, otherIndex) => {
      if (visited.has(otherIndex)) return;

      const distance = distanceInMeters(report.lat, report.lng, other.lat, other.lng);
      if (distance <= GROUPING_RADIUS_METERS) {
        group.push(other);
        visited.add(otherIndex);
      }
    });

    // Find the average location of the group, so we know where to draw its circle
    const avgLat = group.reduce((sum, r) => sum + r.lat, 0) / group.length;
    const avgLng = group.reduce((sum, r) => sum + r.lng, 0) / group.length;

    // Count how many reports in this group are still unresolved
    const unresolvedCount = group.filter((r) => !r.resolved).length;

    // If every report in the group has been resolved, the area is GREEN.
    // Otherwise, status depends on how many are still unresolved.
    let status = 'GREEN';
    if (unresolvedCount === 1 || unresolvedCount === 2) status = 'YELLOW';
    if (unresolvedCount >= 3) status = 'RED';

    areas.push({
      lat: avgLat,
      lng: avgLng,
      count: group.length,
      unresolvedCount: unresolvedCount,
      status: status
    });
  });

  return areas;
}

// --- NEW: mark a specific report as resolved ---
app.patch('/reports/:id/resolve', async (req, res) => {
  try {
    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      { resolved: true },
      { new: true }  // return the updated version, not the old one
    );
    res.json(updatedReport);
  } catch (error) {
    res.status(500).json({ error: 'Failed to resolve report' });
  }
});

app.get('/status', async (req, res) => {
  try {
    // Fetch ALL reports (resolved and unresolved), so fully-resolved
    // areas can show GREEN instead of just disappearing entirely.
    const reports = await Report.find({});
    const areas = groupReportsIntoAreas(reports);
    res.json(areas);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate status' });
  }
});

app.get('/', (req, res) => {
  res.send('CleanSpot backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
