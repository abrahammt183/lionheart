const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import database (this connects it)
require('./config/database');

// Import routes
const blogRoutes = require('./routes/blog');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
  res.json({
    status: '🦁 Lionheart is alive!',
    timestamp: new Date().toISOString(),
    version: '0.1.0'
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: 'Lionheart API',
    version: '0.1.0',
    message: 'One Heart. Many Channels.',
    endpoints: [
      { method: 'GET', path: '/api/health', description: 'Health check' },
      { method: 'GET', path: '/api/blog/categories', description: 'Get all categories' },
      { method: 'GET', path: '/api/blog/categories/:slug', description: 'Get category by slug' }
    ]
  });
});

// ============================================
// API ROUTES
// ============================================
app.use('/api/blog', blogRoutes);

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  });
});

// ============================================
// ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`🦁 Lionheart API is running!`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 Categories: http://localhost:${PORT}/api/blog/categories`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
});
