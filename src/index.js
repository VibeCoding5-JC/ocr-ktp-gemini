const express = require('express');
const cors = require('cors');
const path = require('path');
const { port } = require('./config');
const ktpRoutes = require('./routes/ktpRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, '../public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api', ktpRoutes);

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 OCR KTP Server running on http://localhost:${port}`);
  console.log(`📝 API Endpoint: http://localhost:${port}/api/extract-ktp`);
  console.log(`💻 Frontend: http://localhost:${port}`);
});

module.exports = app;
