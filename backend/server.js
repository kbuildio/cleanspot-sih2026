require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(express.json());   // lets the server understand JSON sent to it
app.use(cors());           // allows the frontend (different address) to talk to this server

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully!');
  })
  .catch((error) => {
    console.log('Failed to connect to MongoDB:', error.message);
  });

// --- Define what a "Report" looks like in the database ---
// This is called a "schema" — basically a blueprint for every report.
const reportSchema = new mongoose.Schema({
  description: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Turn that blueprint into something we can actually use to save/read data.
const Report = mongoose.model('Report', reportSchema);

// --- Route 1: SAVE a new report ---
// Triggered when the frontend sends a POST request to /reports
app.post('/reports', async (req, res) => {
  try {
    const { description, lat, lng } = req.body;

    const newReport = new Report({ description, lat, lng });
    await newReport.save();   // actually writes it into MongoDB

    res.status(201).json(newReport);   // send the saved report back as confirmation
  } catch (error) {
    res.status(500).json({ error: 'Failed to save report' });
  }
});

// --- Route 2: GET all reports ---
// Triggered when the frontend sends a GET request to /reports
app.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find();   // fetch everything saved so far
    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Simple homepage route, same as before
app.get('/', (req, res) => {
  res.send('CleanSpot backend is running!');
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
