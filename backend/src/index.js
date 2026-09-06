const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

require('./config/database');

const blogRoutes = require('./routes/blog');
const authRoutes = require('./routes/auth');
const commentRoutes = require('./routes/comments');
const mediaRoutes = require('./routes/media');
const productRoutes = require('./routes/products');

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
      auth: { base: '/api/auth', description: 'Authentication endpoints' },
      blog: { base: '/api/blog', description: 'Blog endpoints' },
      comments: { base: '/api/comments', description: 'Comments endpoints' },
      media: { base: '/api/media', description: 'Media endpoints' },
      products: { base: '/api/products', description: 'Store products endpoints' }
    }
  });
});

// Base route info
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
      { method: 'GET', path: '/api/blog/categories/:slug', description: 'Get category by slug' },
      { method: 'GET', path: '/api/blog/posts', description: 'Get published posts' },
      { method: 'GET', path: '/api/blog/posts/:slug', description: 'Get single post' },
      { method: 'GET', path: '/api/blog/posts/category/:slug', description: 'Posts by category' },
      { method: 'GET', path: '/api/blog/search', description: 'Search posts' }
    ]
  });
});

app.get('/api/comments', (req, res) => {
  res.json({
    name: 'Lionheart Comments API',
    endpoints: [
      { method: 'GET', path: '/api/comments/post/:postId', description: 'Get comments for a post' },
      { method: 'GET', path: '/api/comments/:id/replies', description: 'Get replies to a comment' },
      { method: 'POST', path: '/api/comments', description: 'Create a comment' },
      { method: 'PUT', path: '/api/comments/:id/status', description: 'Update comment status (admin)' },
      { method: 'DELETE', path: '/api/comments/:id', description: 'Delete comment (admin)' },
      { method: 'GET', path: '/api/comments/pending', description: 'Get pending comments (admin)' }
    ]
  });
});

app.get('/api/media', (req, res) => {
  res.json({
    name: 'Lionheart Media API',
    endpoints: [
      { method: 'GET', path: '/api/media/post/:postId', description: 'Get all media for a post' },
      { method: 'GET', path: '/api/media/post/:postId/cover', description: 'Get cover image for a post' },
      { method: 'POST', path: '/api/media', description: 'Add media to a post (admin/editor)' },
      { method: 'PUT', path: '/api/media/:id', description: 'Update media (admin/editor)' },
      { method: 'DELETE', path: '/api/media/:id', description: 'Delete media (admin)' },
      { method: 'DELETE', path: '/api/media/post/:postId', description: 'Delete all media for a post (admin)' }
    ]
  });
});

app.get('/api/products', (req, res) => {
  res.json({
    name: 'Lionheart Products API',
    endpoints: [
      { method: 'GET', path: '/api/products', description: 'Get all active products' },
      { method: 'GET', path: '/api/products/:slug', description: 'Get a single product' },
      { method: 'GET', path: '/api/products/category/:slug', description: 'Products by category' },
      { method: 'POST', path: '/api/products', description: 'Create a product (admin)' },
      { method: 'PUT', path: '/api/products/:id', description: 'Update a product (admin)' },
      { method: 'DELETE', path: '/api/products/:id', description: 'Delete a product (admin)' },
      { method: 'PATCH', path: '/api/products/:id/stock', description: 'Update stock (admin)' }
    ]
  });
});

// API Routes
app.use('/api/blog', blogRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/products', productRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  console.error(err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`🦁 Lionheart API is running!`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`📡 Health: http://localhost:${PORT}/api/health`);
  console.log(`📚 API Info: http://localhost:${PORT}/api`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`📝 Blog: http://localhost:${PORT}/api/blog`);
  console.log(`💬 Comments: http://localhost:${PORT}/api/comments`);
  console.log(`🖼️  Media: http://localhost:${PORT}/api/media`);
  console.log(`🛒 Products: http://localhost:${PORT}/api/products`);
});
