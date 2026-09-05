// One-time script to delete ALL existing reports from the database.
// Run with: node clearReports.js
// WARNING: this permanently deletes every report currently saved — use with care.

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

async function clearAllReports() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB, deleting all reports...');

    const result = await Report.deleteMany({});
    console.log(`Deleted ${result.deletedCount} report(s).`);

    await mongoose.disconnect();
    console.log('Done. Database is now empty.');
  } catch (error) {
    console.log('Failed to clear reports:', error.message);
  }
}

clearAllReports();
