const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

require('./config/database');

const blogRoutes = require('./routes/blog');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
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
    endpoints: {
      health: { method: 'GET', path: '/api/health', description: 'Health check' },
      auth: {
        base: '/api/auth',
        endpoints: [
          { method: 'POST', path: '/api/auth/register', description: 'Register new user' },
          { method: 'POST', path: '/api/auth/login', description: 'Login user' },
          { method: 'GET', path: '/api/auth/me', description: 'Get current user profile (requires token)' }
        ]
      },
      blog: {
        base: '/api/blog',
        endpoints: [
          { method: 'GET', path: '/api/blog/categories', description: 'Get all categories' },
          { method: 'GET', path: '/api/blog/categories/:slug', description: 'Get category by slug' }
        ]
      }
    }
  });
});

// ============================================
// API BASE ROUTE INFO
// ============================================
app.get('/api/auth', (req, res) => {
  res.json({
    name: 'Lionheart Auth API',
    endpoints: [
      { method: 'POST', path: '/api/auth/register', description: 'Register new user' },
      { method: 'POST', path: '/api/auth/login', description: 'Login user' },
      { method: 'GET', path: '/api/auth/me', description: 'Get current user profile' }
    ]
  });
});

app.get('/api/blog', (req, res) => {
  res.json({
    name: 'Lionheart Blog API',
    endpoints: [
      { method: 'GET', path: '/api/blog/categories', description: 'Get all categories' },
      { method: 'GET', path: '/api/blog/categories/:slug', description: 'Get category by slug' }
    ]
  });
});

// ============================================
// API ROUTES
// ============================================
app.use('/api/blog', blogRoutes);
app.use('/api/auth', authRoutes);

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
  console.log(`📡 Health: http://localhost:${PORT}/api/health`);
  console.log(`📚 API Info: http://localhost:${PORT}/api`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`📝 Blog: http://localhost:${PORT}/api/blog`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
});
